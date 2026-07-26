"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Vec3 = { x: number; y: number; z: number };
type Tube2D = { x: number; y: number; angle: number; gold?: boolean };

type TypographySettings = {
  display: number;
  section: number;
  body: number;
  ui: number;
  weight: 700 | 800 | 900;
  leading: number;
  titleLeading: number;
};

const defaultTypography: TypographySettings = {
  display: 0,
  section: 0,
  body: 0,
  ui: 0,
  weight: 700,
  leading: 0,
  titleLeading: 0,
};

const typographyStorageKey = "kakeya-typography-settings-v1";

const proofSteps = [
  {
    number: "01",
    title: "先给线段一点厚度",
    text: "原来的线段没有厚度，几乎无从谈起“它们合起来占多少空间”。第一步不是偷换问题，而是先给每条线段套上一根极细的“吸管”；吸管半径记作 δ。",
    input: "每个方向都有一条线段",
    operation: "给线段套上半径 δ 的细管",
    output: "一组可以测量的细管",
  },
  {
    number: "02",
    title: "找出挤成一团的地方",
    text: "细管相交并不奇怪；真正危险的是，它们能不能在每一个尺度上都偷偷挤进同一小块区域。这里要辨认哪些交叉正常，哪些拥挤已经不可能发生。",
    input: "一组可能互相重叠的细管",
    operation: "检查它们有没有挤进同一凸形区域",
    output: "重叠程度受到控制",
  },
  {
    number: "03",
    title: "像看地图一样不断缩放",
    text: "远看不拥挤，不代表放大后也安全。证明像在城市地图与街角之间来回切换：追踪局部的拥挤，会不会在更细的尺度上累积成整体问题。",
    input: "某一个放大倍数下的重叠情况",
    operation: "放大、拆分，再把结论传到下一层",
    output: "每个尺度都不失控",
  },
  {
    number: "04",
    title: "证明它们占的空间不会太小",
    text: "一旦异常抱团被排除，这些细管合在一起就不能凭空缩没：哪怕只保留每根细管的一部分，它们仍必须占据足够多的空间。",
    input: "已经控制好重叠的细管",
    operation: "估计所有细管合起来的体积",
    output: "得到一个不会塌缩的体积下界",
  },
  {
    number: "05",
    title: "最后把“吸管”变回线段",
    text: "最后让细管半径 δ 一点点缩到 0。前面的控制在每个小尺度上都成立，于是原来的集合再薄，也不可能被压成一张二维薄片或一条线。",
    input: "每个小尺度都成立的体积估计",
    operation: "让 δ 趋近于 0",
    output: "两种常用维数都等于 3",
  },
];

const timeline = [
  ["1917", "卡在哪里：针要转遍所有方向，到底需要多大空间？新语言：先把“有一条针”说得足够精确。"],
  ["1919—1928", "卡在哪里：直觉以为总要扫出一大片面积。新办法：允许针边转边移动，让不同方向尽量重叠。"],
  ["1970s", "卡在哪里：面积可以是零，但二维里的集合仍会不会像一条线？新结论：它仍可满维，细管也进入了波的分析。"],
  ["1990s—2020s", "卡在哪里：局部重叠能否在放大后失控？新工具：在不同尺度之间来回切换，追踪拥挤。"],
  ["2025.02", "卡在哪里：三维细管究竟能挤到多薄？新证明：集合可以没有体积，却不能降成一张面。"],
  ["2026.07", "成果如何归属：菲尔兹奖表彰王虹的一系列工作；三维定理由王虹与 Joshua Zahl 共同证明。"],
];

const timelineExperiments = [
  {
    kicker: "问题的诞生",
    title: "先试最简单的玩法：原地转针",
    action: "拖动角度，让针绕着同一个中心旋转。真正的挂谷问题更自由：针的中心也可以移动。",
    control: "针的方向",
    value: (parameter: number) => `${Math.round(parameter * 180)}°`,
    conclusion: "如果针只能原地转，它会扫出一个圆盘。允许它移动后，答案会离奇得多。",
  },
  {
    kicker: "反直觉构造",
    title: "让不同方向尽量挤在一起",
    action: "拖动重叠程度。方向数量不变，但线段会越来越集中。动画只演示思路，不会真的生成零面积集合。",
    control: "有限模型重叠参数",
    value: (parameter: number) => `${Math.round(parameter * 100)}%`,
    conclusion: "当方向越来越密、重叠越来越精细时，极限构造可以做到面积为零。这一步需要严格证明。",
  },
  {
    kicker: "分析学转向",
    title: "一束波，也会在空间里走成细管",
    action: "改变示意频率。傅里叶分析会把复杂的波拆成许多波包；每个波包主要沿着一根细管传播。",
    control: "示意频率",
    value: (parameter: number) => `2^${Math.round(1 + parameter * 7)}`,
    conclusion: "于是“细管能重叠多少”会影响我们对波的估计。几何问题和分析问题接上了。",
  },
  {
    kicker: "工具的积累",
    title: "从街区看到城市，再放大回街角",
    action: "提高分解层级，观察拥挤如何被逐层定位。这里的网格只是帮助理解，不等同于论文中的多项式分割。",
    control: "示意分解层级",
    value: (parameter: number) => `${1 + Math.round(parameter * 4)} 层`,
    conclusion: "这些工具能把“哪里挤、为什么挤”说得越来越精确，也让已知的维数下界不断提高。",
  },
  {
    kicker: "三维猜想解决",
    title: "把 127 页论文压成五个关卡",
    action: "移动进度，看看“给线段加厚、控制拥挤、跨尺度传递、估计体积、取极限”怎样接起来。",
    control: "证明进度",
    value: (parameter: number) => `${1 + Math.min(4, Math.floor(parameter * 5))} / 5`,
    conclusion: "结论很干脆：在三维空间里，这类集合的 Hausdorff 与 Minkowski 维数都等于 3。",
  },
  {
    kicker: "成果被确认",
    title: "一百多年，六个关键时刻",
    action: "推进时间轴，看看一个看似简单的转针游戏，怎样一步步变成现代调和分析中的核心问题。",
    control: "历史汇流",
    value: (parameter: number) => `${1917 + Math.round(parameter * 109)}`,
    conclusion: "菲尔兹奖属于王虹个人；三维挂谷定理的证明署名始终属于王虹与 Joshua Zahl 两人。",
  },
];

