// Parametric study model of Espen Surnevik's naust-like gabled boathouse.
// Scale model: dry-stone plinth, dark standing-seam metal shell, pale wood interior, and large glazed ends.

const length = Param.number("Overall Length", 200, { min: 150, max: 260, step: 1, unit: "mm" });
const width = Param.number("Overall Width", 100, { min: 75, max: 135, step: 1, unit: "mm" });
const ridgeHeight = Param.number("Ridge Height", 120, { min: 90, max: 155, step: 1, unit: "mm" });
const eaveHeight = Param.number("Eave Height", 58, { min: 42, max: 82, step: 1, unit: "mm" });
const plinthHeight = Param.number("Stone Plinth Height", 33, { min: 18, max: 48, step: 1, unit: "mm" });
const overhang = Param.number("Roof Overhang", 6, { min: 1, max: 14, step: 0.5, unit: "mm" });
const metalSkin = Param.number("Metal Skin Thickness", 1.8, { min: 0.7, max: 4, step: 0.1, unit: "mm" });
const wallSkin = Param.number("Wall Cladding Thickness", 1.4, { min: 0.6, max: 3, step: 0.1, unit: "mm" });

const roofSeamCount = Param.number("Roof Seam Count", 13, { min: 7, max: 21, step: 2, integer: true });
const roofSeamWidth = Param.number("Roof Seam Width", 1.1, { min: 0.45, max: 2.2, step: 0.05, unit: "mm" });
const roofSeamHeight = Param.number("Roof Seam Height", 1.0, { min: 0.35, max: 2.0, step: 0.05, unit: "mm" });
const wallPanelCount = Param.number("Wall Panel Count", 10, { min: 5, max: 16, step: 1, integer: true });
const panelGrooveDepth = Param.number("Panel Groove Depth", 0.7, { min: 0.25, max: 1.4, step: 0.05, unit: "mm" });

const glassWidth = Param.number("End Glass Width", 72, { min: 42, max: 95, step: 1, unit: "mm" });
const glassHeight = Param.number("End Glass Height", 41, { min: 24, max: 62, step: 1, unit: "mm" });
const glassBottom = Param.number("End Glass Sill Height", 55, { min: 38, max: 78, step: 1, unit: "mm" });
const glassInset = Param.number("Glass Inset", 2.2, { min: 0.6, max: 6, step: 0.1, unit: "mm" });
const frameBar = Param.number("Window Frame Bar", 2.2, { min: 1.0, max: 4.2, step: 0.1, unit: "mm" });

const stoneCourses = Param.number("Stone Courses", 5, { min: 3, max: 8, step: 1, integer: true });
const stonesPerLongSide = Param.number("Stones Per Long Side", 14, { min: 8, max: 22, step: 1, integer: true });
const stoneWallThickness = Param.number("Stone Wall Thickness", 9, { min: 5, max: 15, step: 0.5, unit: "mm" });
const stoneRelief = Param.number("Stone Relief Variation", 1.5, { min: 0, max: 4, step: 0.1, unit: "mm" });

const plankCount = Param.number("Interior Floor Planks", 9, { min: 5, max: 15, step: 1, integer: true });
const plankGap = Param.number("Plank Gap", 0.45, { min: 0, max: 1.4, step: 0.05, unit: "mm" });
const woodLiningThickness = Param.number("Wood Lining Thickness", 1.2, { min: 0.5, max: 3, step: 0.1, unit: "mm" });

const ventGridRows = Param.number("Vent Hole Rows", 6, { min: 3, max: 9, step: 1, integer: true });
const ventGridCols = Param.number("Vent Hole Columns", 5, { min: 3, max: 8, step: 1, integer: true });
const ventHoleRadius = Param.number("Vent Hole Radius", 0.85, { min: 0.35, max: 1.8, step: 0.05, unit: "mm" });
const ventHolePitch = Param.number("Vent Hole Pitch", 4.0, { min: 2.3, max: 7.0, step: 0.1, unit: "mm" });

const roofVentCount = Param.number("Roof Vent Count", 2, { min: 0, max: 3, step: 1, integer: true });
const roofVentRadius = Param.number("Roof Vent Base Radius", 4.0, { min: 2, max: 7, step: 0.2, unit: "mm" });
const roofVentHeight = Param.number("Roof Vent Height", 11, { min: 5, max: 18, step: 0.5, unit: "mm" });

