// Stando — Japanese kitchen pinsette tong (Guerra Office / Gestura style).
// One-piece bent stainless strip with tapered chopstick-like arms and a
// downward "drip" fin near the middle that acts as a stand so the tips
// hover above the table when set down.

// --- Overall geometry ------------------------------------------------------
const totalLength    = Param.number("Overall Length",      180, { min: 150, max: 220, step: 1,    unit: "mm" });
const rearGap        = Param.number("Rear Inside Gap",     5.0, { min: 1.5, max: 12,  step: 0.1,  unit: "mm" });
const openingAngle   = Param.number("Arm Opening Angle",   2.4, { min: 0,   max: 7,   step: 0.1,  unit: "deg" });

// --- Tapered cross-section (root → tip) -----------------------------------
const rootWidth      = Param.number("Root Width",          9.5, { min: 6,   max: 14,  step: 0.1,  unit: "mm" });
const tipWidth       = Param.number("Tip Width",           1.9, { min: 0.8, max: 3.5, step: 0.1,  unit: "mm" });
const rootThickness  = Param.number("Root Thickness",      2.1, { min: 1.2, max: 3.2, step: 0.05, unit: "mm" });
const tipThickness   = Param.number("Tip Thickness",       1.0, { min: 0.5, max: 2.0, step: 0.05, unit: "mm" });
const taperExp       = Param.number("Taper Exponent",      1.30, { min: 0.7, max: 2.4, step: 0.02 });
const armStations    = Param.number("Loft Stations",       28,  { min: 12,  max: 48,  step: 1,    integer: true });

// --- Stand foot (the downward drip fin) -----------------------------------
const standPos       = Param.number("Stand Position (frac)", 0.46, { min: 0.30, max: 0.65, step: 0.01 });
const standLength    = Param.number("Stand Length",        14.0, { min: 6,   max: 26,  step: 0.5, unit: "mm" });
const standDrop      = Param.number("Stand Drop",          2.5,  { min: 1.0, max: 5.0, step: 0.05, unit: "mm" });
const standThickness = Param.number("Stand Thickness",     1.4,  { min: 0.7, max: 2.5, step: 0.05, unit: "mm" });

// --- Tip serrations -------------------------------------------------------
const showSerr       = Param.bool  ("Show Tip Serrations", true);
const serrCount      = Param.number("Tip Serration Count", 11,   { min: 0,   max: 22,  step: 1,    integer: true });
const serrPitch      = Param.number("Serration Pitch",     1.55, { min: 0.8, max: 3.0, step: 0.05, unit: "mm" });
const serrDepth      = Param.number("Serration Depth",     0.22, { min: 0.05, max: 0.5, step: 0.01, unit: "mm" });
const serrWidth      = Param.number("Serration Cut Width", 0.42, { min: 0.18, max: 0.9, step: 0.02, unit: "mm" });

// --- Finish ---------------------------------------------------------------
const finish = Param.choice("Finish", "Matte Stainless", [
  "Matte Stainless",
  "Brushed Steel",
  "Warm Brass Study",
]);
const finishes = {
  "Matte Stainless":  { color: "#b6bac0", metalness: 0.86, roughness: 0.55 },
  "Brushed Steel":    { color: "#9aa0a8", metalness: 0.92, roughness: 0.42 },
  "Warm Brass Study": { color: "#c7aa73", metalness: 0.78, roughness: 0.48 },
};
const mat = finishes[finish];

// --- Derived dimensions ---------------------------------------------------
const armOffset = rearGap / 2 + rootWidth / 2;  // Y offset of each arm centerline at the root
const armLength = totalLength;                  // straight-arm length used for loft

console.log("arm length:", armLength.toFixed(1), "arm Y offset:", armOffset.toFixed(2));

function widthAt(t)     { const e = Math.pow(t, taperExp);        return rootWidth     + (tipWidth     - rootWidth)     * e; }
function thicknessAt(t) { const e = Math.pow(t, taperExp * 1.05); return rootThickness + (tipThickness - rootThickness) * e; }

