// KOMBU Fermenstation — parametric home kombucha brewer
// Reference: rounded-rectangular body, brushed aluminum shell, charcoal lid/base, front window + tap

const bodyW    = Param.number("Body Width",       180, { min: 120, max: 280, unit: "mm" });
const bodyD    = Param.number("Body Depth",        140, { min: 100, max: 220, unit: "mm" });
const bodyH    = Param.number("Body Height",       300, { min: 200, max: 450, unit: "mm" });
const cornerR  = Param.number("Corner Radius",      28, { min: 8,   max: 50,  unit: "mm" });
const wallT    = Param.number("Wall Thickness",      5, { min: 2,   max: 10,  unit: "mm" });

const baseH    = Param.number("Base Height",         25, { min: 10, max: 50, unit: "mm" });
const baseOver = Param.number("Base Overhang",        6, { min: 0,  max: 20, unit: "mm" });
const ribCount = Param.number("Rib Count",           32, { min: 16, max: 64, integer: true });

const lidH     = Param.number("Lid Height",          20, { min: 8,  max: 40, unit: "mm" });
const lidSlotW = Param.number("Lid Slot Width",       60, { min: 20, max: 120, unit: "mm" });
const lidSlotD = Param.number("Lid Slot Depth",        8, { min: 2,  max: 20, unit: "mm" });

const winW     = Param.number("Window Width",         80, { min: 40, max: 140, unit: "mm" });
const winH     = Param.number("Window Height",       180, { min: 80, max: 260, unit: "mm" });
const winInset = Param.number("Window Inset",          2, { min: 0,  max: 8,   unit: "mm" });

const tapDia   = Param.number("Tap Diameter",         18, { min: 10, max: 30, unit: "mm" });
const tapProj  = Param.number("Tap Protrusion",        35, { min: 20, max: 60, unit: "mm" });
const tapZ     = Param.number("Tap Z from base top",   30, { min: 10, max: 80, unit: "mm" });

const dispH    = Param.number("Display Panel Height",  40, { min: 20, max: 80, unit: "mm" });

// ── COLORS ───────────────────────────────────────────────────────────────
const colShell   = '#B8BEC7'; // brushed aluminum
const colCharc   = '#2C2C2E'; // dark charcoal
const colLiquid  = '#7A3B10'; // amber kombucha
const colGlass   = '#C8A882'; // amber-tinted frosted panel
const colDisplay = '#1A1A1C'; // near-black OLED panel

// ── HELPERS ──────────────────────────────────────────────────────────────
// Rounded-rectangular prism built from cylinder + box unions (pill shape)
function roundedRect(w, d, h, r, segs) {
  const s = segs || 48;
  const cx = w / 2 - r;
  const cy = d / 2 - r;
  const core = box(w - 2 * r, d, h);
  const coreY = box(w, d - 2 * r, h);
  const c1 = cylinder(h, r, r, s).translate( cx,  cy, 0);
  const c2 = cylinder(h, r, r, s).translate(-cx,  cy, 0);
  const c3 = cylinder(h, r, r, s).translate(-cx, -cy, 0);
  const c4 = cylinder(h, r, r, s).translate( cx, -cy, 0);
  return union(core, coreY, c1, c2, c3, c4);
}

// ── 1. BASE ──────────────────────────────────────────────────────────────
const baseW = bodyW + baseOver * 2;
const baseD2 = bodyD + baseOver * 2;
const baseCornerR = cornerR + baseOver;

// Solid base block
const baseSolid = roundedRect(baseW, baseD2, baseH, baseCornerR);

// Ribs: vertical fins arranged in a ring around the base. Each rib is a thin
// radially-oriented box placed at the perimeter and rotated so its long axis
// points outward.
const ribW = 2.5;
const ribDepth = 4;
const ribH2 = baseH;
const ribRadius = baseW / 2 - ribW / 2;
const ribs = [];
for (let i = 0; i < ribCount; i++) {
  const angle = (i / ribCount) * 360;
  const rad = angle * Math.PI / 180;
  const rx = ribRadius * Math.cos(rad);
  const ry = ribRadius * Math.sin(rad);
  // rib is oriented so its depth points radially outward
  const rib = box(ribW, ribDepth, ribH2)
    .placeReference('center', [0, 0, ribH2 / 2])
    .translate(rx, ry, 0)
    .rotateZ(angle, { pivot: [0, 0, 0] });
  ribs.push(rib);
}
const ribRing = union(ribs);
const base = union(baseSolid, ribRing)
  .color(colCharc)
  .material({ metalness: 0.05, roughness: 0.85 });

// ── 2. BODY SHELL ────────────────────────────────────────────────────────
// Outer shell starts at baseH, height = bodyH
const bodyShell = roundedRect(bodyW, bodyD, bodyH, cornerR)
  .translate(0, 0, baseH)
  .color(colShell)
  .material({ metalness: 0.55, roughness: 0.35 });

// ── 3. FRONT PANEL + WINDOW + DISPLAY ────────────────────────────────────
// Layout (Y axis, front = -Y):
//   body front face at y = -bodyD/2 = -70
//   dark recessed panel background: y range [-70, -64] (6mm deep slab, sitting just inside body)
//   window glass: y range [-70, -67] (3mm slab flush with body front face)
//   liquid: behind glass at y = -62
//
// Z layout:
//   tapTopZ = bottom of window zone
//   window: tapTopZ → tapTopZ + winH
//   display strip: tapTopZ + winH + 4 → tapTopZ + winH + 4 + dispH

