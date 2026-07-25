"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Vec3 = { x: number; y: number; z: number };
type Tube2D = { x: number; y: number; angle: number; gold?: boolean };

const proofSteps = [
  {
    number: "01",
    title: "把线段放大成 δ-细管",
    text: "无限细的线段难以直接估计。证明先在尺度 δ 上，用长度为 1、半径约为 δ 的细管近似每个方向。",
    input: "每个方向的一条单位线段",
    operation: "在尺度 δ 上增厚",
    output: "有限族 δ-细管",
  },
  {
    number: "02",
    title: "识别异常聚集",
    text: "真正的困难不是方向多，而是大量细管可能高度重叠。论文用对所有凸集都成立的定量条件，限制管束在凸集中的集中程度。",
    input: "可能高度重叠的细管",
    operation: "检验凸集非聚集条件",
    output: "满足 Wolff 条件的受控管族",
  },
  {
    number: "03",
    title: "在多个尺度间传递控制",
    text: "把空间逐层放大、分解，再追踪“拥挤”如何随尺度变化。局部结构与整体体积由此联系起来。",
    input: "一个尺度上的重叠信息",
    operation: "放大、分解并递推",
    output: "跨尺度的一致控制",
  },
  {
    number: "04",
    title: "推出并集几乎最大",
    text: "若细管满足论文中的凸集与薄片非聚集条件，带 shading 的管族并集可获得接近尺度允许上限的体积下界。",
    input: "受控的细管族",
    operation: "估计并集体积",
    output: "接近最大的体积下界",
  },
  {
    number: "05",
    title: "让 δ 趋近于 0",
    text: "离散尺度上的体积估计最终给出：三维挂谷集合的 Minkowski 维数和 Hausdorff 维数都等于 3。",
    input: "所有小尺度上的体积下界",
    operation: "取极限 δ → 0",
    output: "Hausdorff 与 Minkowski 维数为 3",
  },
];

const timeline = [
  ["1917", "挂谷宗一提出“转针”问题：一根单位线段改变方向，最少需要多大区域？"],
  ["1919—1928", "Besicovitch 展示了反直觉现象：若不要求区域凸，包含所有方向线段的集合可以拥有任意小面积。"],
  ["1970s", "Davies 证明二维挂谷集合满维；同一时期，挂谷几何与傅里叶分析之间的联系开始显现。"],
  ["1990s—2020s", "多代数学家不断提高维数下界，并发展多尺度、组合几何与多项式方法。"],
  ["2025.02", "王虹与 Joshua Zahl 公布 127 页论文，证明三维挂谷集合猜想。"],
  ["2026.07", "王虹在费城国际数学家大会获菲尔兹奖，成为该奖历史上第三位女性得主。"],
];

const timelineExperiments = [
  {
    kicker: "问题的诞生",
    title: "共中心旋转：一个基线模型",
    action: "拖动角度，观察所有线段共用中心时扫过的方向；原问题还允许线段中心移动。",
    control: "针的方向",
    value: (parameter: number) => `${Math.round(parameter * 180)}°`,
    conclusion: "目标不是画满一个圆，而是寻找包含每个方向线段的最小集合。",
  },
  {
    kicker: "反直觉构造",
    title: "有限方向的重叠模型",
    action: "增加重叠参数，38 个采样方向保持不变；这只是有限模型，不是 Besicovitch 零面积构造本身。",
    control: "有限模型重叠参数",
    value: (parameter: number) => `${Math.round(parameter * 100)}%`,
    conclusion: "二维挂谷集合可以具有零面积；严格结论来自 Besicovitch 的极限构造，不由这个有限动画计算。",
  },
  {
    kicker: "分析学转向",
    title: "把细管看成波包",
    action: "改变示意频率，观察“频率帽—曲面法向—空间细管”的概念对应；动画不求解波动方程。",
    control: "示意频率",
    value: (parameter: number) => `2^${Math.round(1 + parameter * 7)}`,
    conclusion: "挂谷几何与傅里叶限制、局部光滑和偏微分方程由此连接。",
  },
  {
    kicker: "工具的积累",
    title: "在多尺度网格中追踪重叠",
    action: "提升示意分解层级，观察局部拥挤如何被逐层定位；网格不等同于真实多项式分割。",
    control: "示意分解层级",
    value: (parameter: number) => `${1 + Math.round(parameter * 4)} 层`,
    conclusion: "组合几何、多项式方法与多尺度归纳不断抬高维数下界。",
  },
  {
    kicker: "三维猜想解决",
    title: "沿五步证明地图推进",
    action: "移动进度，查看离散化、聚集控制与体积下界如何衔接。",
    control: "证明进度",
    value: (parameter: number) => `${1 + Math.min(4, Math.floor(parameter * 5))} / 5`,
    conclusion: "Wang–Zahl 证明三维挂谷集合的 Hausdorff 与 Minkowski 维数均为 3。",
  },
  {
    kicker: "成果被确认",
    title: "从百年问题到菲尔兹奖",
    action: "推进时间轴，观察问题、方法、证明与奖项如何汇流。",
    control: "历史汇流",
    value: (parameter: number) => `${1917 + Math.round(parameter * 109)}`,
    conclusion: "2026 年奖项表彰王虹的一系列工作；三维挂谷定理由她与 Joshua Zahl 共同证明。",
  },
];

