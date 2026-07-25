# Design QA — 挂谷猜想交互网站修复

## Comparison Setup

- Source visual truth:
  - `work/audit/01-hero.png` — 2535 × 1301 px
  - `work/audit/02-question.png` — 2534 × 1159 px
  - `work/audit/07-proof-step-3.png` — 1824 × 632 px
  - `work/audit/08-proof-step-4.png` — 1836 × 643 px
  - `work/audit/11-person.png` — 2541 × 854 px
  - `work/audit/12-award.png` — 2533 × 697 px
- Browser-rendered implementation:
  - `work/verification/hero-desktop.png`
  - `work/verification/question-desktop.png`
  - `work/verification/proof-step-03.png`
  - `work/verification/proof-step-04.png`
  - `work/verification/person-desktop.png`
  - `work/verification/award-desktop.png`
  - Desktop screenshots: 1265 × 712 px, DPR 1
  - Mobile screenshots: `work/verification/hero-mobile.png` and `work/verification/proof-mobile.png`, 375 × 812 px output from a 390 × 844 CSS viewport override, DPR 1
- Combined comparison input: `work/verification/qa-comparison.png`
- State: desktop default theme; proof tabs 03 and 04 selected; mobile hero and proof overview.
- Normalization: each source and implementation image was fitted into an equal 1200 × 675 comparison cell without cropping. The source audit captures used a wider viewport, so the comparison judges hierarchy, content, rendering correctness and responsive behavior rather than pixel-identical line breaks.

## Full-view Comparison Evidence

- The dark ink / cyan / gold / paper visual system is preserved across all revised screens.
- Ultra-wide content no longer expands without limit: desktop sections use a shared 1600 px content cap while backgrounds remain full bleed.
- The proof map remains visually consistent with the original art direction while replacing broken CSS arithmetic with responsive canvas rendering.
- The mobile pass preserves the editorial hierarchy and exposes the proof step navigation as a horizontal tab strip without horizontal page overflow.

## Focused Region Comparison Evidence

- Question diagram: the old common-center starburst was replaced by displaced unit segments with visibly different centers and directions. The image now agrees with the adjacent explanation.
- Proof step 03: the old capture showed all geometry clipped against the left edge. The revised capture shows three complete scale panels, connectors and increasing density.
- Proof step 04: the old capture showed an empty grid. The revised capture shows the finite tube layout while explicitly stating that the canvas does not compute three-dimensional volume.
- Person section: the embedded IHES poster was replaced by a clean crop from the supplied official source image; the portrait and attribution remain visible without a second competing layout.
- Award section: the original sparse composition now includes location, date, research field and an official IHES source link.

## Required Fidelity Surfaces

- Fonts and typography: the original Songti-style display hierarchy is preserved. Body text, navigation and controls were enlarged; the proof heading now keeps “不可过度重叠” together on desktop and releases the constraint on mobile. No truncation was observed.
- Spacing and layout rhythm: the shared page gutter prevents excessive ultra-wide dispersion. Buttons meet a minimum 44 px interaction height. Proof content is balanced between navigation, visual and explanation columns.
- Colors and visual tokens: existing ink, paper, cyan and gold tokens are retained. Secondary text contrast was raised without changing the visual identity.
- Image quality and asset fidelity: the Wang Hong portrait is a real crop of the supplied IHES image, not a generated or reconstructed substitute. It remains sharp at the rendered size.
- Copy and content: theorem, collaboration credit, award date and institutional role remain present. Current facts were checked against the IHES announcement and arXiv:2502.17655.

## Comparison History

### Iteration 1 — audit findings

- P0: proof step 03 geometry clipped to the far-left edge.
- P0: proof step 04 geometry was effectively blank.
- P0: the question diagram implied a common center, contradicting the definition in the copy.
- P1/P2: overly small text and controls, unbounded ultra-wide spacing, double-poster person imagery, sparse award evidence.

### Fixes applied

- Replaced modulo-like CSS calculations with deterministic responsive canvas drawings for all five proof states.
- Rebuilt step 03 as a three-scale sequence and step 04 as a visible controlled-overlap union.
- Rebuilt the question diagram with displaced line centers.
- Added input / operation / output logic to every proof step.
- Added max-width gutters, sticky chapter navigation with current-section state, larger body text, stronger contrast, 44 px controls and focus outlines.
- Cropped the supplied IHES image to a clean portrait and expanded the award evidence block.

### Post-fix evidence

