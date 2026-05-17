// KOMBU "Fermenstation" — home kombucha fermentation appliance.
// Rounded-rectangle aluminum body with a matte-black recessed front panel,
// small spout, top fill cavity, and knurled base. Reference-image driven —
// despite the brief saying "cylindrical 180mm", the actual product is an
// oblong rounded-rectangle in footprint.

const W = Param.number("Body Width",  260, { min: 200, max: 320, step: 2, unit: "mm" });
const D = Param.number("Body Depth",  150, { min: 120, max: 200, step: 2, unit: "mm" });
const H = Param.number("Body Height", 280, { min: 220, max: 340, step: 2, unit: "mm" });
const R = Param.number("Corner Radius", 50, { min: 20, max: 75, step: 1, unit: "mm" });

const BASE_H = Param.number("Knurled Base Height", 22, { min: 10, max: 36, step: 1, unit: "mm" });
const LID_H  = Param.number("Lid Thickness", 12, { min: 8, max: 20, step: 1, unit: "mm" });

const FRONT_PANEL_W = Param.number("Front Panel Width", 110, { min: 80, max: 160, step: 2, unit: "mm" });
const FRONT_INSET   = Param.number("Front Panel Inset", 3.5, { min: 1.5, max: 6, step: 0.5, unit: "mm" });

const WINDOW_W = Param.number("Window Width", 78, { min: 50, max: 100, step: 2, unit: "mm" });
const WINDOW_H = Param.number("Window Height", 150, { min: 100, max: 200, step: 2, unit: "mm" });

const TOP_RECESS_W = Param.number("Top Recess Width",  130, { min: 80, max: 200, step: 2, unit: "mm" });
const TOP_RECESS_D = Param.number("Top Recess Depth",   90, { min: 60, max: 130, step: 2, unit: "mm" });
const TOP_RECESS_H = Param.number("Top Recess Depth Z", 16, { min: 8,  max: 30,  step: 1, unit: "mm" });

const SPOUT_R    = Param.number("Spout Radius", 6, { min: 3, max: 10, step: 0.5, unit: "mm" });
const SPOUT_LEN  = Param.number("Spout Body Length", 22, { min: 12, max: 35, step: 1, unit: "mm" });
const SPOUT_FROM_BASE = Param.number("Spout Height From Base", 55, { min: 30, max: 90, step: 2, unit: "mm" });

const KNURL_COUNT = Param.number("Knurl Count", 96, { min: 48, max: 144, step: 2, integer: true });

const SHOW_LID = Param.bool("Show Lid On Top", true);
const SHOW_BOTTLES = Param.bool("Show Internal Bottles (ghost)", false);

const showVariant = Param.choice("View", "hero", ["hero", "lid-off"]);

// ────────────────────────────────────────────────────────────
// Materials / palette
// ────────────────────────────────────────────────────────────
const COLOR_ALU       = "#b9bcc1";  // brushed/satin aluminum
const COLOR_ALU_DARK  = "#8d9095";  // shaded aluminum
const COLOR_BLACK_MATTE = "#1d1f22"; // soft matte black
const COLOR_BLACK_DEEP  = "#0e0f11"; // deep recess
const COLOR_BLACK_RUBBER = "#2a2b2d"; // knurled rubber base
const COLOR_GLASS_TINT  = "#5e3a23"; // warm amber tea
const COLOR_LOGO         = "#cfd2d6";

const MAT_ALU = {
  metalness: 0.55,
  roughness: 0.45,
  clearcoat: 0.15,
  clearcoatRoughness: 0.55,
};
const MAT_BLACK = { metalness: 0.05, roughness: 0.78 };
const MAT_RUBBER = { metalness: 0.0, roughness: 0.92 };
const MAT_GLASS = { metalness: 0.0, roughness: 0.18, opacity: 0.55, clearcoat: 0.6 };

// ────────────────────────────────────────────────────────────
// 1) Main aluminum body — rounded-rectangle prism
//    Top of base ring sits at z = BASE_H. Body itself runs BASE_H..H.
// ────────────────────────────────────────────────────────────
const bodyHeight = H - BASE_H;
let body = roundedRect(W, D, R).extrude(bodyHeight).translate(0, 0, BASE_H);

