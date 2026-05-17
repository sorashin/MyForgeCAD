// Link One — Johan Link minimalist watch
// Black PVD-coated stainless case (38mm × 8mm), open chapter ring with
// raised stick indices, recessed matte dial, two simple stick hands with
// luminous white tips, knurled crown at 3 o'clock, date window, and a
// textile-look strap with metal lugs and a folded clasp.

// ─── Case ───────────────────────────────────────────────────────────────
const caseDiameter   = Param.number("Case Diameter",      38,   { min: 28, max: 48, unit: "mm" });
const caseThickness  = Param.number("Case Thickness",     8.2,  { min: 5,  max: 14, unit: "mm" });
const bezelLip       = Param.number("Bezel Lip Height",   0.4,  { min: 0.1, max: 1.5, unit: "mm" });
const bezelInsetW    = Param.number("Bezel Wall",         1.2,  { min: 0.4, max: 3,  unit: "mm" });
const chapterDepth   = Param.number("Chapter Ring Depth", 2.2,  { min: 0.8, max: 5,  unit: "mm" });
const dialInsetExtra = Param.number("Dial Drop",          0.6,  { min: 0.1, max: 3,  unit: "mm" });
const innerDialR     = Param.number("Inner Dial Radius",  10.5, { min: 6,  max: 14, unit: "mm" });

// ─── Indices ────────────────────────────────────────────────────────────
const tickShortLen   = Param.number("Tick Length",        3.0,  { min: 1.2, max: 5,  unit: "mm" });
const tickHourLen    = Param.number("Hour Tick Length",   3.8,  { min: 1.5, max: 6,  unit: "mm" });
const tickWidth      = Param.number("Tick Width",         0.9,  { min: 0.3, max: 2,  unit: "mm" });
const tickRise       = Param.number("Tick Rise",          1.4,  { min: 0.4, max: 3,  unit: "mm" });

// ─── Hands ──────────────────────────────────────────────────────────────
const hourHandLen    = Param.number("Hour Hand Len",      8.5,  { min: 4, max: 14, unit: "mm" });
const minHandLen     = Param.number("Minute Hand Len",   12.5,  { min: 6, max: 18, unit: "mm" });
const handWidth      = Param.number("Hand Width",         1.3,  { min: 0.6, max: 2.4, unit: "mm" });
const handThick      = Param.number("Hand Thickness",     0.55, { min: 0.3, max: 1.5, unit: "mm" });
const lumeFraction   = Param.number("Lume Fraction",      0.55, { min: 0.2, max: 0.9 });
const hourTimeDeg    = Param.number("Hour Pose",          315,  { min: 0, max: 360, unit: "°" });
const minTimeDeg     = Param.number("Minute Pose",         50,  { min: 0, max: 360, unit: "°" });

// ─── Crown ──────────────────────────────────────────────────────────────
const crownRadius    = Param.number("Crown Radius",       1.9,  { min: 1, max: 4, unit: "mm" });
const crownLength    = Param.number("Crown Length",       1.6,  { min: 0.6, max: 3.5, unit: "mm" });
const crownTeeth     = Param.number("Crown Teeth",        14,   { min: 8, max: 24, integer: true });

// ─── Date window ────────────────────────────────────────────────────────
const showDate       = Param.bool  ("Show Date",          true);
const dateAngleDeg   = Param.number("Date Position",      60,   { min: 0, max: 360, unit: "°" });

// ─── Strap ──────────────────────────────────────────────────────────────
const showStrap      = Param.bool  ("Show Strap",         true);
const strapWidth     = Param.number("Strap Width",       18,    { min: 12, max: 24, unit: "mm" });
const strapThick     = Param.number("Strap Thickness",    2.0,  { min: 1, max: 4,  unit: "mm" });
const strapExtend    = Param.number("Strap Extend",      36,    { min: 20, max: 70, unit: "mm" });

// ─── Derived ────────────────────────────────────────────────────────────
const caseR          = caseDiameter / 2;
const chapterOuterR  = caseR - bezelInsetW;          // outer wall of chapter ring
const chapterInnerR  = innerDialR;                   // inner wall (rises to dial)
const dialTopZ       = caseThickness - chapterDepth; // outer chapter ring floor / dial top
const innerDialZ     = dialTopZ - dialInsetExtra;    // inner sunken dial face
const tickRingR      = (chapterOuterR + chapterInnerR) / 2;
const handPivotZ     = dialTopZ + 0.35;              // hands float above the chapter