// One tapered arm running along +X, centred on Y=0, symmetric in Z.
function makeArm() {
  const profiles = [];
  const heights  = [];
  for (let i = 0; i < armStations; i++) {
    const t  = i / (armStations - 1);
    const w  = widthAt(t);
    const th = thicknessAt(t);
    const r  = Math.min(w, th) * 0.45;
    // sketch lives in XY: use (X = thickness, Y = width); after rotating about Y by 90°
    // sketch-X (thickness) → world-Z, sketch-Y (width) stays world-Y, loft-Z → world-X.
    profiles.push(roundedRect(th, w, r));
    heights.push(t * armLength);
  }
  let arm = loft(profiles, heights, { edgeLength: 0.9 }).rotate([0, 1, 0], 90);

  if (showSerr && serrCount > 0) {
    const cutters = [];
    const tipTopZ   = thicknessAt(1.0) / 2;
    const tipStartX = armLength - 2.5;
    for (let i = 0; i < serrCount; i++) {
      const x = tipStartX - i * serrPitch;
      if (x < armLength - 26) break;
      cutters.push(
        box(serrWidth, tipWidth * 3.0, serrDepth * 3.5)
          .placeReference("center", [x, 0, tipTopZ - serrDepth * 0.2])
      );
    }
    if (cutters.length > 0) arm = difference(arm, union(...cutters));
  }
  return arm;
}

// Downward "drip" stand fin built from a bezier teardrop in the XZ plane.
function makeStandFoot() {
  const cx      = standPos * armLength;
  const localTh = thicknessAt(standPos);
  const half = standLength / 2;
  const drop = standDrop;
  // Drawn flat in XY (long axis X, drop along -Y), then rotated up to XZ.
  const p = path()
    .moveTo(-half, 0)
    .bezierTo(-half * 0.55, -drop * 0.18, -half * 0.18, -drop * 0.95, 0, -drop)
    .bezierTo( half * 0.18, -drop * 0.95,  half * 0.55, -drop * 0.18,  half, 0)
    .close();

  return p.extrude(standThickness)
    .placeReference("center", [0, 0, 0])
    .rotate([1, 0, 0], 90)                      // lay teardrop on the XZ plane, width along Y
    .translate(cx, 0, -localTh / 2 + 0.2);      // hang below the arm with a slight embed
}

// Rear U-bend connecting the two arms.
function makeRearBend() {
  const Router = rearGap / 2 + rootWidth;
  const Rinner = Math.max(0.2, rearGap / 2);
  const ring = difference2d(circle2d(Router, 72), circle2d(Rinner, 72))
    .extrude(rootThickness)
    .placeReference("center", [0, 0, 0]);
  // Keep only the back half (X < 0).
  const cutter = box(Router * 2.4, Router * 2.4, rootThickness * 4)
    .placeReference("center", [Router * 1.2, 0, 0]);
  return difference(ring, cutter);
}

// --- Assemble both arms ---------------------------------------------------
const armCore = union(makeArm(), makeStandFoot());

const upperArm = armCore
  .rotateZ(openingAngle, { pivot: [0, 0, 0] })
  .translate(0, armOffset, 0);

const lowerArm = armCore
  .rotateZ(-openingAngle, { pivot: [0, 0, 0] })
  .translate(0, -armOffset, 0);

let body = union(upperArm, lowerArm, makeRearBend())
  // Recentre along X and lift so the stand fin rests on z = 0.
  .translate(-armLength / 2, 0, standDrop);

const bodyShape = body
  .color(mat.color)
  .material({
    metalness: mat.metalness,
    roughness: mat.roughness,
    clearcoat: 0.05,
    clearcoatRoughness: 0.7,
  });

// --- Scene ----------------------------------------------------------------
scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera: { position: [180, -260, 130], target: [0, 0, 6], fov: 36 },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient",     color: "#efe7dc", intensity: 0.14 },
    { type: "directional", position: [260, -320, 420], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-260, 210, 220], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere",  skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.14 },
  ],
  ground: { visible: true, color: "#22272e", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom:    { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
  views: {
    hero: { camera: { position: [180, -260, 130], target: [0, 0, 6], up: [0, 0, 1], fov: 36 } },
    side: { camera: { position: [0,   -340, 30],  target: [0, 0, 6], up: [0, 0, 1], fov: 28 } },
    top:  { camera: { position: [0,   0,    340], target: [0, 0, 0], up: [1, 0, 0], fov: 28 } },
  },
});

return [
  { name: "Stando tweezer body", shape: bodyShape, color: mat.color },
];
