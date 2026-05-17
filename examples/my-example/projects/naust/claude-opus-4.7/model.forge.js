// Naust — Espen Surnevik-inspired boathouse architectural model
// Asymmetric mono-pitch / sheared-gable form with zinc cladding,
// dry-stone plinth, and large glazed end opening.

// ---- Parameters ----
const buildingLength = Param.number("Building length", 200, { min: 120, max: 320, unit: "mm" });
const buildingWidth  = Param.number("Building width", 100, { min: 60, max: 180, unit: "mm" });
const buildingHeight = Param.number("Total height", 120, { min: 80, max: 200, unit: "mm" });

const baseHeight    = Param.number("Stone base height", 30, { min: 10, max: 80, unit: "mm" });
const baseOverhang  = Param.number("Base overhang", 6, { min: 0, max: 20, unit: "mm" });
const wallHeight    = Param.number("Wall (clad) height", 20, { min: 8, max: 60, unit: "mm" });

// Asymmetric roof: peak offset along X. Negative => peak toward -X (high gable on left).
const roofPeakOffset = Param.number("Roof peak offset", 55, { min: -80, max: 80, unit: "mm" });
const eaveOverhangX  = Param.number("Eave overhang X", 4, { min: 0, max: 15, unit: "mm" });
const eaveOverhangY  = Param.number("Eave overhang Y", 3, { min: 0, max: 12, unit: "mm" });

const dormerLen   = Param.number("Dormer length", 55, { min: 20, max: 120, unit: "mm" });
const dormerWidth = Param.number("Dormer width", 78, { min: 30, max: 140, unit: "mm" });
const dormerHeight = Param.number("Dormer height", 28, { min: 10, max: 60, unit: "mm" });

const glassInset  = Param.number("Glazing inset", 2.5, { min: 0.5, max: 6, unit: "mm" });
const gableGlassW = Param.number("Gable glass width", 78, { min: 30, max: 140, unit: "mm" });
const gableGlassH = Param.number("Gable glass height", 30, { min: 10, max: 60, unit: "mm" });

const claddingSeamSpacing = Param.number("Cladding seam spacing", 16, { min: 6, max: 30, unit: "mm" });

const showStair = Param.bool("Show stair", true);
const showVents = Param.bool("Show roof vents", true);
const showGround = Param.bool("Show ground plane", true);

const variant = Param.choice("High gable side", "+X (right)", ["+X (right)", "-X (left)"]);

// ---- Colors / materials ----
const C = {
  stoneDark:  "#5a5550",
  stoneLight: "#8c8479",
  stoneMid:   "#6b6660",
  stoneMortar:"#3e3a36",
  zinc:       "#33363a",
  zincDark:   "#23262a",
  trim:       "#15171a",
  glass:      "#5d6b78",
  woodFloor:  "#d8c4a2",
  ground:     "#3a4030",
  stairMetal: "#1b1d1f",
  vent:       "#3d4146",
};

// ---- Helpers ----
const halfL = buildingLength / 2;
const halfW = buildingWidth / 2;
// Sign of high gable: high side at +X if variant says +X.
const highSign = variant === "+X (right)" ? 1 : -1;
// Peak X (in world coords) — peak should be near the HIGH gable, with the
// long shallow slope running toward the opposite (low) end.
const peakX = highSign * Math.abs(roofPeakOffset);
const roofH = buildingHeight - baseHeight - wallHeight;