const timelineProofs = [
  {
    type: "问题定义",
    note: "这一时期提出的是问题，不是一份证明。",
    steps: [
      {
        title: "参数化方向",
        body: "对每个方向 θ，取单位向量 vθ，并允许线段中心 xθ 自由移动。",
        formula: "Iθ = xθ + [−1/2, 1/2]vθ",
      },
      {
        title: "定义容纳条件",
        body: "寻找集合 K，使每一个方向都至少有一条对应的单位线段完全落在 K 中。",
        formula: "∀θ ∈ S¹，∃xθ，使 Iθ ⊂ K",
      },
      {
        title: "比较转针直觉",
        body: "如果所有线段共用一个中心，它们的并集正是半径 1/2 的圆盘；1917 年时，允许中心移动后的面积下确界尚不清楚。",
        formula: "共中心：|K| = π/4；1917 年时自由平移下界未知",
      },
      {
        title: "改写为现代问题",
        body: "面积可以多小？即使体积为零，包含全方向线段的集合是否仍必须具有满维数？",
        formula: "Kakeya 猜想：dim K = n",
      },
    ],
  },
  {
    type: "零面积构造",
    note: "这里展示 Besicovitch 型构造的证明骨架，而非逐页技术细节。",
    steps: [
      {
        title: "有限方向近似",
        body: "先只取一个很密的有限方向网格，用狭长三角形承载相邻方向的线段。",
        formula: "ΘN = {θ₁,…,θN} ⊂ S¹",
      },
      {
        title: "Besicovitch 构造与 Perron 树表述",
        body: "Besicovitch 的原始构造后来可用 Perron 树更直观地表述：切分狭长三角形并平移，使主体大量重叠而保留方向范围。",
        formula: "方向范围保留，投影面积下降",
      },
      {
        title: "迭代压缩",
        body: "每轮同时增加方向分辨率并缩小承载区域；重叠提高，但每个目标方向仍保留一条线段。",
        formula: "|KN| < εN，且 εN → 0",
      },
      {
        title: "取极限集合",
        body: "选取收敛子列并闭包，得到包含所有方向单位线段、Lebesgue 面积却为零的紧集。",
        formula: "|K| = 0",
      },
    ],
  },
  {
    type: "分析学桥梁",
    note: "1970s 同时包含二维维数定理与分析学方向的转变；后两步采用现代波包语言解释其影响。",
    steps: [
      {
        title: "Davies 证明二维满维",
        body: "1971 年 Roy Davies 证明：每一个平面挂谷集合的 Hausdorff 维数都等于 2；由维数单调性，其 Minkowski 维数也为 2。",
        formula: "dimH K = dimM K = 2",
      },
      {
        title: "频率局部化",
        body: "把曲面上的傅里叶支撑切成许多小频率帽；每个帽在物理空间中对应一个由曲面法向（或群速度）确定的主方向。",
        formula: "f = Σθ fθ",
      },
      {
        title: "波包分解",
        body: "每个频率局部化分量可进一步分解为波包；这些波包在相应空间细管外快速衰减，而不是严格紧支撑在管内。",
        formula: "fθ ≈ ΣT fT；fT 主要集中于 T",
      },
      {
        title: "几何控制分析量",
        body: "如果大量细管过度重叠，相应波包也会集中，从而阻碍限制估计和最大函数估计。",
        formula: "管束重叠 ↔ Lᵖ 范数增长",
      },
      {
        title: "得到研究纲领",
        body: "证明挂谷型体积下界，会反向推动傅里叶限制、局部光滑和相关偏微分方程估计。",
        formula: "挂谷型管束估计 → 分析估计中的关键几何输入",
      },
    ],
  },
  {
    type: "方法累积",
    note: "这一时期由多条技术路线共同推进，不是单一证明。",
    steps: [
      {
        title: "Hairbrush 计数",
        body: "固定一根细管，研究与它相交的“刷毛”管束；方向分离限制了它们在平面薄片中的聚集。",
        formula: "multiplicity × union volume ≥ tube mass",
      },
      {
        title: "多项式分割",
        body: "用低次数多项式的零集把空间分成许多胞腔，区分穿越胞腔的管与贴近代数曲面的管。",
        formula: "cellular case / algebraic case",
      },
      {
        title: "Grains 分解",
        body: "把细管组织进不同尺度的扁平盒或“颗粒”，记录局部平行结构和切向结构。",
        formula: "δ ≤ ρ ≤ 1 的层级结构",
      },
      {
        title: "尺度归纳",
        body: "在较粗尺度建立控制，再缩放到细尺度；若结构异常，则进入更精细的聚集分类。",
        formula: "尺度 ρ 的控制 + 重标度 δ/ρ 的控制 → 尺度 δ（结构示意）",
      },
    ],
  },
  {
    type: "三维定理",
    note: "以下对应 Wang–Zahl 论文的主线；严格证明包含 127 页技术论证。",
    steps: [
      {
        title: "离散化为 δ-细管",
        body: "从挂谷集合中为 δ-分离的每个方向选取一根 δ-细管。这样的管族满足凸集与薄片版本的 Wolff 非聚集条件。",
        formula: "# {T∈𝒯 : T⊂W} ≲ |W| / |T|",
      },
      {
        title: "建立体积命题",
        body: "把目标改写为带 shading 的管族并集下界；论文引入 Assertions D 与 E，使体积估计适合尺度归纳。",
        formula: "在归一化 Kakeya 情形：|⋃T Y(T)| ≳ε δ^ε",
      },
      {
        title: "分解凸聚集",
        body: "将凸集中的管束分解进扁平棱柱，并证明不同非聚集表述之间的等价与三分情形。",
        formula: "凸集分解 → 扁平棱柱中的可控子族（结构示意）",
      },
      {
        title: "跨尺度推进",
        body: "使用 two-scale grains decomposition、精细尺度归纳，以及 Nikishin–Stein–Pisier 因子化处理 sticky 与非-sticky 结构。",
        formula: "粗尺度 ρ + 重标度 δ/ρ → 尺度 δ",
      },
      {
        title: "回到维数",
        body: "非聚集管族的并集拥有几乎最大的体积下界；令 δ→0，排除任何低于 3 的 Minkowski 或 Hausdorff 维数。",
        formula: "dimM K = dimH K = 3",
      },
    ],
  },
  {
    type: "成果确认",
    note: "奖项不是证明步骤；这一栏说明成果归属与数学结论如何被确认。",
    steps: [
      {
        title: "论文公开",
        body: "2025 年 2 月，王虹与 Joshua Zahl 公开 127 页论文及完整技术证明。",
        formula: "arXiv:2502.17655",
      },
      {
        title: "结论与边界",
        body: "论文解决三维挂谷集合猜想；更高维一般情形仍然开放，且论文没有宣称解决三维 Kakeya maximal function 猜想。",
        formula: "n = 3 已解决；n ≥ 4 仍开放",
      },
      {
        title: "合作归属",
        body: "三维挂谷定理是王虹与 Joshua Zahl 的共同成果，网页在所有结论处保持共同署名。",
        formula: "Hong Wang + Joshua Zahl",
      },
      {
        title: "奖项意义",
        body: "2026 年菲尔兹奖授予王虹个人，表彰范围包括她在调和分析与几何测度论中的一系列贡献，而非只对应这一篇论文。",
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
      const centerY = height * 0.49;
      const worldScale = Math.min(width, height) * 0.76;

      const projected = points
        .map((point, index) => {
          const rotated = rotatePoint(point, yawRef.current, pitchRef.current);
          return { ...rotated, index };
        })
        .sort((a, b) => a.z - b.z);

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, worldScale * 0.575);
      halo.addColorStop(0, "rgba(78, 232, 214, .12)");
      halo.addColorStop(0.55, "rgba(29, 126, 158, .055)");
      halo.addColorStop(1, "rgba(5, 8, 14, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      projected.forEach((point) => {
        const depth = (point.z + 1) / 2;
        const x = point.x * worldScale * 0.5;
        const y = point.y * worldScale * 0.5;
        const emphasis = point.index === Math.floor(sampleCount * 0.38);
        ctx.beginPath();
        ctx.moveTo(-x, -y);
        ctx.lineTo(x, y);
        ctx.lineCap = "round";
        ctx.lineWidth = showTubes ? Math.max(0.7, 2 * delta * worldScale) : 0.7;
        ctx.strokeStyle = emphasis
          ? "rgba(247, 206, 112, .95)"
          : `rgba(100, 225, 239, ${0.09 + depth * 0.35})`;
        ctx.stroke();
      });
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, worldScale * 0.5, 0, Math.PI * 2);
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
        <span>PROJECTIVE DIRECTION SAMPLER</span>
        <span>{sampleCount} UNORIENTED DIR · δ {delta.toFixed(3)}</span>
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
      <div className="lab-caption">
        <span className="pulse-dot" />
        无向方向的有限采样 · 线段长度归一化为 1 · 共中心不是挂谷集合构造
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
        const radius = Math.min(width, height) * 0.27;
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
          tube(cx, cy, radius * 1.38, angle, 1.2, cyanSoft);
        }
        tube(cx, cy, radius * 1.38, parameter * Math.PI, 4, gold);
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
            <i>{activeEra === index ? "正在演示" : "打开实验"} ↗</i>
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
          <span>横向拖动实验</span>
        </div>
        <div className="era-copy">
          <span>{experiment.kicker} · INTERACTIVE</span>
          <h3>{experiment.title}</h3>
          <p>{experiment.action}</p>
          <label>
            <span>{experiment.control}</span>
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
            <span>这一时期得到什么</span>
            <p>{experiment.conclusion}</p>
          </div>
          <small>概念演示帮助理解思想演进，不替代各时期的严格论证。</small>
        </div>
      </div>
      <div className="era-derivation">
        <div className="derivation-head">
          <div>
            <span>{proof.type} · ARGUMENT MAP</span>
            <h3>这一时期的论证怎样推进</h3>
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
              STEP {String(detailStep + 1).padStart(2, "0")} / {String(proof.steps.length).padStart(2, "0")}
            </span>
            <h4>{proof.steps[detailStep].title}</h4>
            <p>{proof.steps[detailStep].body}</p>
            <div>{proof.steps[detailStep].formula}</div>
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
          <div className="proof-logic" aria-label="当前证明步骤的输入、操作和输出">
            <div>
              <span>输入</span>
              <strong>{proofSteps[active].input}</strong>
            </div>
            <div>
              <span>操作</span>
              <strong>{proofSteps[active].operation}</strong>
            </div>
            <div>
              <span>输出</span>
              <strong>{proofSteps[active].output}</strong>
            </div>
          </div>
          <small>此图帮助理解证明结构，不是对论文论证或数值的复现。</small>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dimension, setDimension] = useState<"2D" | "3D">("3D");
  const [currentSection, setCurrentSection] = useState("question");

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
    <main>
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
            <KakeyaDiagram />
            <div className="needle-labels">
              <span>线段中心可以移动</span>
              <span>当前展示 25 个有限采样方向</span>
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
            <span>{dimension === "3D" ? "WANG–ZAHL THEOREM · 2025" : "DAVIES · PLANAR THEOREM · 1971"}</span>
            <h3>
              {dimension === "3D"
                ? "在三维空间中，再稀薄的挂谷集合也必须是满维的。"
                : "在二维平面中，挂谷集合可以面积为零，但维数仍然等于 2。"}
            </h3>
            <p>
              {dimension === "3D"
                ? "“维数为 3”并不声称集合有正体积。它说明无论怎样在小尺度观察，这个集合都复杂到无法被压成真正的曲面、曲线或更低维对象。"
                : "Besicovitch 的构造证明面积可以为零；Davies 在 1971 年进一步证明，每个平面挂谷集合的 Hausdorff 维数都是 2，因此其 Minkowski 维数也只能是 2。"}
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
            <h2>从一根线，到一片<span className="keep-together">不可过度重叠</span>的管束。</h2>
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
          <p>点击每个时期，亲手操作问题、反例、分析工具与最终证明的概念模型。</p>
        </div>
        <TimelineExplorer />
      </section>

      <section className="person-section" id="person">
        <div className="person-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- local editorial crop is intentionally rendered full bleed */}
          <img
            src="/hong-wang-portrait.jpg"
            alt="2026 年菲尔兹奖得主、数学家王虹"
          />
          <span>IMAGE SOURCE · IHES · 2026</span>
        </div>
        <div className="person-copy">
          <div className="section-index">05 / THE MATHEMATICIAN</div>
          <p className="person-kicker">HONG WANG · 王虹</p>
          <h2>她研究的，是波动方程与傅里叶振荡在数学上如何传播，也是几何能被压缩到什么程度。</h2>
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
            王虹成为首位获得菲尔兹奖的中国女性；她与于登也是首批在中国大陆完成本科教育的菲尔兹奖得主。
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