const timelineProofs = [
  {
    type: "问题定义",
    note: "1917 年还没有答案。挂谷宗一只是把“转针”这件事问得足够准确。",
    steps: [
      {
        title: "先把方向编号",
        body: "用 θ 给每个方向一个编号。每个方向配一根长度为 1 的线段，而且线段中心可以自由移动。",
        formula: "Iθ = xθ + [−1/2, 1/2]vθ",
      },
      {
        title: "再规定什么叫“装得下”",
        body: "我们要找一个集合 K：不管你指定哪个方向，K 里面都能找到一根完整的单位线段。",
        formula: "∀θ ∈ S¹，∃xθ，使 Iθ ⊂ K",
      },
      {
        title: "为什么移动中心会改变一切",
        body: "如果所有线段都绕同一点旋转，它们会铺满一个圆盘。可一旦允许边转边移动，线段就能大量重叠，面积可能大幅缩小。",
        formula: "共中心：|K| = π/4；1917 年时自由平移下界未知",
      },
      {
        title: "现代版本问得更狠",
        body: "就算面积或体积能缩到零，这个集合会不会仍然复杂得像整个环境空间？“维数是否满维”就是这个问题。",
        formula: "Kakeya 猜想：dim K = n",
      },
    ],
  },
  {
    type: "零面积构造",
    note: "这一时期给出反直觉答案：二维里，面积真的可以是零。下面只展示构造的骨架。",
    steps: [
      {
        title: "先只处理有限多个方向",
        body: "把所有方向近似成一张越来越密的方向表，再用狭长三角形装下相邻方向的线段。",
        formula: "ΘN = {θ₁,…,θN} ⊂ S¹",
      },
      {
        title: "像叠纸扇一样制造重叠",
        body: "把狭长三角形切开、平移，让它们的主体尽量叠在一起，同时保留原来覆盖的方向范围。这常用 Perron 树来描述。",
        formula: "方向范围保留，投影面积下降",
      },
      {
        title: "一轮一轮压缩",
        body: "每一轮都增加方向数量，并让承载区域更小。重叠越来越多，但每个目标方向仍保留一条完整线段。",
        formula: "|KN| < εN，且 εN → 0",
      },
      {
        title: "把无限多轮压缩合在一起",
        body: "经过极限过程，可以得到一个紧集：它包含所有方向的单位线段，Lebesgue 面积却等于零。",
        formula: "|K| = 0",
      },
    ],
  },
  {
    type: "分析学桥梁",
    note: "面积为零不等于“像一条线”。1970 年代证明了二维集合仍然满维，波的研究也开始借用这套几何。",
    steps: [
      {
        title: "零面积，但仍像整个平面一样复杂",
        body: "1971 年 Roy Davies 证明，每个平面挂谷集合的 Hausdorff 维数都等于 2；Minkowski 维数也随之等于 2。",
        formula: "dimH K = dimM K = 2",
      },
      {
        title: "先把复杂的波分成小块",
        body: "傅里叶分析会把频率空间切成许多小片。每一小片在真实空间里都有一个主要传播方向。",
        formula: "f = Σθ fθ",
      },
      {
        title: "每一小块大致沿细管传播",
        body: "继续分解后得到波包。它们的能量主要集中在相应细管附近，离开细管会迅速变弱，但并非完全为零。",
        formula: "fθ ≈ ΣT fT；fT 主要集中于 T",
      },
      {
        title: "细管拥挤，波也会拥挤",
        body: "如果许多细管在同一处重叠，对应的波包也会集中。这样一来，某些重要的分析估计就更难成立。",
        formula: "管束重叠 ↔ Lᵖ 范数增长",
      },
      {
        title: "几何进展会带动波动方程",
        body: "只要能更好地限制细管重叠，就能改进傅里叶限制、局部光滑以及相关偏微分方程中的估计。",
        formula: "挂谷型管束估计 → 分析估计中的关键几何输入",
      },
    ],
  },
  {
    type: "方法累积",
    note: "接下来的几十年没有一招制胜。不同工具从不同角度回答同一个问题：细管究竟能挤到什么程度？",
    steps: [
      {
        title: "把一根管当作“刷柄”",
        body: "先固定一根细管，再数所有与它相交的管。它们像刷毛一样散开，方向差异会限制它们挤进同一薄片。",
        formula: "multiplicity × union volume ≥ tube mass",
      },
      {
        title: "用一张代数曲面切开空间",
        body: "低次数多项式的零集像一把复杂的刀，把空间分成许多区域。穿过区域的管和贴着曲面走的管，要分别处理。",
        formula: "cellular case / algebraic case",
      },
      {
        title: "把局部结构装进“颗粒”",
        body: "把近似平行或贴着同一方向走的细管，装进不同大小的扁平盒。这样就能记录它们在局部怎样抱团。",
        formula: "δ ≤ ρ ≤ 1 的层级结构",
      },
      {
        title: "从粗地图走到细地图",
        body: "先在较粗的尺度证明控制，再放大到更细的尺度。遇到异常结构，就把它单独分类并继续拆解。",
        formula: "尺度 ρ 的控制 + 重标度 δ/ρ 的控制 → 尺度 δ（结构示意）",
      },
    ],
  },
  {
    type: "三维定理",
    note: "下面是 Wang–Zahl 证明的主干。它能告诉你每一步为什么出现，但不能替代 127 页的严格论证。",
    steps: [
      {
        title: "把看不见的线段换成可测量的细管",
        body: "在每个相隔约 δ 的方向上选一条线段，再给它加上半径约 δ 的厚度。由此得到一组有限、可估计的细管。",
        formula: "# {T∈𝒯 : T⊂W} ≲ |W| / |T|",
      },
      {
        title: "把维数问题改写成体积问题",
        body: "证明不直接计算维数，而是估计这些细管合起来至少占多少体积。论文允许每根管只取一部分，这部分称为 shading。",
        formula: "在归一化 Kakeya 情形：|⋃T Y(T)| ≳ε δ^ε",
      },
      {
        title: "拆开那些看起来过分拥挤的管束",
        body: "把聚在凸形区域里的管分配进扁平棱柱，再判断它们属于哪一种可控情形。这样能把“拥挤”变成可计算的条件。",
        formula: "凸集分解 → 扁平棱柱中的可控子族（结构示意）",
      },
      {
        title: "把粗尺度的控制传到细尺度",
        body: "证明结合双尺度颗粒分解、尺度归纳和因子化工具，分别处理会长期黏在一起的结构与不会黏住的结构。",
        formula: "粗尺度 ρ + 重标度 δ/ρ → 尺度 δ",
      },
      {
        title: "让 δ 缩到 0，回到原来的集合",
        body: "细管在每个小尺度都占有足够体积。令 δ 趋近 0，就能排除低于 3 的 Minkowski 维数或 Hausdorff 维数。",
        formula: "dimM K = dimH K = 3",
      },
    ],
  },
  {
    type: "成果确认",
    note: "这一栏不再讲证明，而是把论文结论、未解决问题和成果归属说清楚。",
    steps: [
      {
        title: "论文公开",
        body: "2025 年 2 月，王虹与 Joshua Zahl 公开 127 页论文及完整技术证明。",
        formula: "arXiv:2502.17655",
      },
      {
        title: "解决了什么，又没有解决什么",
        body: "论文解决的是三维挂谷集合的维数猜想。四维及以上仍然开放，三维 Kakeya maximal function 猜想也不在这篇论文的结论中。",
        formula: "n = 3 已解决；n ≥ 4 仍开放",
      },
      {
        title: "合作归属",
        body: "三维挂谷定理是王虹与 Joshua Zahl 的共同成果，网页在所有结论处保持共同署名。",
        formula: "Hong Wang + Joshua Zahl",
      },
      {
        title: "菲尔兹奖不只对应这一篇论文",
        body: "2026 年菲尔兹奖授予王虹个人，表彰她在调和分析与几何测度论中的一系列成果；三维挂谷定理只是其中一项。",
        formula: "theorem ≠ medal citation 的全部",
      },
    ],
  },
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
  {
    label: "二维定理",
    title: "Davies' planar Kakeya theorem",
    href: "https://arxiv.org/abs/1511.00442",
  },
  {
    label: "证明综述",
    title: "Guth · The Kakeya conjecture, after Wang and Zahl",
    href: "https://arxiv.org/abs/2604.03416",
  },
  {
    label: "北京大学",
    title: "Peking University alumna Hong Wang wins the 2026 Fields Medal",
    href: "https://newsen.pku.edu.cn/news_events/news/focus/15623.html",
  },
  {
    label: "南开大学",
    title: "Joshua Zahl 全职受聘南开大学讲席教授",
    href: "https://news.nankai.edu.cn/ywsd/system/2025/06/23/030067711.shtml",
  },
  {
    label: "Clay Mathematics Institute",
    title: "Joshua Zahl · Clay Research Award",
    href: "https://www.claymath.org/people/joshua-zahl/",
  },
];