const showStair = Param.bool("Show Exterior Stair", true);
const stairWidth = Param.number("Stair Width", 24, { min: 14, max: 38, step: 1, unit: "mm" });
const stairRun = Param.number("Stair Run", 58, { min: 32, max: 82, step: 1, unit: "mm" });
const stairRise = Param.number("Stair Rise", 36, { min: 20, max: 52, step: 1, unit: "mm" });
const stairStepCount = Param.number("Stair Step Count", 7, { min: 4, max: 11, step: 1, integer: true });

const finish = Param.choice("Metal Finish", "graphite zinc", [
  "graphite zinc",
  "weathered black steel",
  "soft charcoal study",
]);

const roofRun = width / 2 + overhang;
const roofRise = ridgeHeight - eaveHeight;
const roofAngle = Math.atan2(roofRise, width / 2) * 180 / Math.PI;
const roofSlope = Math.sqrt(roofRun * roofRun + roofRise * roofRise);
const centerZ = (eaveHeight + ridgeHeight) / 2;
const halfLength = length / 2;
const halfWidth = width / 2;

const metalPalette = {
  "graphite zinc": {
    shell: "#232927",
    rib: "#323936",
    frame: "#101412",
    material: { metalness: 0.38, roughness: 0.64, clearcoat: 0.08, clearcoatRoughness: 0.72 },
  },
  "weathered black steel": {
    shell: "#161a19",
    rib: "#272c2a",
    frame: "#080a09",
    material: { metalness: 0.46, roughness: 0.72, clearcoat: 0.04, clearcoatRoughness: 0.85 },
  },
  "soft charcoal study": {
    shell: "#3a3f3d",
    rib: "#4b514e",
    frame: "#151817",
    material: { metalness: 0.18, roughness: 0.78, clearcoat: 0.06, clearcoatRoughness: 0.8 },
  },
};

const metal = metalPalette[finish];
const stoneColor = "#7d7b72";
const stoneDark = "#4e514a";
const woodColor = "#dfc49b";
const woodDark = "#8e6945";
const glassColor = "#9bb4c5";
const blackMetal = "#0d1110";

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function jitter(seed, amount) {
  return (Math.sin(seed * 12.9898) * 43758.5453 % 1) * amount;
}

function roofZAtY(yAbs) {
  const t = clamp(yAbs / Math.max(width / 2, 0.001), 0, 1);
  return ridgeHeight - roofRise * t;
}

function materialize(shape, color, material) {
  return shape.color(color).material(material || { roughness: 0.72 });
}

function makeRoofPanel(side) {
  const y = side * roofRun / 2;
  const angle = -side * roofAngle;
  return box(length + overhang * 2, roofSlope + overhang * 1.3, metalSkin)
    .placeReference("center", [0, 0, 0])
    .rotateX(angle)
    .translate(0, y, centerZ)
    .color(metal.shell)
    .material(metal.material);
}

function makeRoofSeams(side) {
  const pieces = [];
  const usable = length + overhang * 1.4;
  const count = Math.max(1, roofSeamCount);
  for (let i = 0; i < count; i++) {
    const x = -usable / 2 + (i + 0.5) * usable / count;
    pieces.push(
      box(roofSeamWidth, roofSlope + overhang * 1.6, roofSeamHeight)
        .placeReference("center", [x, 0, metalSkin / 2 + roofSeamHeight / 2])
        .rotateX(-side * roofAngle)
        .translate(0, side * roofRun / 2, centerZ)
    );
  }
  return union(pieces).color(metal.rib).material(metal.material);
}

function makeSideCladding(side) {
  const panels = [];
  const sideY = side * (halfWidth + wallSkin / 2);
  const panelW = length / wallPanelCount;
  const h = Math.max(1, eaveHeight - plinthHeight);
  panels.push(
    box(length, wallSkin, h)
      .placeReference("bottom", [0, sideY, plinthHeight])
  );
  for (let i = 1; i < wallPanelCount; i++) {
    const x = -halfLength + i * panelW;
    panels.push(
      box(panelGrooveDepth, wallSkin + 0.9, h + 1.2)
        .placeReference("bottom", [x, sideY + side * 0.08, plinthHeight - 0.1])
    );
  }
  return union(panels).color(metal.shell).material(metal.material);
}