// Cut the front recess for the black panel + window + spout strip.
// The recess is a flat plane carved into the front face: panel_w wide,
// runs from just below top down to just above base, recessed FRONT_INSET deep.
const recessW = FRONT_PANEL_W;
const recessH = bodyHeight - 18; // small inset top & bottom
const recessCutter = box(recessW, FRONT_INSET * 2 + 2, recessH)
  .translate(0, -D / 2 + FRONT_INSET, BASE_H + 9);
body = difference(body, recessCutter);

// Now build the recessed front panel (matte black plate flush-inset into the body).
const frontPanel = box(recessW, FRONT_INSET, recessH)
  .translate(0, -D / 2 + FRONT_INSET / 2, BASE_H + 9)
  .color(COLOR_BLACK_MATTE)
  .material(MAT_BLACK);

// Tinted glass window inset into the black panel.
const windowGlass = box(WINDOW_W, FRONT_INSET * 0.55, WINDOW_H)
  .translate(0, -D / 2 + FRONT_INSET - 0.6, BASE_H + 28)
  .color(COLOR_GLASS_TINT)
  .material(MAT_GLASS);

// Spout: small black cylinder protruding from the panel, with a downward outlet.
const spoutZ = BASE_H + SPOUT_FROM_BASE;
const spoutBody = cylinder(SPOUT_LEN, SPOUT_R)
  // cylinder base at z=0, axis +Z. rotateX(-90) makes axis point -Y.
  .rotateX(-90)
  .translate(0, -D / 2 - SPOUT_LEN * 0.35, spoutZ + 8);
const spoutOutlet = cylinder(14, SPOUT_R * 0.55)
  .translate(0, -D / 2 - SPOUT_LEN * 0.25, spoutZ - 6);
const spoutCap = cylinder(3, SPOUT_R * 1.05)
  .rotateX(-90)
  .translate(0, -D / 2 - SPOUT_LEN * 0.55, spoutZ + 8);
const spout = union(spoutBody, spoutOutlet, spoutCap)
  .color(COLOR_BLACK_MATTE)
  .material(MAT_BLACK);

// Logo plate: simple recessed dark rectangle near top of front panel ("KOMBU" placeholder).
const logoMark = box(48, FRONT_INSET * 0.3, 6)
  .translate(0, -D / 2 + FRONT_INSET - 0.3, H - 35)
  .color(COLOR_LOGO)
  .material({ metalness: 0.2, roughness: 0.6 });

// ────────────────────────────────────────────────────────────
// 2) Top recess (the bottle insertion cavity carved into the top face)
// ────────────────────────────────────────────────────────────
// Position it slightly forward of center (matches image 08 top-view).
const topRecessOffsetX = 0;
const topRecessOffsetY = 5;
const topRecessSketch = roundedRect(TOP_RECESS_W, TOP_RECESS_D, 18);
const topRecessCutter = topRecessSketch.extrude(TOP_RECESS_H + 1)
  .translate(topRecessOffsetX, topRecessOffsetY, H - TOP_RECESS_H);
body = difference(body, topRecessCutter);

// Inside-of-recess: a darker matte liner so it reads black inside.
const recessLiner = roundedRect(TOP_RECESS_W - 3, TOP_RECESS_D - 3, 16)
  .extrude(TOP_RECESS_H - 1)
  .translate(topRecessOffsetX, topRecessOffsetY, H - TOP_RECESS_H + 0.5)
  .color(COLOR_BLACK_DEEP)
  .material(MAT_BLACK);

// Soft top rim fillet (gentle) on remaining body. Keep radius small so we
// don't accidentally swallow the recess opening.
try {
  body = fillet(body, 1.5, { atZ: H, convex: true, tolerance: 1.0 });
} catch (e) {
  // If edge selection fails (boolean topology), skip — visual impact is small.
}

body = body.color(COLOR_ALU).material(MAT_ALU);

// ────────────────────────────────────────────────────────────
// 3) Knurled base ring — black, slightly wider than body bottom
// ────────────────────────────────────────────────────────────
// Base outer footprint matches the body footprint (no flare). The knurl is
// made of many tall narrow vertical ribs distributed around the rounded-rect
// perimeter. We approximate with a darker prism plus an outer ring of small
// vertical slats.

