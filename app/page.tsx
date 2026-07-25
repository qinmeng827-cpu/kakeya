"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Vec3 = { x: number; y: number; z: number };

const proofSteps = [
  {
    number: "01",
    title: "把线段放大成 δ-细管",
    text: "无限细的线段难以直接估计。证明先在尺度 δ 上，用长度为 1、半径约为 δ 的细管近似每个方向。",
  },
  {
    number: "02",
    title: "识别异常聚集",
    text: "真正的困难不是方向多，而是大量细管可能高度重叠。论文研究它们能否同时藏进同一个凸集。",
  },
  {
    number: "03",
    title: "在多个尺度间传递控制",
    text: "把空间逐层放大、分解，再追踪“拥挤”如何随尺度变化。局部结构与整体体积由此联系起来。",
  },
  {
    number: "04",
    title: "推出并集几乎最大",
    text: "若细管没有异常地集中在凸集内，它们的并集必须占据几乎最大的体积；异常情形则被进一步分解和排除。",
  },
  {
    number: "05",
    title: "让 δ 趋近于 0",
    text: "离散尺度上的体积估计最终给出：三维挂谷集合的 Minkowski 维数和 Hausdorff 维数都等于 3。",
  },
];

const timeline = [
  ["1917", "挂谷宗一提出“转针”问题：一根单位线段改变方向，最少需要多大区域？"],
  ["1919—1928", "Besicovitch 展示了反直觉现象：若不要求区域凸，包含所有方向线段的集合可以拥有任意小面积。"],
  ["1970s", "挂谷集合进入调和分析核心问题；它与傅里叶分析、波的传播和偏微分方程形成深刻联系。"],
  ["1990s—2020s", "多代数学家不断提高维数下界，并发展多尺度、组合几何与多项式方法。"],
  ["2025.02", "王虹与 Joshua Zahl 公布 127 页论文，证明三维挂谷集合猜想。"],
  ["2026.07", "王虹在费城国际数学家大会获菲尔兹奖，成为该奖历史上第三位女性得主。"],
];

const sources = [
  {
    label: "国际数学联盟",
    title: "Fields Medals 2026",
    href: "https://www.mathunion.org/imu-awards/fields-medal/fields-medals-2026",
  },
  {
    label: "原始论文",
    title: "Wang–Zahl, arXiv:2502.17655",
    href: "https://arxiv.org/abs/2502.17655",
  },
  {
    label: "IHES",
    title: "Hong Wang awarded the 2026 Fields Medal",
    href: "https://www.ihes.fr/en/hong-wang2026-fields-medal/",
  },
  {
    label: "NYU Courant",
    title: "Hong Wang Solves Kakeya Set Conjecture",
    href: "https://math.nyu.edu/dynamic/news/84/",
  },
  {
    label: "科普长文",
    title: "Quanta · Living Fully in the Math World",
    href: "https://www.quantamagazine.org/hong-wang-wins-2026-fields-medal-the-third-woman-ever-20260723/",
  },
];

function fibonacciSphere(count: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }
  return points;
}

function rotatePoint(point: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x1 = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  return {
    x: x1,
    y: point.y * cp - z1 * sp,
    z: point.y * sp + z1 * cp,
  };
}

function DirectionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [delta, setDelta] = useState(0.018);
  const [showTubes, setShowTubes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sampleCount, setSampleCount] = useState(96);
  const yawRef = useRef(-0.45);
  const pitchRef = useRef(0.28);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const points = useMemo(() => fibonacciSphere(sampleCount), [sampleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let animation = 0;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 420);
      if (canvas.width !== Math.floor(width * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (autoRotate && !reduceMotion) yawRef.current += 0.0017;
      frame += 1;

      const centerX = width * 0.5;
      const centerY = height * 0.49;
      const scale = Math.min(width, height) * 0.38;

      const projected = points
        .map((point, index) => {
          const rotated = rotatePoint(point, yawRef.current, pitchRef.current);
          return { ...rotated, index };
        })
        .sort((a, b) => a.z - b.z);

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 1.15);
      halo.addColorStop(0, "rgba(78, 232, 214, .12)");
      halo.addColorStop(0.55, "rgba(29, 126, 158, .055)");
      halo.addColorStop(1, "rgba(5, 8, 14, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      projected.forEach((point) => {
        const depth = (point.z + 1) / 2;
        const x = point.x * scale;
        const y = point.y * scale;
        const emphasis = point.index === Math.floor(sampleCount * 0.38);
        ctx.beginPath();
        ctx.moveTo(-x, -y);
        ctx.lineTo(x, y);
        ctx.lineCap = "round";
        ctx.lineWidth = emphasis ? Math.max(2, delta * 150) : showTubes ? Math.max(0.7, delta * 72) : 0.7;
        ctx.strokeStyle = emphasis
          ? "rgba(247, 206, 112, .95)"
          : `rgba(100, 225, 239, ${0.09 + depth * 0.35})`;
        ctx.stroke();
      });
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(165, 235, 229, .12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      animation = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animation);
  }, [autoRotate, delta, points, sampleCount, showTubes]);

  const handlePointerDown = (event: React.PointerEvent) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    setAutoRotate(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    yawRef.current += (event.clientX - dragRef.current.x) * 0.008;
    pitchRef.current = Math.max(
      -1.1,
      Math.min(1.1, pitchRef.current + (event.clientY - dragRef.current.y) * 0.006),
    );
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="lab-shell" ref={wrapRef}>
      <div className="lab-readout">
        <span>FINITE DIRECTION SAMPLER</span>
        <span>{sampleCount} DIR · δ {delta.toFixed(3)}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="direction-canvas"
        aria-label={`三维方向的有限采样示意，共 ${sampleCount} 个方向，细管半径参数 δ=${delta.toFixed(3)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="lab-caption">
        <span className="pulse-dot" />
        有限方向采样 · 共中心仅用于观察方向，不是挂谷集合构造
      </div>
      <div className="lab-controls" aria-label="方向采样实验控制">
        <label>
          <span>
            管厚 δ <strong>{delta.toFixed(3)}</strong>
          </span>
          <input
            type="range"
            min="0.006"
            max="0.045"
            step="0.001"
            value={delta}
            onChange={(event) => setDelta(Number(event.target.value))}
          />
        </label>
        <label>
          <span>
            方向数 <strong>{sampleCount}</strong>
          </span>
          <input
            type="range"
            min="32"
            max="160"
            step="16"
            value={sampleCount}
            onChange={(event) => setSampleCount(Number(event.target.value))}
          />
        </label>
        <div className="control-buttons">
          <button type="button" aria-pressed={showTubes} onClick={() => setShowTubes((value) => !value)}>
            {showTubes ? "显示 δ-细管" : "显示线段"}
          </button>
          <button type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate((value) => !value)}>
            {autoRotate ? "暂停旋转" : "自动旋转"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProofRoute() {
  const [active, setActive] = useState(0);
  return (
    <div className="proof-layout">
      <div className="proof-nav" role="tablist" aria-label="证明路线">
        {proofSteps.map((step, index) => (
          <button
            key={step.number}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index)}
          >
            <span>{step.number}</span>
            {step.title}
          </button>
        ))}
      </div>
      <div className="proof-stage" role="tabpanel">
        <div className={`proof-visual proof-visual-${active}`} aria-hidden="true">
          {Array.from({ length: 34 }, (_, index) => (
            <i
              key={index}
              style={
                {
                  "--i": index,
                  "--r": `${(index * 137.5) % 180}deg`,
                  "--x": `${12 + ((index * 37) % 76)}%`,
                  "--y": `${14 + ((index * 53) % 72)}%`,
                } as React.CSSProperties
              }
            />
          ))}
          <b>{proofSteps[active].number}</b>
        </div>
        <div className="proof-copy">
          <span>PROOF MAP / CONCEPTUAL VIEW</span>
          <h3>{proofSteps[active].title}</h3>
          <p>{proofSteps[active].text}</p>
          <small>此图帮助理解证明结构，不是对论文论证或数值的复现。</small>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dimension, setDimension] = useState<"2D" | "3D">("3D");

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="回到顶部">
          K <span>/</span> 3
        </a>
        <nav aria-label="主要导航">
          <a href="#question">问题</a>
          <a href="#theorem">定理</a>
          <a href="#proof">证明地图</a>
          <a href="#person">王虹</a>
        </nav>
        <a className="paper-link" href="https://arxiv.org/abs/2502.17655" target="_blank" rel="noreferrer">
          阅读论文 ↗
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span>2026 FIELDS MEDAL</span>
            <span>HARMONIC ANALYSIS × GEOMETRY</span>
          </div>
          <h1>
            每一个方向，
            <br />
            都装进<span>三维</span>
          </h1>
          <p className="hero-lead">
            王虹与 Joshua Zahl 证明：任何包含所有方向单位线段的三维挂谷集合，
            <em>Hausdorff 维数与 Minkowski 维数都必须等于 3。</em>
          </p>
          <div className="hero-actions">
            <a href="#question">进入问题 <span>↓</span></a>
            <span>预计阅读 8 分钟</span>
          </div>
        </div>
        <DirectionLab />
        <div className="hero-facts">
          <div>
            <strong>1917</strong>
            <span>挂谷问题提出</span>
          </div>
          <div>
            <strong>127</strong>
            <span>论文页数</span>
          </div>
          <div>
            <strong>dim = 3</strong>
            <span>三维满维数结论</span>
          </div>
        </div>
      </section>

      <section className="question-section" id="question">
        <div className="section-index">01 / THE QUESTION</div>
        <div className="question-heading">
          <p>先别急着想象一根真实的针。</p>
          <h2>
            这里的“针”，是一条
            <br />
            <span>无限细、长度为 1 的线段。</span>
          </h2>
        </div>
        <div className="question-grid">
          <div className="needle-card">
            <div className="needle-orbit" aria-hidden="true">
              {Array.from({ length: 19 }, (_, index) => (
                <i key={index} style={{ transform: `rotate(${index * 9.47}deg)` }} />
              ))}
              <b />
            </div>
            <div className="needle-labels">
              <span>单位长度 1</span>
              <span>包含每一个方向</span>
            </div>
          </div>
          <div className="question-copy">
            <p>
              一个挂谷集合是在 <strong>Rⁿ</strong> 中包含每个方向的一条单位线段的紧集。
              这些线段不必围绕同一个中心，也不必通过同一点——它们可以移动、穿插并极其复杂地重叠。
            </p>
            <blockquote>
              “集合的体积可以为零，但它是否仍必须拥有整个环境空间的维数？”
            </blockquote>
            <p className="micro-note">
              这正是挂谷集合猜想。二维情形早已解决；Wang–Zahl 在 2025 年解决了三维情形。更高维仍然开放。
            </p>
          </div>
        </div>
      </section>

      <section className="dimension-section" id="theorem">
        <div className="dimension-top">
          <div>
            <div className="section-index light">02 / SIZE IS NOT VOLUME</div>
            <h2>“零体积”不等于“低维”。</h2>
          </div>
          <div className="dimension-switch" role="group" aria-label="切换二维和三维说明">
            <button type="button" className={dimension === "2D" ? "active" : ""} onClick={() => setDimension("2D")}>
              R²
            </button>
            <button type="button" className={dimension === "3D" ? "active" : ""} onClick={() => setDimension("3D")}>
              R³
            </button>
          </div>
        </div>
        <div className="dimension-display">
          <div className="giant-dimension" aria-hidden="true">
            {dimension === "3D" ? "3" : "2"}
          </div>
          <div className="dimension-copy">
            <span>{dimension === "3D" ? "WANG–ZAHL THEOREM · 2025" : "BESICOVITCH · PLANAR CASE"}</span>
            <h3>
              {dimension === "3D"
                ? "在三维空间中，再稀薄的挂谷集合也必须是满维的。"
                : "在二维平面中，挂谷集合可以面积为零，但维数仍然等于 2。"}
            </h3>
            <p>
              {dimension === "3D"
                ? "“维数为 3”并不声称集合有正体积。它说明无论怎样在小尺度观察，这个集合都复杂到无法被压成真正的曲面、曲线或更低维对象。"
                : "Besicovitch 的构造揭示了面积与维数的分离：线段可以通过精细重叠把面积压到零，但所有方向共同留下的尺度复杂度仍然充满平面。"}
            </p>
            <div className="formula">
              dim<sub>H</sub>(K) = dim<sub>M</sub>(K) = {dimension === "3D" ? "3" : "2"}
            </div>
          </div>
          <div className="dimension-legend">
            <div>
              <span>体积 / 面积</span>
              <strong>可以是 0</strong>
            </div>
            <div>
              <span>Hausdorff 维数</span>
              <strong>必须满维</strong>
            </div>
            <div>
              <span>Minkowski 维数</span>
              <strong>必须满维</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-section" id="proof">
        <div className="section-heading-row">
          <div>
            <div className="section-index">03 / THE PROOF MAP</div>
            <h2>从一根线，到一片不可过度重叠的管束。</h2>
          </div>
          <p>
            论文的严格证明长达 127 页。这里不伪装复现证明，而是展示它的逻辑骨架：
            <strong>离散化、控制聚集、多尺度推进、回到维数。</strong>
          </p>
        </div>
        <ProofRoute />
      </section>

      <section className="timeline-section">
        <div className="section-index light">04 / A CENTURY OF PROGRESS</div>
        <div className="timeline-heading">
          <h2>这不是一夜之间的胜利。</h2>
          <p>一个世纪的想法、反例与工具，在三维空间里会合。</p>
        </div>
        <div className="timeline">
          {timeline.map(([year, text], index) => (
            <article key={year}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{year}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="person-section" id="person">
        <div className="person-photo">
          <img
            src="/hong-wang-fields-2026.jpg"
            alt="2026 年菲尔兹奖得主、数学家王虹"
          />
          <span>IMAGE SOURCE · IHES · 2026</span>
        </div>
        <div className="person-copy">
          <div className="section-index">05 / THE MATHEMATICIAN</div>
          <p className="person-kicker">HONG WANG · 王虹</p>
          <h2>她研究的，是波如何传播，也是几何能被压缩到什么程度。</h2>
          <p>
            王虹出生于广西桂林，本科毕业于北京大学，2019 年在 MIT 获博士学位，导师为 Larry Guth。
            她现任 IHES 常任教授及纽约大学柯朗数学科学研究所 Silver Professor，研究横跨调和分析、几何测度论与偏微分方程。
          </p>
          <p>
            2026 年菲尔兹奖的官方引文覆盖她在局部光滑、傅里叶限制、Falconer 距离集、Furstenberg 集和三维挂谷问题上的一系列贡献。
          </p>
          <div className="coauthor-note">
            <span>共同证明者</span>
            <strong>Joshua Zahl</strong>
            <p>
              三维挂谷集合猜想是王虹与 Joshua Zahl 的共同成果。菲尔兹奖授予王虹个人，但网页始终保留成果的合作归属。
            </p>
          </div>
        </div>
      </section>

      <section className="award-section">
        <div className="medal-orbit" aria-hidden="true">
          <span>2026</span>
          <b>FIELDS</b>
          <i />
        </div>
        <div>
          <div className="section-index light">PHILADELPHIA · 23 JULY 2026</div>
          <h2>第三位获得菲尔兹奖的女性。</h2>
          <p>
            国际数学联盟在 2026 年国际数学家大会开幕式上向王虹颁发菲尔兹奖。
            她与于登同时成为首批获得这一奖项的中国籍数学家。
          </p>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="section-heading-row">
          <div>
            <div className="section-index">06 / SOURCES</div>
            <h2>从原始论文开始。</h2>
          </div>
          <p>页面中的定理、人物经历与奖项信息均来自原始论文和相关机构的官方材料。</p>
        </div>
        <div className="source-list">
          {sources.map((source, index) => (
            <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{source.label}</small>
              <strong>{source.title}</strong>
              <b>↗</b>
            </a>
          ))}
        </div>
      </section>

      <footer>
        <div className="brand">
          K <span>/</span> 3
        </div>
        <p>
          一个关于方向、尺度与维数的交互式数学展览。
          <br />
          严格定理与概念示意已在页面中分别标注。
        </p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}
