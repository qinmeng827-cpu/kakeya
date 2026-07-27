import { spawn } from "node:child_process";
import { once } from "node:events";

const build = spawn("npm run build", {
  env: { ...process.env, GITHUB_PAGES: "1" },
  shell: true,
  stdio: "inherit",
});
const [exitCode] = await once(build, "close");

if (exitCode !== 0) {
  process.exit(exitCode ?? 1);
}

await import("./export-github-pages.mjs");