function projectiveDirections(count: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    // A line direction is unoriented: v and −v describe the same direction.
    // Sampling one closed hemisphere avoids double-counting antipodal vectors.
    const y = (i + 0.5) / count;
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

function makeNeedles(seed = 0): Tube2D[] {
  return Array.from({ length: 25 }, (_, index) => {
    const lane = ((index * 11 + seed * 7) % 25) / 24;
    return {
      x: 0.19 + lane * 0.62,
      y: 0.28 + 0.42 * (0.5 + 0.5 * Math.sin(index * 1.71 + lane * 2.4 + seed)),
      angle: (index / 24) * Math.PI,
      gold: index % 6 === 0,
    };
  });
}

function KakeyaDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [needles, setNeedles] = useState<Tube2D[]>(() => makeNeedles());
  const [selected, setSelected] = useState(6);
  const [seed, setSeed] = useState(0);
  const dragRef = useRef({ active: false, index: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 360);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const length = Math.min(width, height) * 0.31;
      needles.forEach((needle, index) => {
        const cx = needle.x * width;
        const cy = needle.y * height;
        const isSelected = index === selected;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needle.angle);
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.lineCap = "round";
        ctx.lineWidth = isSelected ? 4 : needle.gold ? 2.2 : 1.25;
        ctx.strokeStyle = isSelected
          ? "rgba(20, 107, 91, .96)"
          : needle.gold
            ? "rgba(168, 121, 44, .88)"
            : "rgba(23, 95, 82, .34)";
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? 5 : needle.gold ? 2.7 : 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "#f3c561"
          : needle.gold
            ? "rgba(168, 121, 44, .92)"
            : "rgba(23, 95, 82, .36)";
        ctx.fill();
      });
    };

    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    draw();
    return () => observer.disconnect();
  }, [needles, selected]);

  const locate = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0.1, Math.min(0.88, (event.clientY - rect.top) / rect.height)),
      width: rect.width,
      height: rect.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = locate(event);
    let nearest = 0;
    let distance = Infinity;
    needles.forEach((needle, index) => {
      const current = Math.hypot((needle.x - point.x) * point.width, (needle.y - point.y) * point.height);
      if (current < distance) {
        distance = current;
        nearest = index;
      }
    });
    setSelected(nearest);
    dragRef.current = { active: true, index: nearest };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const point = locate(event);
    const draggedIndex = dragRef.current.index;
    setNeedles((current) =>
      current.map((needle, index) => (index === draggedIndex ? { ...needle, x: point.x, y: point.y } : needle)),
    );
  };

  const rotateSelected = (degrees: number) => {
    setNeedles((current) =>
      current.map((needle, index) =>
        index === selected
          ? {
              ...needle,
              angle:
                ((needle.angle + (degrees * Math.PI) / 180) % Math.PI + Math.PI) %
                Math.PI,
            }
          : needle,
      ),
    );
  };

  const reshuffle = () => {
    const next = seed + 1;
    setSeed(next);
    setNeedles(makeNeedles(next));
    setSelected(6);
  };

  return (
    <div className="needle-interactive">
      <canvas
        ref={canvasRef}
        className="kakeya-canvas"
        aria-label="可交互的有限方向线段模型：拖动线段中心，滚轮或按钮改变所选方向"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          dragRef.current.active = false;
        }}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onWheel={(event) => {
          event.preventDefault();
          rotateSelected(event.deltaY > 0 ? 4 : -4);
        }}
      />
      <div className="canvas-hint">拖动线段中心 · 滚轮旋转</div>
      <div className="needle-toolbar" aria-label="线段实验控制">
        <button type="button" onClick={() => rotateSelected(-10)} aria-label="逆时针旋转所选线段">−10°</button>
        <strong>{Math.round((((needles[selected]?.angle ?? 0) * 180) / Math.PI + 180) % 180)}°</strong>
        <button type="button" onClick={() => rotateSelected(10)} aria-label="顺时针旋转所选线段">+10°</button>
        <button type="button" onClick={reshuffle}>重新排布</button>
      </div>
    </div>
  );
}