function makeEndGable(xSide) {
  const x = xSide * (halfLength + wallSkin / 2);
  const jambH = eaveHeight - plinthHeight;
  const leftPost = box(wallSkin, 8, jambH)
    .placeReference("bottom", [x, -halfWidth + 4, plinthHeight]);
  const rightPost = box(wallSkin, 8, jambH)
    .placeReference("bottom", [x, halfWidth - 4, plinthHeight]);
  const sill = box(wallSkin, width, 7)
    .placeReference("bottom", [x, 0, plinthHeight]);
  const head = box(wallSkin, glassWidth + frameBar * 4, 7)
    .placeReference("bottom", [x, 0, glassBottom + glassHeight + 2]);

  const rakeDepth = 4.2;
  const leftRake = box(wallSkin, roofSlope + overhang * 0.6, rakeDepth)
    .placeReference("center", [0, 0, 0])
    .rotateX(roofAngle)
    .translate(x, -roofRun / 2, centerZ);
  const rightRake = box(wallSkin, roofSlope + overhang * 0.6, rakeDepth)
    .placeReference("center", [0, 0, 0])
    .rotateX(-roofAngle)
    .translate(x, roofRun / 2, centerZ);
  const ridgeCap = box(wallSkin, 9, rakeDepth)
    .placeReference("center", [x, 0, ridgeHeight + 0.4]);

  return union(leftPost, rightPost, sill, head, leftRake, rightRake, ridgeCap)
    .color(metal.shell)
    .material(metal.material);
}

function makeEndGlass(xSide) {
  const x = xSide * (halfLength + wallSkin + glassInset);
  const z = glassBottom + glassHeight / 2;
  const pane = box(0.75, glassWidth, glassHeight)
    .placeReference("center", [x, 0, z])
    .color(glassColor)
    .material({ roughness: 0.08, metalness: 0.0, opacity: 0.36, transmission: 0.35, clearcoat: 0.9 });

  const framePieces = [
    box(frameBar, glassWidth + frameBar * 2, frameBar).placeReference("center", [x + xSide * 0.22, 0, glassBottom]),
    box(frameBar, glassWidth + frameBar * 2, frameBar).placeReference("center", [x + xSide * 0.22, 0, glassBottom + glassHeight]),
    box(frameBar, frameBar, glassHeight + frameBar * 2).placeReference("center", [x + xSide * 0.22, -glassWidth / 2, z]),
    box(frameBar, frameBar, glassHeight + frameBar * 2).placeReference("center", [x + xSide * 0.22, glassWidth / 2, z]),
    box(frameBar, frameBar * 0.72, glassHeight).placeReference("center", [x + xSide * 0.3, 0, z]),
  ];

  return {
    pane,
    frame: union(framePieces).color(metal.frame).material({ metalness: 0.3, roughness: 0.55 }),
  };
}

function makeStoneBlock(x, y, z, w, d, h, seed) {
  const relief = stoneRelief * (0.35 + Math.abs(Math.sin(seed)) * 0.65);
  return box(w, d + relief, h)
    .placeReference("center", [x, y, z])
    .color(seed % 3 > 1 ? stoneDark : stoneColor)
    .material({ roughness: 0.94, metalness: 0.02 });
}

function makeStonePlinth() {
  const stones = [];
  const courseH = plinthHeight / stoneCourses;
  for (let c = 0; c < stoneCourses; c++) {
    const z = courseH * (c + 0.5);
    const longCount = stonesPerLongSide - (c % 2);
    const stoneLen = length / longCount;
    for (let i = 0; i < longCount; i++) {
      const x = -halfLength + stoneLen * (i + 0.5);
      const w = stoneLen * (0.75 + 0.18 * Math.sin(i * 2.1 + c));
      const h = courseH * (0.78 + 0.14 * Math.cos(i + c * 1.7));
      stones.push(makeStoneBlock(x, -halfWidth + stoneWallThickness / 2, z, w, stoneWallThickness, h, i + c * 31));
      stones.push(makeStoneBlock(x, halfWidth - stoneWallThickness / 2, z, w, stoneWallThickness, h, i + c * 37));
    }
    const endCount = Math.max(4, Math.round(width / 12));
    const endStone = width / endCount;
    for (let i = 0; i < endCount; i++) {
      const y = -halfWidth + endStone * (i + 0.5);
      const openGap = Math.abs(y) < glassWidth * 0.28 && c > 0;
      if (!openGap) {
        stones.push(makeStoneBlock(-halfLength + stoneWallThickness / 2, y, z, stoneWallThickness, endStone * 0.85, courseH * 0.82, i + c * 41));
        stones.push(makeStoneBlock(halfLength - stoneWallThickness / 2, y, z, stoneWallThickness, endStone * 0.85, courseH * 0.82, i + c * 43));
      }
    }
  }
  return group(...stones.map((shape, index) => ({ name: `stone-${index + 1}`, shape })));
}

