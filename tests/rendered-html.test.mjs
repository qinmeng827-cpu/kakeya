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
  assert.match(html, /面积可以是零，但二维里的集合仍/);
  assert.match(html, /04 \/ A CENTURY OF PROGRESS/);
  assert.match(html, /动画只讲思路，不负责替代数学证明/);
  assert.match(html, /加厚线段、限制拥挤/);
  assert.match(html, /数学家把“复杂得像整个空间”说成“满维”/);
  assert.match(html, /三维挂谷集合猜想是王虹与 Joshua Zahl 的共同成果/);
});

test("keeps interactive models explicit about scope and removes fake estimates", async () => {
  const [page, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /projectiveDirections/);
  assert.match(page, /排版调节台/);
  assert.match(page, /typographyStorageKey/);
  assert.match(page, /titleLeading/);
  assert.match(page, /恢复默认/);
  assert.match(page, /复制设置/);
  assert.match(page, /DAVIES · PLANAR THEOREM · 1971/);
  assert.match(page, /当前展示 25 个有限采样方向/);
  assert.match(page, /不输出体积估计/);
  assert.match(page, /维数结论不是由动画拟合得到/);
  assert.match(page, /非偏微分方程数值解/);
  assert.match(page, /n ≥ 4 仍开放/);
  assert.doesNotMatch(page, /并集占据率估计|dimensionEstimate|检测到异常聚集|方向覆盖 100%/);

  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /--font-serif-cn:/);
  assert.match(css, /--type-display-adjust:/);
  assert.match(css, /--type-title-leading-adjust:/);
  assert.match(css, /\.typography-toggle/);
  assert.match(css, /\.typography-panel/);
  assert.match(css, /--font-serif-cn:\s*var\(--font-source-han-serif\)/);
  assert.match(css, /\.hero h1[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.question-heading h2,[\s\S]*?\.dimension-top h2[\s\S]*?font-weight:\s*700/);
  assert.match(css, /\.site-header nav a,[\s\S]*?font-size:\s*17px/);
  assert.match(css, /\.section-index[\s\S]*?font:\s*650 14px/);
  assert.match(css, /\.timeline-explorer[\s\S]*?grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.timeline[\s\S]*?grid-row:\s*1\s*\/\s*span 2/);
  assert.match(css, /\.era-stage[\s\S]*?grid-column:\s*2/);
  assert.match(css, /\.era-derivation[\s\S]*?grid-column:\s*2/);
  assert.match(layout, /Noto_Serif_SC/);
  assert.match(layout, /variable:\s*"--font-source-han-serif"/);
  assert.match(layout, /weight:\s*"700"/);
  await access(new URL("../public/hong-wang-portrait.jpg", import.meta.url));
});