const baseProfile = roundedRect(W + 1.5, D + 1.5, R);
let base = baseProfile.extrude(BASE_H);

// Bottom chamfer / slight inset at very bottom
const baseInsetCutter = roundedRect(W - 3, D - 3, R - 2).extrude(2);
base = difference(base, baseInsetCutter);

base = base.color(COLOR_BLACK_RUBBER).material(MAT_RUBBER);

// Knurl ribs: small vertical slats placed around the rounded-rect perimeter.
// We sample the rounded-rect perimeter analytically using parametric layout
// along its four straight segments + four corner arcs.
function* perimeterSamples(w, d, r, count) {
  const halfW = w / 2 - r;
  const halfD = d / 2 - r;
  const straightLen = 2 * (halfW * 2) + 2 * (halfD * 2); // 4 straights
  const arcLen = 2 * Math.PI * r;                          // 4 quarter arcs sum
  const total = straightLen + arcLen;
  for (let i = 0; i < count; i++) {
    const s = (i / count) * total;
    let t = s;
    // segment 1: bottom edge, left->right at y=-d/2+0 going +X
    if (t < halfW * 2) {
      yield { x: -halfW + t, y: -d / 2, nx: 0, ny: -1 };
      continue;
    }
    t -= halfW * 2;
    // arc 1: bottom-right corner
    if (t < (Math.PI / 2) * r) {
      const a = -Math.PI / 2 + t / r;
      yield { x: halfW + r * Math.cos(a), y: -halfD + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      continue;
    }
    t -= (Math.PI / 2) * r;
    // segment 2: right edge, going +Y
    if (t < halfD * 2) {
      yield { x: w / 2, y: -halfD + t, nx: 1, ny: 0 };
      continue;
    }
    t -= halfD * 2;
    // arc 2: top-right corner
    if (t < (Math.PI / 2) * r) {
      const a = 0 + t / r;
      yield { x: halfW + r * Math.cos(a), y: halfD + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      continue;
    }
    t -= (Math.PI / 2) * r;
    // segment 3: top edge, going -X
    if (t < halfW * 2) {
      yield { x: halfW - t, y: d / 2, nx: 0, ny: 1 };
      continue;
    }
    t -= halfW * 2;
    // arc 3: top-left corner
    if (t < (Math.PI / 2) * r) {
      const a = Math.PI / 2 + t / r;
      yield { x: -halfW + r * Math.cos(a), y: halfD + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      continue;
    }
    t -= (Math.PI / 2) * r;
    // segment 4: left edge, going -Y
    if (t < halfD * 2) {
      yield { x: -w / 2, y: halfD - t, nx: -1, ny: 0 };
      continue;
    }
    t -= halfD * 2;
    // arc 4: bottom-left corner
    if (t < (Math.PI / 2) * r) {
      const a = Math.PI + t / r;
      yield { x: -halfW + r * Math.cos(a), y: -halfD + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      continue;
    }
  }
}

const knurlSlats = [];
const knurlW = 1.4;
const knurlT = 1.3;
const knurlH = BASE_H - 3;
for (const p of perimeterSamples(W + 1.5, D + 1.5, R, KNURL_COUNT)) {
  // Slat: thin tall box, oriented so its long axis is tangent (perpendicular
  // to the outward normal). For simplicity we use a rotated rectangle.
  const angle = Math.atan2(p.ny, p.nx) * 180 / Math.PI;
  const slat = box(knurlW, knurlT, knurlH)
    .rotateZ(angle - 90)
    .translate(p.x + p.nx * 0.4, p.y + p.ny * 0.4, 1.5);
  knurlSlats.push(slat);
}
const knurlBand = union(knurlSlats).color("#3a3b3d").material(MAT_RUBBER);

// ────────────────────────────────────────────────────────────
// 4) Lid — separate flat aluminum piece sitting on top
// ────────────────────────────────────────────────────────────
// Lid covers the entire top of the body, with a small handle indent on the
// upper face. In images 02 and 09 the lid sits flush over the recess.
let lid = roundedRect(W - 1, D - 1, R - 1).extrude(LID_H);
// Subtle finger indent
const indent = roundedRect(70, 8, 4).extrude(2.2).translate(W / 4 - 8, 0, LID_H - 1.5);
lid = difference(lid, indent);

const lidZ = (SHOW_LID && showVariant === "hero") ? H + 0.5 : H + 90; // lifted in lid-off view
lid = lid.translate(0, 0, lidZ)
  .color(COLOR_BLACK_MATTE)
  .material(MAT_BLACK);

// ────────────────────────────────────────────────────────────
// 5) Optional internal bottles (ghosts — for fit demo)
// ────────────────────────────────────────────────────────────
const bottles = [];
if (SHOW_BOTTLES || showVariant === "lid-off") {
  const innerW = TOP_RECESS_W - 12;
  const innerD = TOP_RECESS_D - 12;
  const bx = topRecessOffsetX;
  const by = topRecessOffsetY;
  const positions = [
    [-innerW / 4, -innerD / 4],
    [ innerW / 4, -innerD / 4],
    [-innerW / 4,  innerD / 4],
    [ innerW / 4,  innerD / 4],
  ];
  for (const [ox, oy] of positions) {
    const bottleH = H - BASE_H - TOP_RECESS_H - 8;
    const glassR = 24;
    const neckR = 14;
    const glass = cylinder(bottleH - 18, glassR)
      .translate(bx + ox, by + oy, BASE_H + 4)
      .color("#d8c9a0")
      .material({ metalness: 0, roughness: 0.15, opacity: 0.45, clearcoat: 0.7 });
    const shoulder = cylinder(10, glassR, neckR)
      .translate(bx + ox, by + oy, BASE_H + 4 + bottleH - 18);
    const neck = cylinder(8, neckR)
      .translate(bx + ox, by + oy, BASE_H + 4 + bottleH - 8);
    const cap = cylinder(10, neckR + 1)
      .translate(bx + ox, by + oy, BASE_H + 4 + bottleH);
    bottles.push({ name: `Bottle ${bottles.length + 1} Shoulder`, shape: shoulder.color("#d8c9a0").material({ opacity: 0.4, roughness: 0.2 }) });
    bottles.push({ name: `Bottle ${bottles.length} Neck`, shape: neck.color("#d8c9a0").material({ opacity: 0.4, roughness: 0.2 }) });
    bottles.push({ name: `Bottle ${bottles.length} Cap`, shape: cap.color(COLOR_BLACK_MATTE).material(MAT_BLACK) });
    bottles.push({ name: `Bottle ${bottles.length} Glass`, shape: glass });
  }
}

// ────────────────────────────────────────────────────────────
// 6) Scene — matte industrial hero shot
// ────────────────────────────────────────────────────────────
scene({
  background: { top: "#dee2e8", bottom: "#9aa3ad" },
  camera: { position: [520, -640, 360], target: [0, 0, H * 0.55], fov: 34 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.18 },
    { type: "directional", position: [320, -420, 540], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-340, 260, 280], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.18 },
  ],
  ground: { visible: true, color: "#cdd2d8", height: -2, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.95, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
});

// ────────────────────────────────────────────────────────────
// Return the assembly
// ────────────────────────────────────────────────────────────
const parts = [
  { name: "Body (Aluminum Shell)", shape: body, color: COLOR_ALU },
  { name: "Base (Knurled Rubber)", shape: base, color: COLOR_BLACK_RUBBER },
  { name: "Base Knurl Band", shape: knurlBand, color: "#3a3b3d" },
  { name: "Front Panel", shape: frontPanel, color: COLOR_BLACK_MATTE },
  { name: "Window (Tinted Glass)", shape: windowGlass, color: COLOR_GLASS_TINT },
  { name: "Spout", shape: spout, color: COLOR_BLACK_MATTE },
  { name: "Logo Mark", shape: logoMark, color: COLOR_LOGO },
  { name: "Top Recess Liner", shape: recessLiner, color: COLOR_BLACK_DEEP },
];

if (SHOW_LID || showVariant === "lid-off") {
  parts.push({ name: "Lid", shape: lid, color: COLOR_BLACK_MATTE });
}

for (const b of bottles) parts.push(b);

return parts;