- `work/verification/proof-step-03.png` and `proof-step-04.png` show complete geometry with no clipping or blank state.
- `work/verification/question-desktop.png` shows non-concurrent segments.
- `work/verification/person-desktop.png` shows the portrait without poster text competing with page content.
- `work/verification/hero-mobile.png` and `proof-mobile.png` show responsive behavior at the mobile breakpoint.
- Browser console: 0 errors, 0 warnings.
- Primary interactions tested: all five proof tabs, all six historical eras, the two-/three-dimensional theorem switch, line-angle wrapping, sticky navigation links and the responsive proof tab strip.

## Scientific correctness pass

- Unoriented three-dimensional line directions are sampled on one representative hemisphere, so antipodal vectors are not counted twice.
- Tube width is tied to a normalized unit-segment radius parameter rather than an arbitrary percentage readout.
- The planar zero-area construction is attributed to Besicovitch; the planar full-dimension theorem is attributed to Davies (1971).
- Finite animations no longer output fabricated occupied volume, clustering verdicts, or fitted dimension estimates.
- Wave-packet and multiscale canvases are labeled as conceptual correspondences, not PDE solvers or numerical proofs.
- The 2026 award state defaults to 2026 and preserves the Wang–Zahl coauthorship of the three-dimensional theorem.

## Typography pass

- Chinese display and chapter headings use the expanded Songti/serif fallback stack at weight 700.
- Navigation and primary body copy were increased by roughly 2 px while retaining the original editorial hierarchy.
- Monospaced labels, parameters and step numbers were increased by 2–3 px and given slightly stronger weights.
- Desktop hero, three-column timeline and proof controls were visually checked after the change; responsive breakpoints retain their existing one-column layouts.

## Findings

- No actionable P0, P1 or P2 visual findings remain in the tested states.

## Follow-up Polish

- P3: the hero laboratory remains a direction sampler rather than a literal Kakeya-set construction; the caption makes that boundary explicit.
- P3: a future pass could add direct keyboard focus-state screenshots and test the external links against live destination availability.

## 2026-07-25 Interactive Upgrade

- Source visual truth: the user-provided captures represented by `work/audit/02-question.png`, `work/audit/04-proof-overview.png`, `work/audit/05-proof-step-1.png` through `work/audit/10-timeline.png`.
- Implementation state: live in-app browser at `http://localhost:3001/`, viewport 1066 × 870 CSS px, DPR 1.
- Visual continuity: the previously passed paper / ink / cyan / gold system, typography, grid spacing and section proportions were preserved. The new controls reuse the existing mono labels, border opacity and control treatment.
- New interaction checks:
  - Question diagram: selected line angle changed from 45° to 55° through the rotation control; direct drag and wheel handlers are attached to the canvas.
  - Proof map: all five tabs exposed distinct live controls and readouts: δ radius, clustering percentage, scale, spatial spread/union estimate, and animated δ→0.
  - Limit animation: the visible δ readout changed while playing and the button changed to “暂停”.
  - Century timeline: all six era tabs opened distinct experiments with unique titles, controls and explanatory outcomes.
  - Detailed argument map: the 2025 theorem opened a five-step chain; selecting “跨尺度推进” synchronized the experiment and displayed the two-scale grains / refined induction / Nikishin–Stein–Pisier step.
  - Browser console: no errors or warnings; only Vite development and React DevTools informational messages.
  - Layout: document scroll width equalled viewport client width; no horizontal page overflow. At the tested 1066 px viewport, timeline cards formed three columns while experiment and derivation stages correctly collapsed to one-column/two-column responsive states.
- Focused visual capture note: the in-app browser surface exposed DOM, interaction and console inspection but did not support a new screenshot command. The unchanged base visual system remains covered by the prior browser-rendered comparison images listed above; the new interaction layer was checked through live rendered geometry, computed layout and visible state text.
- Current actionable findings: none at P0/P1/P2.

## Implementation Checklist

- [x] Fix proof steps 03 and 04.
- [x] Correct the Kakeya concept diagram.
- [x] Improve typography, contrast and control size.
- [x] Add bounded wide-screen gutters and sticky chapter state.
- [x] Replace the double-poster person asset.
- [x] Add official award facts and source link.
- [x] Verify desktop and mobile in the in-app browser.
- [x] Check browser console.
- [x] Make the question diagram directly draggable and rotatable.
- [x] Add a distinct mathematical control and live readout to each proof step.
- [x] Add six interactive century-progress experiments.
- [x] Add historically accurate, step-by-step argument maps for every era.
- [x] Distinguish problems, constructions, methods, the 2025 theorem and the 2026 award.

final result: passed