// ────────────────────────────────────────────────────────────────────────
// Case body — disc with the open chapter ring carved out and a small
// step-down for the inner dial. Slight outward taper toward the back.
// ────────────────────────────────────────────────────────────────────────
let bodyOuter = cylinder(caseThickness, caseR, caseR, 128);

// (case rim chamfers are applied after the pockets below to avoid topology
// conflicts with the pocket sub-edges)

// Carve the chapter ring trough (the floor that holds the raised ticks)
const chapterCavity = cylinder(chapterDepth + 0.05, chapterOuterR, chapterOuterR, 128)
  .translate(0, 0, dialTopZ);
bodyOuter = difference(bodyOuter, chapterCavity);

// Inner dial sits a touch lower than the chapter ring floor — drop a
// pocket so the dial seats below the chapter floor.
const innerDialPocket = cylinder(chapterDepth - dialInsetExtra + 0.05, chapterInnerR + 0.05, chapterInnerR + 0.05, 96)
  .translate(0, 0, innerDialZ);
let body = difference(bodyOuter, innerDialPocket);

// ────────────────────────────────────────────────────────────────────────
// Inner dial — slightly recessed matte disc that holds the hands' pivot
// ────────────────────────────────────────────────────────────────────────
const innerDialThick = 1.2;
const innerDial = cylinder(innerDialThick, chapterInnerR, chapterInnerR, 96)
  .translate(0, 0, innerDialZ - innerDialThick + 0.01);

// A short collar that bridges the inner dial up to the chapter floor
// (makes the section between dial and chapter feel solid, not a void).
const dialCollar = difference(
  cylinder(dialInsetExtra + 0.02, chapterInnerR + 0.6, chapterInnerR + 0.6, 96)
    .translate(0, 0, innerDialZ - 0.01),
  cylinder(dialInsetExtra + 0.1, chapterInnerR, chapterInnerR, 96)
    .translate(0, 0, innerDialZ - 0.05)
);

// ────────────────────────────────────────────────────────────────────────
// Hour indices — 12 raised sticks on the chapter ring floor.
// 12 o'clock is double-width-ish (longer + slightly wider). 3/6/9 are
// slightly longer as well to anchor the cardinal directions.
// ────────────────────────────────────────────────────────────────────────
const ticks = [];
for (let i = 0; i < 12; i++) {
  const isCardinal = (i % 3 === 0);
  const isTop      = (i === 0);
  const len  = isTop ? tickHourLen + 0.4 : isCardinal ? tickHourLen : tickShortLen;
  const wide = isTop ? tickWidth * 1.25 : tickWidth;
  const angle = -i * 30; // 12 o'clock at +Y, clockwise

  const tick = box(wide, len, tickRise)
    .translate(0, tickRingR - len / 2 + (tickHourLen - len) / 2, dialTopZ + 0.001)
    .rotateZ(angle);
  ticks.push(tick);
}
const indices = union(...ticks);

// ────────────────────────────────────────────────────────────────────────
// Crown — small fluted cylinder protruding from 3 o'clock (+X side).
// Modeled as a circular comb of small teeth around a hub to mimic
// the knurled grip visible in the reference photos.
// ────────────────────────────────────────────────────────────────────────
const crownHubR  = crownRadius;
const crownHub   = cylinder(crownLength, crownHubR, crownHubR * 0.92, 32);
// Knurl ridges
const ridgeH = crownLength;
const ridgeW = (2 * Math.PI * crownHubR) / (crownTeeth * 2.2);
const ridge  = box(ridgeW, 0.45, ridgeH).translate(0, crownHubR - 0.1, 0);
const ridges = circularPattern(ridge, crownTeeth);
let crown = union(crownHub, ridges);
// (skip edge treatment — knurled union has too many micro-edges for a clean chamfer)

// Orient so crown axis points along +X (out of the case at 3 o'clock).
// cylinder() builds along +Z; rotate so +Z → +X, then translate out.
const crownZ  = caseThickness / 2 + 0.6;             // slightly above mid-height
const crownX  = caseR + crownLength / 2 - 0.15;      // half-embedded
const crownPositioned = crown.rotateY(90).translate(crownX, 0, crownZ);