// ---- Stone plinth ----
function makeStoneBase() {
  const bw = buildingWidth + 2 * baseOverhang;
  const bl = buildingLength + 2 * baseOverhang;

  const mass = box(bl, bw, baseHeight)
    .placeReference("center", [0, 0, baseHeight / 2])
    .color(C.stoneMortar)
    .material({ roughness: 0.98, metalness: 0.0 });

  // Stacked horizontal courses suggest rough drystone wall
  const courseCount = 5;
  const courseH = baseHeight / courseCount;
  const courses = [];
  for (let i = 0; i < courseCount; i++) {
    const tone = i % 2 === 0 ? C.stoneMid : C.stoneLight;
    const inset = 0.4;
    const band = box(bl - inset, bw - inset, courseH * 0.88)
      .placeReference("center", [0, 0, i * courseH + courseH / 2])
      .color(tone)
      .material({ roughness: 0.96, metalness: 0.0 });
    courses.push(band);
  }

  // Scattered stones poking out of the long faces
  const bumps = [];
  const bumpRows = 4;
  const bumpCols = 10;
  for (let r = 0; r < bumpRows; r++) {
    for (let c = 0; c < bumpCols; c++) {
      const z = (r + 0.5) * (baseHeight / bumpRows);
      const xJitter = ((r * 17 + c * 31) % 7) - 3;
      const x = -halfL + (c + 0.5) * (buildingLength / bumpCols) + xJitter * 0.6;
      const seed = (r * 7 + c * 13) % 5;
      const sx = 7 + seed * 2;
      const sy = 2.2 + (seed % 3) * 0.8;
      const sz = 2.6 + (seed % 4) * 0.9;
      const tone = seed % 2 === 0 ? C.stoneDark : C.stoneLight;
      bumps.push(
        box(sx, sy, sz)
          .placeReference("center", [x, -halfW - baseOverhang - sy * 0.15, z])
          .color(tone)
          .material({ roughness: 0.96 })
      );
      bumps.push(
        box(sx, sy, sz)
          .placeReference("center", [x, halfW + baseOverhang + sy * 0.15, z])
          .color(tone)
          .material({ roughness: 0.96 })
      );
    }
  }
  // End faces
  const endRows = 4;
  const endCols = 5;
  for (let r = 0; r < endRows; r++) {
    for (let c = 0; c < endCols; c++) {
      const z = (r + 0.5) * (baseHeight / endRows);
      const yJ = ((r * 11 + c * 19) % 6) - 2.5;
      const y = -halfW + (c + 0.5) * (buildingWidth / endCols) + yJ * 0.7;
      const seed = (r * 5 + c * 11) % 5;
      const sx = 2.2 + (seed % 3) * 0.8;
      const sy = 7 + seed * 1.6;
      const sz = 2.6 + (seed % 4) * 0.9;
      const tone = seed % 2 === 0 ? C.stoneDark : C.stoneLight;
      bumps.push(
        box(sx, sy, sz)
          .placeReference("center", [-halfL - baseOverhang - sx * 0.15, y, z])
          .color(tone)
          .material({ roughness: 0.96 })
      );
      bumps.push(
        box(sx, sy, sz)
          .placeReference("center", [halfL + baseOverhang + sx * 0.15, y, z])
          .color(tone)
          .material({ roughness: 0.96 })
      );
    }
  }
  return { mass, courses, bumps };
}

// ---- Main clad volume ----
function makeMainBox() {
  return box(buildingLength, buildingWidth, wallHeight)
    .placeReference("center", [0, 0, baseHeight + wallHeight / 2])
    .color(C.zinc)
    .material({ roughness: 0.5, metalness: 0.6 });
}

// ---- Asymmetric mono-pitch roof ----
// Cross-section in XZ swept along Y. Peak near the HIGH gable so the long
// slope runs to the LOW gable.
function makeRoof() {
  const roofLen = buildingLength + 2 * eaveOverhangX;
  const roofWid = buildingWidth + 2 * eaveOverhangY;

  // The polygon is laid out in (x, y) where y becomes the roof HEIGHT after
  // rotateX(-90). The thickness (eave depth) is small to give the slab a
  // physical thickness even though we draw it as a triangular section.
  const pts = [
    [-roofLen / 2, 0],
    [peakX, roofH],
    [roofLen / 2, 0],
  ];
  // We need a closed area; add a tiny lip so this becomes a triangle (already 3 pts).
  // 3 points form a valid triangle.

  // polygon().extrude() extrudes +Z. After rotateX(-90), the +Z extrusion
  // direction becomes +Y, so the Y-thickness will be roofWid.
  // polygon().extrude(h) makes a prism extending +Z. rotateX(+90) maps
  // (x,y,z) -> (x, -z, y). So the polygon's Y (roof height, +Y) stays as +Z
  // after rotation, and the +Z extrusion (0..roofWid) becomes -Y depth
  // (-roofWid..0). Translate +Y by roofWid/2 to center the slab on the
  // building.
  const prism = polygon(pts)
    .extrude(roofWid)
    .rotate([1, 0, 0], 90)
    .translate(0, roofWid / 2, baseHeight + wallHeight)
    .color(C.zinc)
    .material({ roughness: 0.42, metalness: 0.65 });

  return prism;
}

