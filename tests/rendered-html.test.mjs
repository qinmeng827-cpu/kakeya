import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
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
}

test("server-renders the Kakeya exhibition and its scientific framing", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>每一个方向，都装进三维｜王虹与三维挂谷猜想<\/title>/i);
  assert.match(html, /王虹与 Joshua Zahl 证明/);
  assert.match(html, /PROJECTIVE DIRECTION SAMPLER/);
  assert.match(html, /Davies 证明二维挂谷集合满维/);
  assert.match(html, /04 \/ A CENTURY OF PROGRESS/);
  assert.match(html, /概念演示帮助理解思想演进，不替代各时期的严格论证/);
  assert.match(html, /三维挂谷集合猜想是王虹与 Joshua Zahl 的共同成果/);
});

test("keeps interactive models explicit about scope and removes fake estimates", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /projectiveDirections/);
  assert.match(page, /DAVIES · PLANAR THEOREM · 1971/);
  assert.match(page, /当前展示 25 个有限采样方向/);
  assert.match(page, /不输出体积估计/);
  assert.match(page, /维数结论不是由动画拟合得到/);
  assert.match(page, /非偏微分方程数值解/);
  assert.match(page, /n ≥ 4 仍开放/);
  assert.doesNotMatch(page, /并集占据率估计|dimensionEstimate|检测到异常聚集|方向覆盖 100%/);

  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  await access(new URL("../public/hong-wang-portrait.jpg", import.meta.url));
});