const tapTopZ     = baseH + tapZ + tapDia + 8;
const winBottomZ  = tapTopZ;
const dispBottomZ = winBottomZ + winH + 4;
const panelH      = winH + dispH + 8;
const panelW      = winW + 8;

// Dark background panel (behind glass) — 6mm slab starting at front face interior
const frontPanelY = -(bodyD / 2 - 3);  // center of 6mm slab: face at -70, slab front at -67, back at -73 → use center = -70
const frontPanel = box(panelW, 6, panelH)
  .placeReference('center', [0, -(bodyD / 2 - 3), winBottomZ + panelH / 2])
  .color(colCharc)
  .material({ metalness: 0.1, roughness: 0.7 });

// Display strip above window
const displayPanel = box(winW - 4, 4, dispH)
  .placeReference('center', [0, -(bodyD / 2 - 2), dispBottomZ + dispH / 2])
  .color(colDisplay)
  .material({ metalness: 0.02, roughness: 0.9, emissive: '#0a0a10', emissiveIntensity: 0.5 });

// ── 4. WINDOW GLASS (amber) ──────────────────────────────────────────────
const glassThick = 3;
const liquidH    = winH - 8;

// Glass sits at body front face, flushed outward
const windowGlass = box(winW, glassThick, winH)
  .placeReference('center', [0, -(bodyD / 2 - glassThick / 2), winBottomZ + winH / 2])
  .color(colGlass)
  .material({ opacity: 0.45, roughness: 0.08, metalness: 0 });

// Liquid behind the glass
const liquid = box(winW - 6, 10, liquidH)
  .placeReference('center', [0, -(bodyD / 2 - glassThick - 5), winBottomZ + liquidH / 2 + 4])
  .color(colLiquid)
  .material({ opacity: 0.85, roughness: 0.05, metalness: 0 });

// ── 5. TAP / DISPENSER ──────────────────────────────────────────────────
const tapZ_world = baseH + tapZ;
const frontFaceY = -(bodyD / 2);

// Tap body: horizontal cylinder protruding in -Y direction from front face
// cylinder is Z-up by default; rotateX(-90) makes it point in -Y direction
const tapBody = cylinder(tapProj, tapDia / 2)
  .rotateX(-90)
  .translate(0, frontFaceY - tapProj / 2, tapZ_world + tapDia / 2);

// Tap collar at root where it meets the body
const tapCollar = cylinder(10, tapDia / 2 + 4)
  .rotateX(-90)
  .translate(0, frontFaceY - 5, tapZ_world + tapDia / 2);

// Tap handle lever (small tab below the spout)
const tapHandle = box(8, 18, tapDia * 0.7)
  .translate(0, frontFaceY - tapProj * 0.55, tapZ_world - 2);

const tap = union(tapBody, tapCollar, tapHandle)
  .color(colCharc)
  .material({ metalness: 0.15, roughness: 0.75 });

// ── 6. LID ───────────────────────────────────────────────────────────────
const lidCornerR = cornerR - 2;
const lidSolid = roundedRect(bodyW - 2, bodyD - 2, lidH, lidCornerR);

// Slot cutout on top of lid
const slotCutter = box(lidSlotW, bodyD * 0.65, lidSlotD + 2)
  .translate(0, 0, lidH - lidSlotD + 1);

const lid = difference(lidSolid, slotCutter)
  .translate(0, 0, baseH + bodyH)
  .color(colCharc)
  .material({ metalness: 0.08, roughness: 0.8 });

// ── 7. SCENE ─────────────────────────────────────────────────────────────
const totalH = baseH + bodyH + lidH;
const camTarget = [0, 0, totalH * 0.45];

scene({
  background: { top: '#c8d0d8', bottom: '#68788a' },
  camera: { position: [320, -480, 340], target: camTarget, fov: 40 },
  environment: { preset: 'studio', intensity: 0.18, background: false },
  lights: [
    { type: 'ambient',      color: '#ede8e0', intensity: 0.14 },
    { type: 'directional',  position: [240, -300, 440], target: [0, 0, totalH * 0.4], color: '#ffe4c8', intensity: 2.9, castShadow: true },
    { type: 'directional',  position: [-220, 200, 220], target: [0, 0, totalH * 0.3], color: '#ccddf0', intensity: 0.8 },
    { type: 'hemisphere',   skyColor: '#c8d4e0', groundColor: '#48586a', intensity: 0.15 },
  ],
  ground: { visible: true, color: '#101418', height: -2, receiveShadow: true },
  postProcessing: {
    bloom:               { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette:            { darkness: 0.4,  offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

// ── RETURN ────────────────────────────────────────────────────────────────
return [
  { name: 'Base',         shape: base },
  { name: 'Body Shell',   shape: bodyShell },
  { name: 'Front Panel',  shape: frontPanel },
  { name: 'Display',      shape: displayPanel },
  { name: 'Window Glass', shape: windowGlass },
  { name: 'Liquid',       shape: liquid },
  { name: 'Tap',          shape: tap },
  { name: 'Lid',          shape: lid },
];