// ---- Cladding seams on walls (vertical lines) ----
function makeWallSeams() {
  const seams = [];
  const seamW = 0.6;
  const seamProtrude = 0.4;

  const longSeamCount = Math.floor(buildingLength / claddingSeamSpacing);
  for (let i = 1; i < longSeamCount; i++) {
    const x = -halfL + i * (buildingLength / longSeamCount);
    seams.push(
      box(seamW, seamProtrude, wallHeight)
        .placeReference("center", [x, -halfW - seamProtrude / 2, baseHeight + wallHeight / 2])
        .color(C.zincDark)
        .material({ roughness: 0.5, metalness: 0.6 })
    );
    seams.push(
      box(seamW, seamProtrude, wallHeight)
        .placeReference("center", [x, halfW + seamProtrude / 2, baseHeight + wallHeight / 2])
        .color(C.zincDark)
        .material({ roughness: 0.5, metalness: 0.6 })
    );
  }
  const shortSeamCount = Math.floor(buildingWidth / claddingSeamSpacing);
  for (let i = 1; i < shortSeamCount; i++) {
    const y = -halfW + i * (buildingWidth / shortSeamCount);
    seams.push(
      box(seamProtrude, seamW, wallHeight)
        .placeReference("center", [-halfL - seamProtrude / 2, y, baseHeight + wallHeight / 2])
        .color(C.zincDark)
        .material({ roughness: 0.5, metalness: 0.6 })
    );
    seams.push(
      box(seamProtrude, seamW, wallHeight)
        .placeReference("center", [halfL + seamProtrude / 2, y, baseHeight + wallHeight / 2])
        .color(C.zincDark)
        .material({ roughness: 0.5, metalness: 0.6 })
    );
  }
  return seams;
}

// ---- Dormer / upper extension ----
// A boxy extension that sits ON the high side of the roof, mimicking the
// upper volume seen in the references.
function makeDormer() {
  // Place dormer over the high gable end of the building.
  // Center it past the peak in the direction of the HIGH gable so it sits
  // on the steeper slope.
  const dormerCenterX = peakX + highSign * (dormerLen / 2 - 4);
  // Base height: just on top of walls (clip into roof for clean union look)
  const dormerZ0 = baseHeight + wallHeight - 2;
  const body = box(dormerLen, dormerWidth, dormerHeight)
    .placeReference("center", [dormerCenterX, 0, dormerZ0 + dormerHeight / 2])
    .color(C.zinc)
    .material({ roughness: 0.5, metalness: 0.6 });

  // Vertical seam pattern on dormer faces (long sides facing +/-Y)
  const dormerSeams = [];
  const seamW = 0.5;
  const seamP = 0.35;
  const ds = Math.floor(dormerLen / claddingSeamSpacing);
  for (let i = 1; i < ds; i++) {
    const x = dormerCenterX - dormerLen / 2 + i * (dormerLen / ds);
    for (const sgn of [-1, 1]) {
      dormerSeams.push(
        box(seamW, seamP, dormerHeight)
          .placeReference("center", [x, sgn * (dormerWidth / 2 + seamP / 2), dormerZ0 + dormerHeight / 2])
          .color(C.zincDark)
          .material({ roughness: 0.5, metalness: 0.6 })
      );
    }
  }

  // Small ventilation slit on the gable face of the dormer
  const slitWall = highSign > 0 ? dormerCenterX + dormerLen / 2 + 0.25 : dormerCenterX - dormerLen / 2 - 0.25;
  const slit = box(0.5, 5, 7)
    .placeReference("center", [slitWall, 0, dormerZ0 + dormerHeight * 0.55])
    .color(C.trim)
    .material({ roughness: 0.6 });

  return { body, dormerSeams, slit, dormerCenterX, dormerZ0 };
}