function makeWoodInterior() {
  const parts = [];
  const deckWidth = width - stoneWallThickness * 2 - 4;
  const plankW = (deckWidth - plankGap * (plankCount - 1)) / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = -deckWidth / 2 + plankW / 2 + i * (plankW + plankGap);
    parts.push({
      name: `floor-plank-${i + 1}`,
      shape: box(length - 18, plankW, 2.4)
        .placeReference("bottom", [0, y, plinthHeight + 0.2])
        .color(i % 2 ? "#d7ba91" : woodColor)
        .material({ roughness: 0.76, metalness: 0.01 }),
    });
  }

  const rearWall = box(woodLiningThickness, deckWidth, eaveHeight - plinthHeight - 4)
    .placeReference("bottom", [-halfLength + 6, 0, plinthHeight + 2])
    .color(woodColor)
    .material({ roughness: 0.78 });
  const table = box(44, 16, 2.2).placeReference("bottom", [-22, 0, plinthHeight + 17]).color(woodDark).material({ roughness: 0.7 });
  const benchA = box(48, 6, 3).placeReference("bottom", [0, -18, plinthHeight + 10]).color(woodColor).material({ roughness: 0.75 });
  const benchB = box(48, 6, 3).placeReference("bottom", [0, 18, plinthHeight + 10]).color(woodColor).material({ roughness: 0.75 });
  const tableLegs = union(
    box(2.2, 2.2, 14).placeReference("bottom", [-38, -5, plinthHeight + 2]),
    box(2.2, 2.2, 14).placeReference("bottom", [-6, -5, plinthHeight + 2]),
    box(2.2, 2.2, 14).placeReference("bottom", [-38, 5, plinthHeight + 2]),
    box(2.2, 2.2, 14).placeReference("bottom", [-6, 5, plinthHeight + 2])
  ).color(woodDark).material({ roughness: 0.68 });

  parts.push({ name: "pale wood rear lining", shape: rearWall });
  parts.push({ name: "minimal built-in table", shape: table });
  parts.push({ name: "built-in bench left", shape: benchA });
  parts.push({ name: "built-in bench right", shape: benchB });
  parts.push({ name: "table trestle legs", shape: tableLegs });
  return parts;
}

function makeVentPatch() {
  const holes = [];
  const y = halfWidth + wallSkin + 0.45;
  const baseX = -halfLength + length * 0.22;
  const baseZ = eaveHeight + (ridgeHeight - eaveHeight) * 0.22;
  for (let r = 0; r < ventGridRows; r++) {
    for (let c = 0; c < ventGridCols; c++) {
      holes.push(
        cylinder(0.65, ventHoleRadius, undefined, 18)
          .pointAlong([0, 1, 0])
          .translate(
            baseX + (c - (ventGridCols - 1) / 2) * ventHolePitch,
            y,
            baseZ + (r - (ventGridRows - 1) / 2) * ventHolePitch
          )
      );
    }
  }
  return union(holes).color("#050706").material({ metalness: 0.15, roughness: 0.5 });
}

function makeRoofVents() {
  const vents = [];
  const count = roofVentCount;
  if (count <= 0) return null;
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 32;
    const y = width * 0.18;
    const z = roofZAtY(Math.abs(y)) + metalSkin + 0.3;
    const base = cylinder(3.0, roofVentRadius, undefined, 28).translate(x, y, z);
    const cone = cylinder(roofVentHeight, roofVentRadius * 0.72, roofVentRadius * 0.05, 28)
      .translate(x, y, z + 2.4);
    vents.push(base, cone);
  }
  return union(vents).color(metal.rib).material(metal.material);
}

