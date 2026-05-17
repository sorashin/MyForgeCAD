// Wooden desktop phone stand.
// Footprint ~100 x 80 mm, height ~60 mm. Reclined back rest, front lip with
// center gap for cables/Home button, and a rear cable pass-through.
// Modeled as a single wooden body (the real artifact would be glued/joined),
// plus a felt anti-slip pad on the underside.

// ---- Parameters ---------------------------------------------------------
const W = Param.number("Width",  100, { min: 80, max: 140, step: 1, unit: "mm" });
const D = Param.number("Depth",   80, { min: 60, max: 110, step: 1, unit: "mm" });
const H = Param.number("Height",  60, { min: 40, max: 90,  step: 1, unit: "mm" });

const baseT = Param.number("Base thickness", 12, { min: 8,  max: 20, step: 1, unit: "mm" });
const backT = Param.number("Back rest thickness", 14, { min: 8, max: 22, step: 1, unit: "mm" });

const leanDeg = Param.number("Lean angle", 18, { min: 8, max: 30, step: 1, unit: "deg" });

const lipH   = Param.number("Front lip height",    10, { min: 5, max: 18, step: 1, unit: "mm" });
const lipT   = Param.number("Front lip thickness",  8, { min: 5, max: 14, step: 1, unit: "mm" });
const lipGap = Param.number("Lip center gap",      22, { min: 12, max: 32, step: 1, unit: "mm" });

const cableW = Param.number("Cable slot width",  20, { min: 10, max: 30, step: 1, unit: "mm" });
const cableHole = Param.number("Cable slot height", 14, { min: 8, max: 22, step: 1, unit: "mm" });

const woodTone   = Param.choice("Wood tone", "walnut", ["walnut", "oak", "maple", "cherry"]);
const showPhone  = Param.bool("Show phone (ghost)", true);

// Wood material palette
const WOOD = {
  walnut: { color: "#5b3a23", rough: 0.62, metal: 0.02 },
  oak:    { color: "#b9874c", rough: 0.65, metal: 0.02 },
  maple:  { color: "#e3c89a", rough: 0.55, metal: 0.02 },
  cherry: { color: "#8a4633", rough: 0.58, metal: 0.02 },
}[woodTone];

const FELT = { color: "#1c1c1c", rough: 0.95, metal: 0.0 };

const leanRad = (leanDeg * Math.PI) / 180;

// ---- Base slab ----------------------------------------------------------
// Centered on XY, sits on z=0. Round the vertical corners for a friendlier
// hand-feel — done BEFORE further booleans, so the fillet topology survives.
let body = box(W, D, baseT);
body = fillet(body, 5, { parallel: [0, 0, 1] });

// ---- Back rest (leaning, joined to base) --------------------------------
// Build the back rest in local coordinates with the cable slot already cut,
// then rotate it to lean forward and place it along the rear of the base.
const backW = W - 16;        // slightly narrower than base
const restH = H + baseT;     // total stand height, since the rest dives into the base

let backRest = box(backW, backT, restH);
// Round the vertical side edges of the back rest before cutting the slot.
backRest = fillet(backRest, 4, { parallel: [0, 0, 1] });

// Cable pass-through — cut before rotation so the slot sits perpendicular
// to the back-rest face.
const cableSlot = box(cableW, backT + 20, cableHole)
  .placeReference("center", [0, 0, baseT + (H * 0.55)]);
backRest = difference(backRest, cableSlot);

// Rotate to lean toward the front (positive Y), pivoting about the rear-bottom
// edge so the back face stays flush with the rear of the base.
const pivotY = -backT / 2;   // local back-bottom edge Y
const pivotZ = 0;            // local bottom Z
backRest = backRest.rotate([1, 0, 0], -leanDeg, { pivot: [0, pivotY, pivotZ] });

// Translate so the back rest's rear-bottom edge sits on the rear-top edge of the base.
backRest = backRest.translate(0, -D / 2 + backT / 2, 0);

// Union back rest into the body — physically a single wooden piece.
body = union(body, backRest);

// ---- Front lip ----------------------------------------------------------
// Two short raised wood walls along the front edge with a center gap.
const lipY = D / 2 - lipT / 2 - 4;
const lipSegLen = (W - lipGap) / 2 - 6;
let lipL = box(lipSegLen, lipT, lipH);
lipL = fillet(lipL, 1.5, { parallel: [0, 0, 1] });
lipL = lipL.translate(-(lipSegLen / 2 + lipGap / 2), lipY, baseT);

let lipR = box(lipSegLen, lipT, lipH);
lipR = fillet(lipR, 1.5, { parallel: [0, 0, 1] });
lipR = lipR.translate(+(lipSegLen / 2 + lipGap / 2), lipY, baseT);

body = union(body, lipL, lipR);

// Phone-rest groove omitted — keeps the boolean stack shallower.

// ---- Felt anti-slip pad -------------------------------------------------
const padThk = 1.2;
const feltPad = box(W - 10, D - 10, padThk).translate(0, 0, -padThk);

// ---- Optional ghost phone (verification) --------------------------------
let phoneGhost = null;
if (showPhone) {
  const phW = 70;
  const phH = 145;
  const phT = 8.5;
  // Build the phone standing upright in its own local frame, then lean it.
  // Local pose: thickness along Y (so face points +Y toward viewer), height
  // along Z. Then rotate about X to lean it back.
  let phone = box(phW, phT, phH);
  // Translate so phone's bottom-front edge sits at the origin (z=0, y=phT/2)
  // before rotation, then rotate about X. The bottom front edge stays put.
  phone = phone.translate(0, phT / 2, 0);
  phone = phone.rotate([1, 0, 0], -leanDeg, { pivot: [0, 0, 0] });

  // Place: phone's bottom-front edge sits on the base top, just behind the
  // front lip's inner face.
  const lipInnerY = lipY - lipT / 2;
  phone = phone.translate(0, lipInnerY - 0.5, baseT + 0.05);
  phoneGhost = phone;
}

// ---- Scene --------------------------------------------------------------
scene({
  background: { top: "#cfd5dd", bottom: "#5a6470" },
  camera: { position: [220, -260, 180], target: [0, 0, 40], fov: 38 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    { type: "directional", position: [160, -200, 260], color: "#ffe2bf", intensity: 2.8, castShadow: true },
    { type: "directional", position: [-180, 140, 160], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.15 },
  ],
  ground: { visible: true, color: "#2b2f36", height: -2, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

// ---- Return -------------------------------------------------------------
const parts = [
  {
    name: "Wooden body",
    shape: body.material({ metalness: WOOD.metal, roughness: WOOD.rough }),
    color: WOOD.color,
  },
  {
    name: "Felt pad",
    shape: feltPad.material({ metalness: FELT.metal, roughness: FELT.rough }),
    color: FELT.color,
  },
];

if (phoneGhost) {
  parts.push({
    name: "Phone (ghost)",
    shape: phoneGhost.material({ metalness: 0.05, roughness: 0.35, opacity: 0.35, transparent: true }),
    color: "#1a1a1a",
  });
}

return parts;