// ---- Gable glazing on the LOW side (where the long slope ends low) ----
// The big floor-to-eave glass wall sits on the LOW end gable.
function makeLowGableGlass() {
  // Low gable is at -highSign * halfL
  const gableSign = -highSign; // +1 means glass on +X end
  const xWall = gableSign * halfL;
  const glassZ = baseHeight + wallHeight / 2;
  const recess = glassInset;
  const frameOuter = 1.4;

  const frame = box(recess + 1.0, gableGlassW + frameOuter * 2, gableGlassH + frameOuter * 2)
    .placeReference("center", [xWall - gableSign * ((recess + 1.0) / 2 - 0.5), 0, glassZ])
    .color(C.trim)
    .material({ roughness: 0.4, metalness: 0.3 });

  const glass = box(recess, gableGlassW, gableGlassH)
    .placeReference("center", [xWall - gableSign * (recess / 2 - 0.1), 0, glassZ])
    .color(C.glass)
    .material({ roughness: 0.08, metalness: 0.1, transmission: 0.85, opacity: 0.55 });

  const mullion = box(recess + 1.1, 0.9, gableGlassH + frameOuter * 2)
    .placeReference("center", [xWall - gableSign * ((recess + 1.1) / 2 - 0.55), 0, glassZ])
    .color(C.trim)
    .material({ roughness: 0.45 });

  return [frame, glass, mullion];
}

// ---- Small pitched window on the HIGH gable / dormer face ----
function makeHighGableWindow(dormer) {
  // Place on the dormer's outward-facing gable wall.
  const recess = glassInset;
  const w = 30;
  const h = 26;
  const xWall = dormer.dormerCenterX + highSign * (dormerLen / 2 + 0.1);
  const z = dormer.dormerZ0 + dormerHeight * 0.5;
  const frame = box(recess + 0.8, w + 2.5, h + 2.5)
    .placeReference("center", [xWall + highSign * ((recess + 0.8) / 2 - 0.4), 0, z])
    .color(C.trim)
    .material({ roughness: 0.4 });
  const glass = box(recess, w, h)
    .placeReference("center", [xWall + highSign * (recess / 2 - 0.05), 0, z])
    .color(C.glass)
    .material({ roughness: 0.08, transmission: 0.8, opacity: 0.55 });
  return [frame, glass];
}

// ---- Roof vent cones ----
function makeVents() {
  if (!showVents) return [];
  const longHalfRun = (buildingLength / 2 + eaveOverhangX) - Math.abs(peakX);
  // Long slope runs toward the LOW side (-highSign direction)
  const sideSign = -highSign;
  const xMid = peakX + sideSign * (longHalfRun * 0.45);
  // Height at xMid on the long slope: linear interpolation from peak (peakX, roofH) to eave (sideSign*roofLen/2, 0).
  const eaveX = sideSign * (buildingLength / 2 + eaveOverhangX);
  const t = (xMid - peakX) / (eaveX - peakX);
  const zMid = baseHeight + wallHeight + roofH * (1 - t);

  // Slope angle (rotation around Y so cone tilts with roof)
  const slopeAng = Math.atan2(roofH, Math.abs(eaveX - peakX)) * 180 / Math.PI;
  const rotAng = -sideSign * slopeAng;

  const cones = [];
  for (const yOff of [-buildingWidth * 0.12, buildingWidth * 0.12]) {
    const ventH = 10;
    // Tapered cone: cylinder(h, rBottom, rTop)
    const cone = cylinder(ventH, 3.6, 0.8)
      .rotate([0, 1, 0], rotAng)
      .translate(xMid, yOff, zMid + 0.5)
      .color(C.vent)
      .material({ roughness: 0.45, metalness: 0.6 });
    cones.push(cone);
  }
  return cones;
}