function makeExteriorStair() {
  const platformZ = plinthHeight + 18;
  const platformX = halfLength + 12;
  const platformY = -halfWidth - stairWidth * 0.18;
  const pieces = [
    box(24, stairWidth, 2.0).placeReference("bottom", [platformX, platformY, platformZ]),
  ];
  for (let i = 0; i < stairStepCount; i++) {
    const t = i / Math.max(stairStepCount - 1, 1);
    const x = platformX + 6 + t * stairRun;
    const z = 4 + t * stairRise;
    pieces.push(box(10, stairWidth, 1.5).placeReference("center", [x, platformY, z]));
  }
  const stringerA = box(stairRun + 18, 1.6, 2.0)
    .placeReference("center", [0, 0, 0])
    .rotateY(-Math.atan2(stairRise, stairRun) * 180 / Math.PI)
    .translate(platformX + stairRun / 2 + 11, platformY - stairWidth / 2, stairRise / 2 + 4);
  const stringerB = stringerA.translate(0, stairWidth, 0);
  const railA = box(stairRun + 18, 1.2, 1.3)
    .placeReference("center", [0, 0, 0])
    .rotateY(-Math.atan2(stairRise, stairRun) * 180 / Math.PI)
    .translate(platformX + stairRun / 2 + 10, platformY - stairWidth / 2 - 1.8, stairRise / 2 + 19);
  const railB = railA.translate(0, stairWidth + 3.6, 0);
  pieces.push(stringerA, stringerB, railA, railB);
  return union(pieces).color(blackMetal).material({ metalness: 0.42, roughness: 0.58 });
}

const roofRight = makeRoofPanel(1);
const roofLeft = makeRoofPanel(-1);
const seamsRight = makeRoofSeams(1);
const seamsLeft = makeRoofSeams(-1);
const sideRight = makeSideCladding(1);
const sideLeft = makeSideCladding(-1);
const endFront = makeEndGable(1);
const endBack = makeEndGable(-1);
const frontGlass = makeEndGlass(1);
const backGlass = makeEndGlass(-1);
const stoneBase = makeStonePlinth();
const woodInterior = makeWoodInterior();
const ventPatch = makeVentPatch();
const roofVents = makeRoofVents();

const objects = [
  { name: "dry-stone plinth", group: stoneBase, color: stoneColor },
  ...woodInterior,
  { name: "right graphite standing-seam roof plane", shape: roofRight, color: metal.shell },
  { name: "left graphite standing-seam roof plane", shape: roofLeft, color: metal.shell },
  { name: "right raised roof seams", shape: seamsRight, color: metal.rib },
  { name: "left raised roof seams", shape: seamsLeft, color: metal.rib },
  { name: "right vertical metal cladding", shape: sideRight, color: metal.shell },
  { name: "left vertical metal cladding", shape: sideLeft, color: metal.shell },
  { name: "front gable metal return", shape: endFront, color: metal.shell },
  { name: "rear gable metal return", shape: endBack, color: metal.shell },
  { name: "front smoked glass opening", shape: frontGlass.pane, color: glassColor },
  { name: "front slim black window frame", shape: frontGlass.frame, color: metal.frame },
  { name: "rear smoked glass opening", shape: backGlass.pane, color: glassColor },
  { name: "rear slim black window frame", shape: backGlass.frame, color: metal.frame },
  { name: "perforated ventilation patch", shape: ventPatch, color: "#050706" },
];

if (roofVents) {
  objects.push({ name: "conical roof ventilators", shape: roofVents, color: metal.rib });
}

if (showStair) {
  objects.push({ name: "black steel exterior stair and platform", shape: makeExteriorStair(), color: blackMetal });
}

scene({
  background: { top: "#c7d0d8", bottom: "#59636d" },
  camera: { position: [220, -210, 138], target: [8, 0, 55], fov: 34 },
  environment: { preset: "studio", intensity: 0.18, background: false },
  lights: [
    { type: "ambient", color: "#efe6dc", intensity: 0.14 },
    { type: "directional", position: [260, -310, 360], target: [0, 0, 44], color: "#ffe0bd", intensity: 3.0, castShadow: true },
    { type: "directional", position: [-240, 210, 180], target: [0, 0, 48], color: "#d6e9ff", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c8d4df", groundColor: "#48515a", intensity: 0.16 },
  ],
  ground: { visible: true, color: "#2f3539", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.035, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.42, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
  views: {
    hero: { camera: { position: [220, -210, 138], target: [8, 0, 55], up: [0, 0, 1], fov: 34 } },
    front: { camera: { position: [280, 0, 58], target: [0, 0, 55], up: [0, 0, 1], fov: 30 } },
    side: { camera: { position: [0, -260, 70], target: [0, 0, 55], up: [0, 0, 1], fov: 30 } },
    top: { camera: { position: [0, 0, 340], target: [0, 0, 45], up: [1, 0, 0], fov: 32 } },
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#59636d" },
});

return objects;