// Crown stem (the thin neck where it enters the case)
const stem = cylinder(0.6, crownHubR * 0.55, crownHubR * 0.55, 24)
  .rotateY(90)
  .translate(caseR - 0.3, 0, crownZ);

// ────────────────────────────────────────────────────────────────────────
// Hands — slim bars, with a luminous white tip section.
// We split each hand into a dark base + white "lume" tip so they can be
// returned as separate colored parts.
// ────────────────────────────────────────────────────────────────────────
function handPair(length, width, thick, lumeFrac, tail, z) {
  const lumeLen = length * lumeFrac;
  const baseLen = length - lumeLen + tail;
  const total   = length + tail;

  // Base (dark): from y=-tail to y=length-lumeLen
  const baseY = -tail + baseLen / 2;
  const base = box(width, baseLen, thick).translate(0, baseY, z);

  // Lume tip (white): from y=length-lumeLen to y=length
  const tipY = length - lumeLen / 2;
  const tip  = box(width * 0.95, lumeLen, thick).translate(0, tipY, z);
  return { base, tip, total };
}

const hourPair = handPair(hourHandLen, handWidth * 1.05, handThick, lumeFraction, 3, handPivotZ);
const hourBase = hourPair.base.rotateZ(-hourTimeDeg);
const hourTip  = hourPair.tip.rotateZ(-hourTimeDeg);

const minPair  = handPair(minHandLen,  handWidth * 0.85, handThick, lumeFraction * 0.95, 3, handPivotZ + handThick + 0.1);
const minBase  = minPair.base.rotateZ(-minTimeDeg);
const minTip   = minPair.tip.rotateZ(-minTimeDeg);

// Center hub — tiny pinion cap covering the pivot.
const pivot = union(
  cylinder(handThick * 2 + 0.4, 0.95, 0.95, 32).translate(0, 0, handPivotZ),
  cylinder(0.25, 0.95, 0.55, 24).translate(0, 0, handPivotZ + handThick * 2 + 0.4)
);

// ────────────────────────────────────────────────────────────────────────
// Date window — small recess on the chapter ring with a white "1" disc.
// Subtract a rounded rectangular hole through the chapter, then drop a
// thin disc with a tiny raised numeral suggestion.
// ────────────────────────────────────────────────────────────────────────
let bodyWithDate = body;
let dateDisc = null;
if (showDate) {
  const dateW = 2.6;
  const dateH = 2.0;
  // Build the window cutter at +Y direction, then rotate around Z by -angle.
  const cutter = box(dateW, dateH, chapterDepth + 1.0)
    .translate(0, tickRingR - 0.2, dialTopZ - 0.4)
    .rotateZ(-dateAngleDeg);
  bodyWithDate = difference(bodyWithDate, cutter);

  // White disc that fills the bottom of the cut, suggesting the date wheel.
  dateDisc = box(dateW - 0.5, dateH - 0.5, 0.4)
    .translate(0, tickRingR - 0.2, dialTopZ - 0.35)
    .rotateZ(-dateAngleDeg);
}

