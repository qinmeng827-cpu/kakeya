import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const basePath = "/kakeya";
const siteUrl = "https://qinmeng827-cpu.github.io/kakeya";
const root = process.cwd();
const clientDir = resolve(root, "dist/client");
const outputDir = resolve(root, "docs");
const workerUrl = pathToFileURL(resolve(root, "dist/server/index.js"));
workerUrl.searchParams.set("github-pages-export", `${process.pid}-${Date.now()}`);

const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(`Static export failed: received ${response.status}`);
}

let html = await response.text();
html = html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${basePath}/`);
html = html.replaceAll("http://localhost:3000/", `${siteUrl}/`);
html = html.replace(
  /url\((?:["']?)(?:file:\/\/\/)?[A-Z]:[^)]*?\.vinext[\\/]fonts[\\/]([^)'"\s]+)(?:["']?)\)/gi,
  (_match, fontPath) => `url("${basePath}/assets/_vinext_fonts/${fontPath.replaceAll("\\", "/")}")`,
);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDir, "index.html"), html),
  writeFile(resolve(outputDir, "404.html"), html),
  writeFile(resolve(outputDir, ".nojekyll"), ""),
]);

console.log(`GitHub Pages files written to ${outputDir}`);
