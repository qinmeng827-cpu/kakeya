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

// The static export needs GitHub Pages' /kakeya/ asset base, but the
// ChatGPT Sites deployment uses the root base. Restore the normal build so a
// later Sites package cannot accidentally inherit the GitHub-only paths.
const siteBuild = spawn("npm run build", {
  env: process.env,
  shell: true,
  stdio: "inherit",
});
const [siteExitCode] = await once(siteBuild, "close");

if (siteExitCode !== 0) {
  process.exit(siteExitCode ?? 1);
}