function ProofVisual({ active }: { active: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [delta, setDelta] = useState(0.08);
  const [cluster, setCluster] = useState(0.72);
  const [scale, setScale] = useState(1);
  const [spread, setSpread] = useState(0.68);
  const [limit, setLimit] = useState(0.2);
  const [playing, setPlaying] = useState(false);
  const [clusterCenter, setClusterCenter] = useState({ x: 0.48, y: 0.47 });
  const dragRef = useRef<{ active: boolean; kind: "tube" | "cluster" | "spread"; index: number }>({
    active: false,
    kind: "tube",
    index: 0,
  });
  const [tubeOffsets, setTubeOffsets] = useState<Record<number, { x: number; y: number }>>({});

  useEffect(() => {
    if (!playing || active !== 4) return;
    const timer = window.setInterval(() => {
      setLimit((value) => (value >= 0.98 ? 0 : Math.min(1, value + 0.012)));
    }, 34);
    return () => window.clearInterval(timer);
  }, [active, playing]);

  useEffect(() => {
    if (active === 4) return;
    const timer = window.setTimeout(() => setPlaying(false), 0);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawTube = (
      x: number,
      y: number,
      length: number,
      angle: number,
      thickness: number,
      color: string,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.lineTo(length / 2, 0);
      ctx.lineCap = "round";
      ctx.lineWidth = thickness;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(rect.width, 360);
      const height = Math.max(rect.height, 420);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cyan = "rgba(95, 229, 216, .58)";
      const cyanSoft = "rgba(95, 229, 216, .20)";
      const gold = "rgba(242, 203, 114, .78)";
      const line = "rgba(133, 216, 206, .18)";

      if (active === 0) {
        const normalizedUnitLength = width * 0.105;
        const tubeDiameter = Math.max(1, 2 * delta * normalizedUnitLength);
        for (let index = 0; index < 32; index += 1) {
          const offset = tubeOffsets[index] ?? { x: 0, y: 0 };
          const x = width * (0.1 + (((index * 37) % 83) / 100) + offset.x);
          const y = height * (0.12 + (((index * 53) % 77) / 100) + offset.y);
          drawTube(
            x,
            y,
            normalizedUnitLength,
            ((index * 137.5) % 180) * (Math.PI / 180),
            tubeDiameter,
            index === dragRef.current.index ? gold : cyan,
          );
        }
      }

      if (active === 1) {
        const cx = width * clusterCenter.x;
        const cy = height * clusterCenter.y;
        const radiusX = width * (0.31 - cluster * 0.13);
        const radiusY = height * (0.28 - cluster * 0.1);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, -0.18, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(95, 229, 216, ${0.025 + cluster * 0.07})`;
        ctx.strokeStyle = "rgba(242, 203, 114, .62)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        for (let index = 0; index < 28; index += 1) {
          const influenced = index < Math.round(8 + cluster * 18);
          const baseX = width * (0.09 + (((index * 43) % 80) / 100));
          const baseY = height * (0.13 + (((index * 61) % 72) / 100));
          const pull = influenced ? cluster * 0.78 : 0;
          const x = baseX * (1 - pull) + (cx + Math.sin(index * 2.3) * radiusX * 0.58) * pull;
          const y = baseY * (1 - pull) + (cy + Math.cos(index * 1.7) * radiusY * 0.56) * pull;
          drawTube(
            x,
            y,
            width * 0.1,
            ((index * 127) % 180) * (Math.PI / 180),
            influenced ? 3 + cluster * 5 : 2,
            influenced ? cyanSoft : cyan,
          );
        }
      }

      if (active === 2) {
        const panels = [
          { x: 0.07, label: "放大 1×", density: 8 },
          { x: 0.38, label: "放大 δ⁻¹ᐟ²", density: 12 },
          { x: 0.69, label: "放大 δ⁻¹", density: 18 },
        ];
        panels.forEach((panel, panelIndex) => {
          const x = width * panel.x;
          const y = height * 0.2;
          const w = width * 0.24;
          const h = height * 0.5;
          const selected = panelIndex === scale;
          ctx.fillStyle = selected ? "rgba(242, 203, 114, .035)" : "transparent";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = selected ? gold : line;
          ctx.lineWidth = selected ? 2 : 1;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = selected ? gold : "rgba(183, 244, 238, .68)";
          ctx.font = "600 12px Arial";
          ctx.fillText(panel.label, x, y - 16);
          for (let index = 0; index < panel.density; index += 1) {
            drawTube(
              x + w * (0.15 + (((index * 31) % 70) / 100)),
              y + h * (0.14 + (((index * 47) % 72) / 100)),
              w * (0.26 + scale * 0.05),
              ((index * 117) % 180) * (Math.PI / 180),
              selected ? 2.8 + scale : 1.4,
              selected ? gold : cyan,
            );
          }
        });
      }

      if (active === 3) {
        for (let index = 0; index < 42; index += 1) {
          const baseX = 0.5 + ((((index * 41) % 84) / 100) - 0.5) * spread;
          const baseY = 0.5 + ((((index * 59) % 80) / 100) - 0.5) * spread;
          const x = width * baseX;
          const y = height * baseY;
          const angle = ((index * 131) % 180) * (Math.PI / 180);
          drawTube(x, y, width * 0.14, angle, 10, index % 8 === 0 ? "rgba(242, 203, 114, .2)" : "rgba(95, 229, 216, .12)");
          drawTube(x, y, width * 0.14, angle, 1.4, index % 8 === 0 ? gold : cyan);
        }
        ctx.fillStyle = "rgba(242, 203, 114, .9)";
        ctx.font = "600 13px Arial";
        ctx.fillText("二维投影布局 · 未计算三维体积", width * 0.58, height * 0.84);
      }

      if (active === 4) {
        const stages = [
          { x: 0.18, progress: Math.min(1, limit * 3), label: "δ" },
          { x: 0.5, progress: Math.max(0, Math.min(1, limit * 3 - 1)), label: "δ / 2" },
          { x: 0.82, progress: Math.max(0, Math.min(1, limit * 3 - 2)), label: "δ / 4" },
        ];
        stages.forEach((stage, stageIndex) => {
          const thickness = 12 - stage.progress * 9 - stageIndex * 1.2;
          for (let index = 0; index < 13; index += 1) {
            drawTube(
              width * stage.x + Math.sin(index * 1.9) * width * 0.035,
              height * (0.24 + index * 0.04),
              width * 0.12,
              ((index * 29 + stageIndex * 9) % 170) * (Math.PI / 180),
              thickness,
              stage.progress > 0.55 ? gold : cyanSoft,
            );
          }
          ctx.fillStyle = stage.progress > 0.55 ? gold : "rgba(183, 244, 238, .7)";
          ctx.font = "600 14px Arial";
          ctx.fillText(stage.label, width * stage.x - 12, height * 0.81);
        });
        ctx.fillStyle = "rgba(242, 203, 114, .94)";
        ctx.font = "600 17px Georgia";
        ctx.fillText("δ，δ / 2，δ / 4 · 结论来自统一估计", width * 0.53, height * 0.9);
      }
    };

    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    draw();
    return () => observer.disconnect();
  }, [active, cluster, clusterCenter, delta, limit, scale, spread, tubeOffsets]);

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event);
    if (active === 0) {
      let nearest = 0;
      let nearestDistance = Infinity;
      for (let index = 0; index < 32; index += 1) {
        const offset = tubeOffsets[index] ?? { x: 0, y: 0 };
        const x = 0.1 + (((index * 37) % 83) / 100) + offset.x;
        const y = 0.12 + (((index * 53) % 77) / 100) + offset.y;
        const distance = Math.hypot(x - point.x, y - point.y);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      }
      dragRef.current = { active: true, kind: "tube", index: nearest };
    } else if (active === 1) {
      dragRef.current = { active: true, kind: "cluster", index: 0 };
      setClusterCenter(point);
    } else if (active === 2) {
      setScale(point.x < 0.34 ? 0 : point.x < 0.66 ? 1 : 2);
    } else if (active === 3) {
      dragRef.current = { active: true, kind: "spread", index: 0 };
      setSpread(Math.max(0.18, Math.min(1, point.x)));
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const point = pointerPosition(event);
    if (dragRef.current.kind === "tube") {
      const index = dragRef.current.index;
      const baseX = 0.1 + (((index * 37) % 83) / 100);
      const baseY = 0.12 + (((index * 53) % 77) / 100);
      setTubeOffsets((current) => ({
        ...current,
        [index]: { x: point.x - baseX, y: point.y - baseY },
      }));
    } else if (dragRef.current.kind === "cluster") {
      setClusterCenter({
        x: Math.max(0.18, Math.min(0.82, point.x)),
        y: Math.max(0.2, Math.min(0.75, point.y)),
      });
    } else if (dragRef.current.kind === "spread") {
      setSpread(Math.max(0.18, Math.min(1, point.x)));
    }
  };

  const controls = [
    {
      label: "相对细管半径 δ",
      value: delta,
      display: delta.toFixed(3),
      min: 0.02,
      max: 0.14,
      step: 0.005,
      change: setDelta,
      hint: "单位线段归一化为长度 1；可拖动细管中心",
    },
    {
      label: "受参数影响的样本管",
      value: cluster,
      display: `${Math.round(8 + cluster * 18)} / 28`,
      min: 0,
      max: 1,
      step: 0.01,
      change: setCluster,
      hint: "有限样本配置，不是凸集聚集条件的数值判定",
    },
    {
      label: "示意放大倍数",
      value: scale,
      display: ["1×", "δ⁻¹ᐟ²", "δ⁻¹"][scale],
      min: 0,
      max: 2,
      step: 1,
      change: setScale,
      hint: "点击画面中的尺度",
    },
    {
      label: "中心分散程度",
      value: spread,
      display: spread < 0.4 ? "紧凑" : spread < 0.72 ? "展开中" : "较分散",
      min: 0.18,
      max: 1,
      step: 0.01,
      change: setSpread,
      hint: "改变有限样本的中心位置；不输出体积估计",
    },
    {
      label: "缩尺动画进度",
      value: limit,
      display: `${Math.round(limit * 100)}%`,
      min: 0,
      max: 1,
      step: 0.01,
      change: setLimit,
      hint: "相对缩尺演示；维数结论不是由动画拟合得到",
    },
  ][active];

  return (
    <div className="proof-visual">
      <canvas
        ref={canvasRef}
        className="proof-canvas"
        aria-label={`可交互证明实验：${proofSteps[active].title}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          dragRef.current.active = false;
        }}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onWheel={(event) => {
          if (active !== 2) return;
          event.preventDefault();
          setScale((current) => Math.max(0, Math.min(2, current + (event.deltaY > 0 ? 1 : -1))));
        }}
      />
      <div className="proof-live">
        <span>INTERACTIVE MODEL</span>
        <strong>{controls.hint}</strong>
      </div>
      <div className="proof-controls">
        <label>
          <span>{controls.label}</span>
          <strong>{controls.display}</strong>
          <input
            type="range"
            min={controls.min}
            max={controls.max}
            step={controls.step}
            value={controls.value}
            onChange={(event) => controls.change(Number(event.target.value))}
          />
        </label>
        {active === 4 && (
          <button type="button" aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>
            {playing ? "暂停" : "播放缩尺动画"}
          </button>
        )}
      </div>
      <b aria-hidden="true">{proofSteps[active].number}</b>
    </div>
  );
}

function DirectionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [delta, setDelta] = useState(0.018);
  const [showTubes, setShowTubes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sampleCount, setSampleCount] = useState(96);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const yawRef = useRef(-0.45);
  const pitchRef = useRef(0.28);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const points = useMemo(() => projectiveDirections(sampleCount), [sampleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animation = 0;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 420);
      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (autoRotate && !reduceMotion) yawRef.current += 0.0017;
      const centerX = width * 0.5;
      const centerY = height * 0.46;
      const worldScale = Math.min(width, height) * 0.68;
      const cameraDistance = 3.15;
      const project = (point: Vec3) => {
        const perspective = cameraDistance / (cameraDistance - point.z);
        return {
          x: centerX + point.x * worldScale * 0.64 * perspective,
          y: centerY - point.y * worldScale * 0.64 * perspective,
          z: point.z,
          perspective,
        };
      };

      const samples = points.map((point, index) => {
        const direction = rotatePoint(point, yawRef.current, pitchRef.current);
        const first = { x: direction.x * 0.78, y: direction.y * 0.78, z: direction.z * 0.78 };
        const second = { x: -first.x, y: -first.y, z: -first.z };
        const near = first.z >= second.z ? first : second;
        const far = first.z >= second.z ? second : first;
        return { index, near: project(near), far: project(far) };
      });

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, worldScale * 0.575);
      halo.addColorStop(0, "rgba(78, 232, 214, .12)");
      halo.addColorStop(0.55, "rgba(29, 126, 158, .055)");
      halo.addColorStop(1, "rgba(5, 8, 14, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      const drawGuide = (guide: Vec3[]) => {
        ctx.beginPath();
        guide.forEach((point, index) => {
          const screen = project(rotatePoint(point, yawRef.current, pitchRef.current));
          if (index === 0) ctx.moveTo(screen.x, screen.y);
          else ctx.lineTo(screen.x, screen.y);
        });
        ctx.stroke();
      };

      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = "rgba(128, 218, 213, .16)";
      ctx.lineWidth = 1;
      [-0.58, -0.28, 0, 0.28, 0.58].forEach((latitude) => {
        const radius = Math.sqrt(1 - latitude * latitude);
        drawGuide(Array.from({ length: 65 }, (_, index) => {
          const angle = (index / 64) * Math.PI * 2;
          return { x: Math.cos(angle) * radius, y: latitude, z: Math.sin(angle) * radius };
        }));
      });
      Array.from({ length: 6 }, (_, longitude) => longitude * Math.PI / 6).forEach((longitude) => {
        drawGuide(Array.from({ length: 65 }, (_, index) => {
          const angle = (index / 64) * Math.PI * 2;
          return { x: Math.cos(angle) * Math.cos(longitude), y: Math.sin(angle), z: Math.cos(angle) * Math.sin(longitude) };
        }));
      });
      ctx.restore();

      const origin = project({ x: 0, y: 0, z: 0 });
      const strokeHalf = (start: { x: number; y: number; z: number; perspective: number }, end: { x: number; y: number; z: number; perspective: number }, index: number, front: boolean) => {
        const emphasis = index === Math.floor(sampleCount * 0.38);
        const depth = (start.z + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineCap = "round";
        ctx.lineWidth = showTubes ? Math.max(0.9, 2 * delta * worldScale * start.perspective) : 0.9;
        ctx.strokeStyle = emphasis
          ? (front ? "rgba(247, 206, 112, .98)" : "rgba(247, 206, 112, .36)")
          : `rgba(100, 225, 239, ${front ? 0.18 + depth * 0.42 : 0.08 + depth * 0.18})`;
        ctx.stroke();
      };

      samples.slice().sort((a, b) => a.far.z - b.far.z).forEach((sample) => strokeHalf(sample.far, origin, sample.index, false));
      samples.slice().sort((a, b) => a.near.z - b.near.z).forEach((sample) => {
        strokeHalf(origin, sample.near, sample.index, true);
        ctx.beginPath();
        ctx.arc(sample.near.x, sample.near.y, Math.max(1.3, 2.4 * sample.near.perspective), 0, Math.PI * 2);
        ctx.fillStyle = sample.index === Math.floor(sampleCount * 0.38) ? "rgba(247, 206, 112, .98)" : "rgba(137, 238, 230, .58)";
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 235, 224, .95)";
      ctx.shadowColor = "rgba(99, 235, 224, .8)";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      animation = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animation);
  }, [autoRotate, delta, points, sampleCount, showTubes]);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (document.fullscreenElement === wrap) {
      void document.exitFullscreen();
      return;
    }
    void wrap.requestFullscreen();
  };

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

  const labFeedback = showTubes
    ? `现在每条线段都有半径 ${delta.toFixed(3)} 的外壳。它们可以交叉，但这张图并不在计算“能挤到多薄”。`
    : "你现在看到的是没有厚度的线段：它们只负责给出方向；要讨论空间占用，下一步才把它们加厚成细管。";

  return (
    <div className="lab-shell" ref={wrapRef}>
      <div className="lab-readout">
        <span>PROJECTIVE DIRECTION SAMPLER</span>
        <div className="lab-readout-actions">
          <span>{sampleCount} UNORIENTED DIR · δ {delta.toFixed(3)}</span>
          <button type="button" onClick={toggleFullscreen} aria-pressed={isFullscreen}>
            {isFullscreen ? "退出全屏" : "全屏查看"}
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="direction-canvas"
        aria-label={`三维无向直线方向的有限采样，共 ${sampleCount} 个方向；单位线段的细管半径 δ=${delta.toFixed(3)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="lab-guide" aria-live="polite">
        <p><span>先看</span>球面上的每条亮线代表一个方向；这里的线段共用中心，只是方向样本，不是挂谷构造本身。</p>
        <p><span>动手</span>拖动画面换个角度，再调细管半径 δ 或方向数。</p>
        <p><span>你刚刚看到</span>{labFeedback}</p>
      </div>
      <div className="lab-controls" aria-label="方向采样实验控制">
        <label>
          <span>
            细管半径 δ <strong>{delta.toFixed(3)}</strong>
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

function TimelineExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeEra, setActiveEra] = useState(0);
  const [detailStep, setDetailStep] = useState(0);
  const [parameters, setParameters] = useState([0.36, 0.58, 0.45, 0.48, 0.08, 1]);
  const draggingRef = useRef(false);
  const parameter = parameters[activeEra];
  const experiment = timelineExperiments[activeEra];
  const proof = timelineProofs[activeEra];

  const setParameter = (value: number) => {
    setParameters((current) =>
      current.map((item, index) => (index === activeEra ? Math.max(0, Math.min(1, value)) : item)),
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let phase = 0;

    const tube = (
      x: number,
      y: number,
      length: number,
      angle: number,
      thickness: number,
      color: string,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.lineTo(length / 2, 0);
      ctx.lineCap = "round";
      ctx.lineWidth = thickness;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(360, rect.width);
      const height = Math.max(360, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cyan = "rgba(91, 225, 213, .68)";
      const cyanSoft = "rgba(91, 225, 213, .16)";
      const gold = "rgba(242, 203, 114, .88)";
      const line = "rgba(143, 216, 207, .16)";
      const cx = width * 0.5;
      const cy = height * 0.47;

      if (activeEra === 0) {
        const radius = Math.min(width, height) * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(91, 225, 213, .025)";
        ctx.fill();
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.stroke();
        const samples = Math.max(2, Math.round(parameter * 22));
        for (let index = 0; index < samples; index += 1) {
          const angle = (index / Math.max(1, samples - 1)) * parameter * Math.PI;
          tube(cx, cy, radius * 1.18, angle, 1.2, cyanSoft);
        }
        tube(cx, cy, radius * 1.18, parameter * Math.PI, 4, gold);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = gold;
        ctx.fill();
        ctx.fillStyle = "rgba(183, 244, 238, .66)";
        ctx.font = "500 12px Arial";
        ctx.fillText("共中心基线 · 原问题允许中心自由移动", width * 0.08, height * 0.88);
      }

      if (activeEra === 1) {
        const compression = parameter;
        for (let index = 0; index < 38; index += 1) {
          const angle = (index / 37) * Math.PI;
          const spreadX = ((((index * 37) % 83) / 82) - 0.5) * width * 0.58;
          const spreadY = ((((index * 53) % 79) / 78) - 0.5) * height * 0.45;
          const targetX = Math.sin(angle * 3) * width * 0.09;
          const targetY = Math.cos(angle * 2) * height * 0.055;
          const x = cx + spreadX * (1 - compression) + targetX * compression;
          const y = cy + spreadY * (1 - compression) + targetY * compression;
          tube(x, y, Math.min(width, height) * 0.24, angle, 2, index % 8 === 0 ? gold : cyan);
        }
        ctx.fillStyle = gold;
        ctx.font = "600 13px Arial";
        ctx.fillText("有限方向样本 38 条 · 仅保留方向，不计算面积", width * 0.53, height * 0.85);
      }

      if (activeEra === 2) {
        const frequency = 2 + Math.round(parameter * 9);
        const amplitude = height * 0.035;
        for (let band = -3; band <= 3; band += 1) {
          ctx.beginPath();
          for (let x = width * 0.08; x <= width * 0.92; x += 4) {
            const normalized = (x - width * 0.08) / (width * 0.84);
            const y =
              cy +
              band * height * 0.075 +
              Math.sin(normalized * Math.PI * 2 * frequency + phase + band) * amplitude;
            if (x === width * 0.08) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = band === 0 ? gold : cyan;
          ctx.globalAlpha = 1 - Math.abs(band) * 0.1;
          ctx.lineWidth = band === 0 ? 2.2 : 1.1;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let index = 0; index < 9; index += 1) {
          tube(width * (0.16 + index * 0.085), cy, width * 0.075, -0.7 + index * 0.17, 5, cyanSoft);
        }
        ctx.fillStyle = "rgba(183, 244, 238, .66)";
        ctx.font = "500 12px Arial";
        ctx.fillText("波形与管束为概念对应 · 非偏微分方程数值解", width * 0.08, height * 0.88);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) phase += 0.018;
      }

      if (activeEra === 3) {
        const levels = 1 + Math.round(parameter * 4);
        const size = Math.min(width * 0.68, height * 0.72);
        const left = cx - size / 2;
        const top = cy - size * 0.42;
        for (let level = 0; level < levels; level += 1) {
          const divisions = Math.pow(2, level + 1);
          ctx.strokeStyle = level === levels - 1 ? "rgba(242, 203, 114, .34)" : line;
          ctx.lineWidth = level === levels - 1 ? 1.2 : 0.7;
          for (let index = 0; index <= divisions; index += 1) {
            const offset = (size * index) / divisions;
            ctx.beginPath();
            ctx.moveTo(left + offset, top);
            ctx.lineTo(left + offset, top + size * 0.84);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(left, top + offset * 0.84);
            ctx.lineTo(left + size, top + offset * 0.84);
            ctx.stroke();
          }
        }
        for (let index = 0; index < 24; index += 1) {
          const x = left + size * (0.08 + (((index * 31) % 84) / 100));
          const y = top + size * (0.08 + (((index * 47) % 72) / 100));
          tube(x, y, size * 0.23, ((index * 119) % 180) * (Math.PI / 180), 1.6, index % 7 === 0 ? gold : cyan);
        }
        ctx.fillStyle = "rgba(183, 244, 238, .66)";
        ctx.font = "500 12px Arial";
        ctx.fillText("多尺度网格示意 · 非多项式分割计算", width * 0.08, height * 0.88);
      }

      if (activeEra === 4) {
        const selected = Math.min(4, Math.floor(parameter * 5));
        const labels = ["离散化", "聚集控制", "多尺度", "体积下界", "维数 3"];
        const start = width * 0.11;
        const end = width * 0.89;
        ctx.beginPath();
        ctx.moveTo(start, cy);
        ctx.lineTo(end, cy);
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.stroke();
        labels.forEach((label, index) => {
          const x = start + ((end - start) * index) / 4;
          const reached = index <= selected;
          ctx.beginPath();
          ctx.arc(x, cy, reached ? 14 : 9, 0, Math.PI * 2);
          ctx.fillStyle = reached ? (index === selected ? gold : cyan) : "#0b211b";
          ctx.fill();
          ctx.strokeStyle = reached ? gold : line;
          ctx.stroke();
          ctx.fillStyle = reached ? "#d9eee8" : "#6f8981";
          ctx.font = `${index === selected ? 600 : 400} 12px Arial`;
          ctx.textAlign = "center";
          ctx.fillText(label, x, cy + 42);
          if (index < selected) {
            ctx.beginPath();
            ctx.moveTo(x + 18, cy);
            ctx.lineTo(start + ((end - start) * (index + 1)) / 4 - 18, cy);
            ctx.strokeStyle = cyan;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        });
        ctx.textAlign = "start";
      }

      if (activeEra === 5) {
        const years = ["1917", "1928", "1970s", "2000s", "2025", "2026"];
        const reached = parameter * (years.length - 1);
        const start = width * 0.1;
        const end = width * 0.9;
        ctx.beginPath();
        for (let x = start; x <= end; x += 3) {
          const t = (x - start) / (end - start);
          const y = cy + Math.sin(t * Math.PI * 2.3) * height * 0.085;
          if (x === start) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.stroke();
        years.forEach((year, index) => {
          const x = start + ((end - start) * index) / (years.length - 1);
          const y = cy + Math.sin((index / (years.length - 1)) * Math.PI * 2.3) * height * 0.085;
          const complete = index <= reached;
          ctx.beginPath();
          ctx.arc(x, y, complete ? 8 : 5, 0, Math.PI * 2);
          ctx.fillStyle = complete ? (index === 5 ? gold : cyan) : "#17332c";
          ctx.fill();
          ctx.fillStyle = complete ? "#dceee9" : "#607a72";
          ctx.font = "500 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(year, x, y + (index % 2 === 0 ? -24 : 30));
        });
        const markerX = start + (end - start) * parameter;
        const markerY = cy + Math.sin(parameter * Math.PI * 2.3) * height * 0.085;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = gold;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = "start";
      }

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [activeEra, parameter]);

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setParameter((event.clientX - rect.left) / rect.width);
  };

  return (
    <div className="timeline-explorer">
      <div className="timeline" role="tablist" aria-label="挂谷问题百年进展">
        {timeline.map(([year, text], index) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeEra === index}
            key={year}
            onClick={() => {
              setActiveEra(index);
              setDetailStep(0);
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{year}</h3>
            <p>{text}</p>
            <i>{activeEra === index ? "正在体验" : "看看怎么做"} ↗</i>
          </button>
        ))}
      </div>
      <div className="era-stage" role="tabpanel">
        <div className="era-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="era-canvas"
            aria-label={`${experiment.title}的可交互概念实验`}
            onPointerDown={(event) => {
              draggingRef.current = true;
              updateFromPointer(event);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (draggingRef.current) updateFromPointer(event);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
          />
          <span>左右拖动试试看</span>
        </div>
        <div className="era-copy">
          <span>{experiment.kicker} · INTERACTIVE</span>
          <h3>{experiment.title}</h3>
          <p><b>先看什么：</b>{experiment.action}</p>
          <label>
            <span>动手做 · {experiment.control}</span>
            <strong>{experiment.value(parameter)}</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameter}
              onChange={(event) => setParameter(Number(event.target.value))}
            />
          </label>
          <div>
            <span>你刚刚看到</span>
            <p>{experiment.conclusion}</p>
          </div>
          <small>动画只讲思路，不负责替代数学证明；这是有限样本的直觉实验，图形变化不等于完成了数学证明。</small>
        </div>
      </div>
      <div className="era-derivation">
        <div className="derivation-head">
          <div>
            <span>{proof.type} · ARGUMENT MAP</span>
            <h3>当时的人怎样往前走</h3>
          </div>
          <p>{proof.note}</p>
        </div>
        <div className="derivation-grid">
          <div className="derivation-nav" role="tablist" aria-label={`${proof.type}的分步论证`}>
            {proof.steps.map((step, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={detailStep === index}
                key={step.title}
                onClick={() => {
                  setDetailStep(index);
                  if (activeEra === 4) setParameter(index / Math.max(1, proof.steps.length - 1));
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </div>
          <article className="derivation-card" role="tabpanel">
            <span>
              第 {String(detailStep + 1).padStart(2, "0")} 步 / 共 {String(proof.steps.length).padStart(2, "0")} 步
            </span>
            <h4>{proof.steps[detailStep].title}</h4>
            <p>{proof.steps[detailStep].body}</p>
            <div>数学写法　{proof.steps[detailStep].formula}</div>
            <nav aria-label="论证步骤切换">
              <button
                type="button"
                disabled={detailStep === 0}
                onClick={() => setDetailStep((current) => Math.max(0, current - 1))}
              >
                ← 上一步
              </button>
              <button
                type="button"
                disabled={detailStep === proof.steps.length - 1}
                onClick={() => {
                  const next = Math.min(proof.steps.length - 1, detailStep + 1);
                  setDetailStep(next);
                  if (activeEra === 4) setParameter(next / Math.max(1, proof.steps.length - 1));
                }}
              >
                下一步 →
              </button>
            </nav>
          </article>
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
        <ProofVisual active={active} />
        <div className="proof-copy">
          <span>PROOF MAP / CONCEPTUAL VIEW</span>
          <h3>{proofSteps[active].title}</h3>
          <p>{proofSteps[active].text}</p>
          <div className="proof-logic" aria-label="当前证明步骤的起点、做法和结果">
            <div>
              <span>先看什么</span>
              <strong>{proofSteps[active].input}</strong>
            </div>
            <div>
              <span>这一步做什么</span>
              <strong>{proofSteps[active].operation}</strong>
            </div>
            <div>
              <span>现在能说明</span>
              <strong>{proofSteps[active].output}</strong>
            </div>
          </div>
          <small>点击左侧关卡，观察难点怎样被逐步换成可计算的问题。这张图只帮你看懂思路，不会替你完成 127 页证明。</small>
        </div>
      </div>
    </div>
  );
}

function TypographyPanel({
  settings,
  onChange,
}: {
  settings: TypographySettings;
  onChange: (next: TypographySettings) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof TypographySettings, value: number) => {
    onChange({
      ...settings,
      [key]: key === "weight" ? value as TypographySettings["weight"] : value,
    });
  };

  const copySettings = async () => {
    const text = [
      `主标题字号：${settings.display >= 0 ? "+" : ""}${settings.display}px`,
      `章节标题字号：${settings.section >= 0 ? "+" : ""}${settings.section}px`,
      `正文大小：${settings.body >= 0 ? "+" : ""}${settings.body}px`,
      `导航与标签：${settings.ui >= 0 ? "+" : ""}${settings.ui}px`,
      `标题字重：${settings.weight}`,
      `标题行距：${settings.titleLeading >= 0 ? "+" : ""}${settings.titleLeading.toFixed(2)}`,
      `正文行距：${settings.leading >= 0 ? "+" : ""}${settings.leading.toFixed(2)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const range = (
    key: Exclude<keyof TypographySettings, "weight">,
    label: string,
    min: number,
    max: number,
    step: number,
    suffix: string,
  ) => (
    <label className="type-control-range">
      <span>{label}</span>
      <output>{settings[key] >= 0 ? "+" : ""}{settings[key].toFixed(step < 1 ? 2 : 0)}{suffix}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[key]}
        onChange={(event) => update(key, Number(event.target.value))}
      />
    </label>
  );

  return (
    <div className="typography-tools">
      <button
        className="typography-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="typography-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <b>Aa</b>
        <span>排版</span>
      </button>
      {open && (
        <aside className="typography-panel" id="typography-panel" aria-label="排版调节台">
          <div className="typography-panel-head">
            <div>
              <span>TYPE CONTROL</span>
              <h2>排版调节台</h2>
            </div>
            <button type="button" aria-label="关闭排版调节台" onClick={() => setOpen(false)}>×</button>
          </div>
          <p>这些设置只保存在当前浏览器。拖动后全站立即预览。</p>
          <div className="type-control-list">
            {range("display", "首屏主标题", -16, 32, 1, "px")}
            {range("section", "章节标题", -12, 28, 1, "px")}
            {range("body", "正文", -3, 12, 1, "px")}
            {range("ui", "导航与标签", -3, 10, 1, "px")}
            {range("titleLeading", "标题行距", -0.16, 0.5, 0.02, "")}
            {range("leading", "正文行距", -0.2, 0.6, 0.05, "")}
            <label className="type-control-select">
              <span>标题字重</span>
              <select value={settings.weight} onChange={(event) => update("weight", Number(event.target.value))}>
                <option value="700">700 · 加粗</option>
                <option value="800">800 · 更粗</option>
                <option value="900">900 · 最粗</option>
              </select>
            </label>
          </div>
          <div className="type-control-actions">
            <button type="button" onClick={() => onChange(defaultTypography)}>恢复默认</button>
            <button type="button" onClick={copySettings}>{copied ? "已复制设置" : "复制设置"}</button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function Home() {
  const [dimension, setDimension] = useState<"2D" | "3D">("3D");
  const [currentSection, setCurrentSection] = useState("question");
  const [typography, setTypography] = useState<TypographySettings>(() => {
    if (typeof window === "undefined") return defaultTypography;
    try {
      const saved = window.localStorage.getItem(typographyStorageKey);
      if (!saved) return defaultTypography;
      const parsed = JSON.parse(saved) as Partial<TypographySettings>;
      return { ...defaultTypography, ...parsed };
    } catch {
      window.localStorage.removeItem(typographyStorageKey);
      return defaultTypography;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(typographyStorageKey, JSON.stringify(typography));
  }, [typography]);

  const typographyStyle = useMemo(() => ({
    "--type-display-adjust": `${typography.display}px`,
    "--type-section-adjust": `${typography.section}px`,
    "--type-body-adjust": `${typography.body}px`,
    "--type-ui-adjust": `${typography.ui}px`,
    "--type-title-weight": String(typography.weight),
    "--type-title-leading-adjust": String(typography.titleLeading),
    "--type-body-leading-adjust": String(typography.leading),
  }) as CSSProperties, [typography]);

  useEffect(() => {
    const ids = ["question", "theorem", "proof", "person", "sources"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setCurrentSection(visible.target.id);
      },
      { rootMargin: "-22% 0px -58% 0px", threshold: [0.02, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main style={typographyStyle}>
      <TypographyPanel settings={typography} onChange={setTypography} />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="回到顶部">
          K <span>/</span> 3
        </a>
        <nav aria-label="主要导航">
          <a href="#question" aria-current={currentSection === "question" ? "location" : undefined}>问题</a>
          <a href="#theorem" aria-current={currentSection === "theorem" ? "location" : undefined}>定理</a>
          <a href="#proof" aria-current={currentSection === "proof" ? "location" : undefined}>证明地图</a>
          <a href="#person" aria-current={currentSection === "person" ? "location" : undefined}>王虹</a>
        </nav>
        <a className="paper-link" href="https://arxiv.org/abs/2502.17655" target="_blank" rel="noreferrer">
          阅读论文 ↗
        </a>
      </header>

      <section className="award-section award-banner" id="top">
        <figure className="medal-orbit">
          {/* eslint-disable-next-line @next/next/no-img-element -- public-domain editorial medal photograph is cropped as a circular object */}
          <img src="/fields-medal-obverse.jpg" alt="菲尔兹奖章正面：阿基米德浮雕" />
        </figure>
        <div>
          <div className="section-index light">PHILADELPHIA · 23 JULY 2026</div>
          <h2>2026 年，王虹获得菲尔兹奖。</h2>
          <p>
            王虹是继伊朗裔美国数学家玛丽安·米尔札哈尼、乌克兰数学家玛丽娜・维亚佐夫斯卡之后，菲尔兹奖历史上第三位女性得主，也是首位获奖的中国女性。
          </p>
          <div className="award-facts">
            <div>
              <span>地点</span>
              <strong>Philadelphia</strong>
            </div>
            <div>
              <span>日期</span>
              <strong>23 JUL 2026</strong>
            </div>
            <div>
              <span>研究领域</span>
              <strong>Harmonic Analysis</strong>
            </div>
          </div>
          <a className="award-source" href="https://www.ihes.fr/en/hong-wang2026-fields-medal/" target="_blank" rel="noreferrer">
            查看 IHES 官方公告 ↗
          </a>
        </div>
      </section>

      <section className="hero" id="hero">
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
            把一根长度不变的针，朝每个方向各放一次。你当然可以让它们彼此靠近；真正奇怪的是，王虹与 Joshua Zahl 证明：
            <em>在三维里，无论怎么挤，这些针组成的集合仍保留完整的三维复杂度。</em>
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
            <span>数学写法：两种维数都等于 3</span>
          </div>
        </div>
      </section>

      <section className="question-section" id="question">
        <div className="section-index">01 / THE QUESTION</div>
        <div className="question-heading">
          <h2>
            这里的“针”，就是一条
            <span>无限细、长度为 1 的线段。</span>
          </h2>
        </div>
        <div className="question-grid">
          <div className="needle-card">
            <KakeyaDiagram />
            <div className="needle-labels">
              <span>线段中心可以移动</span>
              <span>当前展示 25 个有限采样方向</span>
            </div>
          </div>
          <div className="question-copy">
            <p>
              这里的“针”不是一把真的针，而是一条长度为 1、没有厚度的线段。任意一个方向，集合里都要有一条这样的线段；至于它放在哪里，可以自由选择。
              难点恰恰从这里开始：它们不必围着同一个中心转，也不必经过同一点，可以一边转、一边移动，还可以大量重叠。
            </p>
            <blockquote>
              “它可以几乎不占体积，却会不会仍然复杂得像整个空间？”
            </blockquote>
            <p className="micro-note">
              数学家把“复杂得像整个空间”说成“满维”。先有直觉，术语才跟上：二维早已证明满维；王虹与 Joshua Zahl 在 2025 年解决了三维。四维及以上仍然开放。
            </p>
          </div>
        </div>
      </section>

      <section className="dimension-section" id="theorem">
        <div className="dimension-top">
          <div>
            <div className="section-index light">02 / SIZE IS NOT VOLUME</div>
            <h2>几乎不占地方，不等于很简单。</h2>
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
            <span>{dimension === "3D" ? "WANG–ZAHL THEOREM · 2025" : "DAVIES · PLANAR THEOREM · 1971"}</span>
            <h3>
              {dimension === "3D"
                ? "它可以没有体积，却不能只像一张纸或一条线。"
                : "它可以没有面积，却仍然复杂得像整个平面。"}
            </h3>
            <p>
              {dimension === "3D"
                ? "体积为零，只说明它不占普通的三维体积；维数为 3，则说明你越放大观察，看到的细节仍然像三维空间那样丰富。这两句话可以同时成立。"
                : "Besicovitch 证明面积可以为零。Davies 又证明：无论怎样构造，它的 Hausdorff 维数仍是 2，Minkowski 维数也等于 2。"}
            </p>
            <div className="formula">
              dim<sub>H</sub>(K) = dim<sub>M</sub>(K) = {dimension === "3D" ? "3" : "2"}
            </div>
          </div>
          <div className="dimension-legend">
            <div>
              <span>它占多少普通空间？</span>
              <strong>可以是 0</strong>
            </div>
            <div>
              <span>用精细标尺测复杂度</span>
              <strong>Hausdorff 维数满维</strong>
            </div>
            <div>
              <span>用小盒子数复杂度</span>
              <strong>Minkowski 维数满维</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-section" id="proof">
        <div className="section-heading-row">
          <div>
            <div className="section-index">03 / THE PROOF MAP</div>
            <h2>把看不见的线段，变成可以测量的细管。</h2>
          </div>
        </div>
        <ProofRoute />
      </section>

      <section className="timeline-section" id="timeline">
        <div className="section-index light">04 / A CENTURY OF PROGRESS</div>
        <div className="timeline-heading">
          <h2>一道小学几何味的问题，做了一百多年。</h2>
          <p>每个节点只回答两件事：当时究竟卡在哪里？后来的人又多了一件什么工具？</p>
        </div>
        <TimelineExplorer />
      </section>

      <section className="person-section" id="person">
        <div className="person-heading">
          <div className="section-index">05 / THE MATHEMATICIAN</div>
          <h2>她研究两件事：一束波能挤到多窄，几何形状究竟能压得多薄。</h2>
        </div>
        <div className="person-profiles">
          <article className="person-profile person-profile-hong">
            <div className="profile-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element -- editorial crop is intentionally rendered full bleed */}
              <img className="profile-image" src="/hong-wang-portrait.jpg" alt="2026 年菲尔兹奖得主、数学家王虹" />
              <span>PHOTO · IHES · 2026</span>
            </div>
            <div className="profile-copy">
              <h3>王虹</h3>
              <p>
                王虹出生于广西桂林，本科毕业于北京大学，2019 年在 MIT 获博士学位，导师是 Larry Guth。她现任 IHES 常任教授，也是纽约大学柯朗数学科学研究所 Silver Professor。
              </p>
              <p>
                她研究波如何传播，也研究几何对象能被压缩到什么程度；这些问题在调和分析、几何测度论与挂谷猜想之间彼此相连。
              </p>
            </div>
          </article>

          <article className="person-profile person-profile-zahl">
            <div className="profile-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element -- an attributed public editorial portrait is displayed from its publisher */}
              <img
                className="profile-image"
                src="https://www.claymath.org/wp-content/uploads/2026/03/Zahl-scaled.jpg"
                alt="数学家 Joshua Zahl"
              />
              <span>PHOTO · PAUL JOSEPH / CMI</span>
            </div>
            <div className="profile-copy">
              <h3>Joshua Zahl</h3>
              <p>
                Joshua Zahl 是南开大学陈省身数学研究所教授，2013 年获 UCLA 数学博士，导师为 Terence Tao。他曾任英属哥伦比亚大学数学系副教授。
              </p>
              <p>
                他的兴趣横跨经典调和分析与组合数学，特别关注关联几何、限制型问题、挂谷问题和和积现象。
              </p>
            </div>
          </article>
        </div>
        <aside className="collaboration-callout" aria-label="共同成果说明">
          <p>三维挂谷集合猜想是王虹与 Joshua Zahl 的共同成果；菲尔兹奖则授予王虹个人。</p>
        </aside>
      </section>

      <section className="sources-section" id="sources">
        <div className="section-heading-row">
          <div>
            <div className="section-index">06 / SOURCES</div>
            <h2>想继续读，从两条路进入。</h2>
          </div>
          <p>先看面向大众的解释，建立直觉；再读原始论文，保留完整证明。数学结论以原始论文为准。</p>
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
          从一根会转动的针，走进三维挂谷猜想。
          <br />
          动画讲直觉，公式保留准确边界。
        </p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}