// ────────────────────────────────────────────────────────────────────────
// Strap — two textile-look bands with metal lugs that attach to the case
// at 6 and 12 o'clock (top/bottom). The bands curve away from the camera
// so they read as "going around the wrist" without modeling a full loop.
// ────────────────────────────────────────────────────────────────────────
const strapParts = [];
if (showStrap) {
  const lugH = 1.6;
  const lugW = strapWidth + 1.4;
  const lugD = 2.4;
  const lugZ = (caseThickness - lugH) / 2;

  // North lug (12 o'clock side)
  const lugN = box(lugW, lugD, lugH)
    .translate(0, caseR - 0.4, lugZ);
  // South lug (6 o'clock side)
  const lugS = box(lugW, lugD, lugH)
    .translate(0, -(caseR - 0.4), lugZ);

  // Strap bands — tapered boxes extending outward from each lug.
  // Band tucks UNDER the case (so it looks like it continues around the wrist).
  const bandZ = lugZ + (lugH - strapThick) / 2;
  const bandN = box(strapWidth, strapExtend, strapThick)
    .translate(0, caseR + strapExtend / 2 - 1.5, bandZ - 0.4)
    .rotateX(-6);
  const bandS = box(strapWidth, strapExtend, strapThick)
    .translate(0, -(caseR + strapExtend / 2 - 1.5), bandZ - 0.4)
    .rotateX(6);

  // A simple folded clasp on the south band — sits proud on the band surface
  const claspW = strapWidth + 1.2;
  const claspH = 3.2;
  const claspD = 5.0;
  const clasp = box(claspW, claspD, claspH)
    .translate(0, -(caseR + strapExtend * 0.55), bandZ + strapThick / 2);
  // Only round the long horizontal edges on the clasp (front/back), not all 12.
  const claspVertEdges = selectEdges(clasp, { parallel: [1, 0, 0] });
  const claspRounded = claspVertEdges.length > 0 ? fillet(clasp, 0.4, claspVertEdges) : clasp;

  strapParts.push(
    { name: "LugN",   shape: lugN,   color: "#2a2a2c", mat: { metalness: 0.55, roughness: 0.35 } },
    { name: "LugS",   shape: lugS,   color: "#2a2a2c", mat: { metalness: 0.55, roughness: 0.35 } },
    { name: "BandN",  shape: bandN,  color: "#171719", mat: { metalness: 0.02, roughness: 0.95 } },
    { name: "BandS",  shape: bandS,  color: "#171719", mat: { metalness: 0.02, roughness: 0.95 } },
    { name: "Clasp",  shape: claspRounded, color: "#262629", mat: { metalness: 0.55, roughness: 0.40 } },
  );
}

// ────────────────────────────────────────────────────────────────────────
// Materials (matte black PVD on stainless, with white luminous accents)
// ────────────────────────────────────────────────────────────────────────
const matteBlackCase = "#1b1b1d";
const dialBlack      = "#121214";
const chapterBlack   = "#171719";
const lumeWhite      = "#eceae1";
const crownBlack     = "#26262a";
const dateWhite      = "#d8d4c8";

const matCase  = { metalness: 0.20, roughness: 0.72 };
const matDial  = { metalness: 0.05, roughness: 0.92 };
const matLume  = { metalness: 0.05, roughness: 0.55 };
const matCrown = { metalness: 0.35, roughness: 0.50 };
const matHandBase = { metalness: 0.40, roughness: 0.45 };

const parts = [
  { name: "Case",         shape: bodyWithDate.material(matCase),  color: matteBlackCase },
  { name: "DialCollar",   shape: dialCollar.material(matCase),    color: chapterBlack },
  { name: "InnerDial",    shape: innerDial.material(matDial),     color: dialBlack },
  { name: "Indices",      shape: indices.material(matCase),       color: chapterBlack },
  { name: "Crown",        shape: crownPositioned.material(matCrown), color: crownBlack },
  { name: "CrownStem",    shape: stem.material(matCrown),         color: crownBlack },
  { name: "HourHandBase", shape: hourBase.material(matHandBase),  color: "#27272a" },
  { name: "HourHandTip",  shape: hourTip.material(matLume),       color: lumeWhite },
  { name: "MinHandBase",  shape: minBase.material(matHandBase),   color: "#27272a" },
  { name: "MinHandTip",   shape: minTip.material(matLume),        color: lumeWhite },
  { name: "Pivot",        shape: pivot.material({ metalness: 0.5, roughness: 0.35 }), color: "#0a0a0c" },
];

if (showDate && dateDisc) {
  parts.push({
    name: "DateDisc",
    shape: dateDisc.material({ metalness: 0.05, roughness: 0.80 }),
    color: dateWhite,
  });
}

for (const sp of strapParts) {
  parts.push({ name: sp.name, shape: sp.shape.material(sp.mat), color: sp.color });
}

// ────────────────────────────────────────────────────────────────────────
// Scene — matte industrial hero shot
// ────────────────────────────────────────────────────────────────────────
scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera: { position: [70, -90, 55], target: [0, 0, caseThickness * 0.55], fov: 36 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    { type: "directional", position: [120, -160, 220], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-120, 90, 160], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.15 },
  ],
  ground: { visible: true, color: "#3a3f47", height: -2.5, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.05, threshold: 0.92, radius: 0.28 },
    vignette: { darkness: 0.42, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

return parts;