// ---- Black metal stair leading up to the entry ----
function makeStair() {
  if (!showStair) return [];
  // Stair leads up to one long-side wall of the building.
  // Place it along the -Y face, near the LOW gable (where the big glass is).
  const lowSign = -highSign;
  const stepCount = 7;
  const stepRise = baseHeight / stepCount;
  const stepRun  = 7;
  const stepWidth = 14;
  // Center the stair x-position near the low gable end, but inside the long wall
  const stairCenterX = lowSign * (buildingLength * 0.25);
  const stairY0 = -halfW - baseOverhang - 0.5; // outer face of base
  const steps = [];
  for (let i = 0; i < stepCount; i++) {
    const z = (i + 1) * stepRise;
    const y = stairY0 - i * stepRun - stepRun / 2;
    steps.push(
      box(stepWidth, stepRun, 0.8)
        .placeReference("center", [stairCenterX, y, z - 0.4])
        .color(C.stairMetal)
        .material({ roughness: 0.5, metalness: 0.4 })
    );
  }
  // Stringers
  const stringerLen = stepRun * stepCount + 1;
  const stringerCy  = stairY0 - stringerLen / 2;
  for (const xs of [-stepWidth / 2 + 0.6, stepWidth / 2 - 0.6]) {
    steps.push(
      box(0.9, stringerLen, baseHeight + 1.5)
        .placeReference("center", [stairCenterX + xs, stringerCy, (baseHeight + 1.5) / 2])
        .color(C.stairMetal)
        .material({ roughness: 0.55, metalness: 0.35 })
    );
  }
  // Railing posts
  const railH = 14;
  const postCount = 4;
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    const y = stairY0 - t * (stepRun * (stepCount - 0.5));
    const z = baseHeight - t * (baseHeight - stepRise) + railH / 2;
    for (const xs of [-stepWidth / 2 + 0.6, stepWidth / 2 - 0.6]) {
      steps.push(
        box(0.5, 0.5, railH)
          .placeReference("center", [stairCenterX + xs, y, z])
          .color(C.stairMetal)
      );
    }
  }
  // Top handrail (two parallel bars)
  const railLen = stepRun * (stepCount - 0.5);
  for (const xs of [-stepWidth / 2 + 0.6, stepWidth / 2 - 0.6]) {
    steps.push(
      box(0.5, railLen, 0.5)
        .placeReference("center", [stairCenterX + xs, stairY0 - railLen / 2, baseHeight + railH * 0.5])
        .color(C.stairMetal)
    );
  }
  return steps;
}

// ---- Ground ----
function makeGround() {
  if (!showGround) return null;
  return box(buildingLength * 2.4, buildingWidth * 3.5, 2)
    .placeReference("center", [0, -buildingWidth * 0.4, -1])
    .color(C.ground)
    .material({ roughness: 0.95, metalness: 0.0 });
}

// ---- Compose ----
const stone   = makeStoneBase();
const mainBox = makeMainBox();
const roof    = makeRoof();
const seams   = makeWallSeams();
const dormer  = makeDormer();
const gable   = makeLowGableGlass();
const window2 = makeHighGableWindow(dormer);
const vents   = makeVents();
const stair   = makeStair();
const ground  = makeGround();

// ---- Scene ----
scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera: {
    position: [buildingLength * 1.5, -buildingLength * 1.6, buildingHeight * 1.1],
    target: [0, 0, buildingHeight * 0.5],
    fov: 36,
  },
  environment: { preset: "warehouse", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.18 },
    {
      type: "directional",
      position: [buildingLength * 1.5, -buildingLength * 1.2, buildingHeight * 3],
      target: [0, 0, 0],
      color: "#ffe2bf",
      intensity: 2.8,
      castShadow: true,
    },
    {
      type: "directional",
      position: [-buildingLength, buildingWidth * 2, buildingHeight * 2],
      target: [0, 0, 0],
      color: "#d4e6fb",
      intensity: 0.9,
    },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.15 },
  ],
  ground: { visible: false, color: "#2d3528", height: -2, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.08,
  },
});

// ---- Return named parts ----
const parts = [
  { name: "Stone Mortar Core", shape: stone.mass, color: C.stoneMortar },
  ...stone.courses.map((c, i) => ({ name: `Stone Course ${i}`, shape: c })),
  ...stone.bumps.map((b, i) => ({ name: `Stone ${i}`, shape: b })),
  { name: "Main Box", shape: mainBox, color: C.zinc },
  { name: "Roof", shape: roof, color: C.zinc },
  ...seams.map((s, i) => ({ name: `Wall Seam ${i}`, shape: s })),
  { name: "Dormer", shape: dormer.body, color: C.zinc },
  ...dormer.dormerSeams.map((s, i) => ({ name: `Dormer Seam ${i}`, shape: s })),
  { name: "Dormer Slit", shape: dormer.slit, color: C.trim },
  { name: "Low Gable Frame", shape: gable[0], color: C.trim },
  { name: "Low Gable Glass", shape: gable[1], color: C.glass },
  { name: "Low Gable Mullion", shape: gable[2], color: C.trim },
  { name: "High Window Frame", shape: window2[0], color: C.trim },
  { name: "High Window Glass", shape: window2[1], color: C.glass },
  ...vents.map((v, i) => ({ name: `Vent ${i}`, shape: v })),
  ...stair.map((s, i) => ({ name: `Stair ${i}`, shape: s })),
];
if (ground) parts.push({ name: "Ground", shape: ground, color: C.ground });

return parts;
