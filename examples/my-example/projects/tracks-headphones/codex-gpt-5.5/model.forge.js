// Parametric AIAIAI Tracks-style headphones.
// Minimal matte-black frame, circular cups, slotted bridge, aluminum accents,
// adjustable yokes, and detachable cable hardware.

// ---------- Parameters ----------
const cupDiameter = Param.number("Cup Diameter", 90, { min: 72, max: 112, step: 1, unit: "mm" });
const cupDepth = Param.number("Cup Depth", 17, { min: 10, max: 28, step: 0.5, unit: "mm" });
const rearCapDepth = Param.number("Rear Cap Depth", 2.2, { min: 0.8, max: 5, step: 0.1, unit: "mm" });
const cupEdgeRadius = Param.number("Cup Edge Radius", 2.8, { min: 0.5, max: 6, step: 0.1, unit: "mm" });

const padOuterDiameter = Param.number("Pad Outer Diameter", 78, { min: 58, max: 96, step: 1, unit: "mm" });
const padInnerDiameter = Param.number("Pad Inner Diameter", 46, { min: 28, max: 72, step: 1, unit: "mm" });
const padThickness = Param.number("Pad Thickness", 10, { min: 5, max: 18, step: 0.5, unit: "mm" });
const meshThickness = Param.number("Acoustic Mesh Thickness", 1.0, { min: 0.4, max: 2.5, step: 0.1, unit: "mm" });
const meshGrooveRadius = Param.number("Mesh Groove Tube Radius", 0.18, { min: 0.08, max: 0.5, step: 0.02, unit: "mm" });

const earSpan = Param.number("Ear Cup Center Span", 166, { min: 130, max: 210, step: 1, unit: "mm" });
const bandHeight = Param.number("Band Apex Height", 182, { min: 135, max: 235, step: 1, unit: "mm" });
const bandEndHeight = Param.number("Band End Height", 18, { min: -15, max: 42, step: 1, unit: "mm" });
const railWidth = Param.number("Headband Rail Width", 5.8, { min: 3, max: 10, step: 0.1, unit: "mm" });
const railThickness = Param.number("Headband Rail Thickness", 1.8, { min: 0.8, max: 4, step: 0.1, unit: "mm" });
const railGap = Param.number("Front-Rear Rail Gap", 20, { min: 10, max: 34, step: 1, unit: "mm" });

const bridgeLength = Param.number("Top Bridge Length", 72, { min: 42, max: 105, step: 1, unit: "mm" });
const bridgeWidth = Param.number("Top Bridge Width", 18, { min: 10, max: 28, step: 0.5, unit: "mm" });
const bridgeThickness = Param.number("Top Bridge Thickness", 1.6, { min: 0.8, max: 3.5, step: 0.1, unit: "mm" });
const bridgeSlotLength = Param.number("Bridge Slot Length", 24, { min: 10, max: 42, step: 1, unit: "mm" });
const bridgeSlotWidth = Param.number("Bridge Slot Width", 5.2, { min: 2, max: 9, step: 0.1, unit: "mm" });
const bridgeSlotOffset = Param.number("Bridge Slot Offset", 19, { min: 9, max: 34, step: 0.5, unit: "mm" });

const yokeLength = Param.number("Yoke Length", 62, { min: 34, max: 88, step: 1, unit: "mm" });
const yokeWidth = Param.number("Yoke Width", 10, { min: 5, max: 17, step: 0.5, unit: "mm" });
const yokeThickness = Param.number("Yoke Thickness", 2.2, { min: 1, max: 5, step: 0.1, unit: "mm" });
const yokeSlotLength = Param.number("Yoke Slider Slot Length", 34, { min: 16, max: 58, step: 1, unit: "mm" });
const yokeSlotWidth = Param.number("Yoke Slider Slot Width", 3.6, { min: 1.6, max: 7, step: 0.1, unit: "mm" });
const pivotDiameter = Param.number("Pivot Disc Diameter", 18, { min: 10, max: 28, step: 0.5, unit: "mm" });
const pivotThickness = Param.number("Pivot Disc Thickness", 4, { min: 1.8, max: 8, step: 0.2, unit: "mm" });
const adjusterRidgeCount = Param.number("Adjuster Ridge Count", 6, { min: 3, max: 10, step: 1, integer: true });

const cableDiameter = Param.number("Cable Diameter", 2.4, { min: 1.2, max: 4, step: 0.1, unit: "mm" });
const cableLength = Param.number("Cable Drop Length", 250, { min: 80, max: 420, step: 5, unit: "mm" });
const plugLength = Param.number("Plug Strain Relief Length", 17, { min: 8, max: 28, step: 0.5, unit: "mm" });
const showCable = Param.bool("Show Detachable Cable", true);

const accentFinish = Param.choice("Accent Finish", "brushed aluminum", ["brushed aluminum", "blackout"]);

// ---------- Derived ----------
const cupRadius = cupDiameter / 2;
const padOuterRadius = padOuterDiameter / 2;
const padInnerRadius = padInnerDiameter / 2;
const earX = earSpan / 2;
const archRise = Math.max(20, bandHeight - bandEndHeight);
const cupCenterZ = 0;
const yokeCenterZ = bandEndHeight - yokeLength / 2;
const yokeFrontY = -railGap * 0.52;
const yokeRearY = railGap * 0.52;

// ---------- Materials ----------
const matteBlack = { metalness: 0.05, roughness: 0.78 };
const satinBlack = { metalness: 0.12, roughness: 0.62 };
const softFoam = { metalness: 0.0, roughness: 0.96 };
const darkMesh = { metalness: 0.02, roughness: 0.88 };
const rubber = { metalness: 0.0, roughness: 0.82 };
const aluminum = { metalness: 0.9, roughness: 0.26 };

const black = "#111111";
const nearBlack = "#070707";
const foamBlack = "#181818";
const meshBlack = "#0b0b0b";
const cableBlack = "#090909";
const useBlackoutAccents = accentFinish === "blackout" || accentFinish === 1;
const accentColor = useBlackoutAccents ? "#151515" : "#b8bdc4";
const accentMaterial = useBlackoutAccents ? satinBlack : aluminum;

function paint(shape, color, material) {
  return shape.color(color).material(material);
}

function centeredCylinder(height, radius, segments) {
  return cylinder(height, radius, undefined, segments).placeReference("center", [0, 0, 0]);
}

function orientCupLocal(shape, side) {
  return shape.rotateY(side * 90).translate(side * earX, 0, cupCenterZ);
}

// ---------- Headband ----------
function headbandPath(yOff) {
  const points = [];
  const count = 44;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = Math.PI - t * Math.PI;
    const x = earX * Math.cos(angle);
    const z = bandEndHeight + archRise * Math.sin(angle);
    points.push([x, yOff, z]);
  }
  return spline3d(points, { tension: 0.48 });
}

function headbandRail(yOff) {
  const profile = roundedRect(railThickness, railWidth, Math.min(railThickness / 2, railWidth / 2 - 0.2));
  return sweep(profile, headbandPath(yOff), { samples: 58, up: [0, 1, 0] });
}

function topBridgePlate() {
  const outer = roundedRect(bridgeLength, bridgeWidth, Math.max(1, bridgeWidth / 2 - 0.8));
  const leftSlot = slot(bridgeSlotLength, bridgeSlotWidth).translate(-bridgeSlotOffset, 0);
  const rightSlot = slot(bridgeSlotLength, bridgeSlotWidth).translate(bridgeSlotOffset, 0);
  const plate = difference2d(outer, leftSlot, rightSlot).extrude(bridgeThickness);
  return plate.translate(0, 0, bandHeight + railThickness * 0.2);
}

function topSlotShadow() {
  const leftSlot = slot(bridgeSlotLength, bridgeSlotWidth).translate(-bridgeSlotOffset, 0);
  const rightSlot = slot(bridgeSlotLength, bridgeSlotWidth).translate(bridgeSlotOffset, 0);
  return union2d(leftSlot, rightSlot).extrude(0.35).translate(0, 0, bandHeight + bridgeThickness + 0.05);
}

// ---------- Ear cups ----------
function cupShell(side) {
  const shell = centeredCylinder(cupDepth, cupRadius, 72);
  return orientCupLocal(shell, side);
}

function cupRearCap(side) {
  const cap = centeredCylinder(rearCapDepth, cupRadius * 0.77, 72)
    .translate(0, 0, cupDepth / 2 + rearCapDepth / 2 - 0.2);
  return orientCupLocal(cap, side);
}

function cupOuterRing(side) {
  const ring = torus(cupRadius - cupEdgeRadius * 0.28, Math.max(0.35, cupEdgeRadius * 0.16), 96)
    .translate(0, 0, cupDepth / 2 + rearCapDepth * 0.35);
  return orientCupLocal(ring, side);
}

function padRing(side) {
  const padZ = -cupDepth / 2 - padThickness / 2 + 0.4;
  const outer = centeredCylinder(padThickness, padOuterRadius, 72).translate(0, 0, padZ);
  const inner = centeredCylinder(padThickness + 2.5, Math.max(3, padInnerRadius), 72).translate(0, 0, padZ);
  const ring = difference(outer, inner);
  return orientCupLocal(ring, side);
}

function acousticMesh(side) {
  const meshZ = -cupDepth / 2 - padThickness + meshThickness / 2 + 0.25;
  const disk = centeredCylinder(meshThickness, Math.max(3, padInnerRadius * 0.92), 64).translate(0, 0, meshZ);
  return orientCupLocal(disk, side);
}

function acousticMeshRings(side) {
  const meshZ = -cupDepth / 2 - padThickness + meshThickness + 0.48;
  const rings = [];
  for (let i = 1; i <= 3; i++) {
    const r = (padInnerRadius * 0.24) + i * (padInnerRadius * 0.17);
    rings.push(torus(r, meshGrooveRadius, 56).translate(0, 0, meshZ));
  }
  return orientCupLocal(union(rings), side);
}

// ---------- Yoke, pivots, adjuster hardware ----------
function yokePlate(side, yOff) {
  const plateProfile = roundedRect(yokeWidth, yokeLength, Math.min(yokeWidth / 2 - 0.2, 4));
  const slotCut = slot(yokeSlotLength, yokeSlotWidth).rotate(90);
  const prof = difference2d(plateProfile, slotCut);
  const plate = prof.extrude(yokeThickness).rotateX(-90);
  return plate.translate(side * earX, yOff, yokeCenterZ);
}

function pivotDisc(side) {
  const x = side * (earX + cupDepth / 2 + pivotThickness * 0.35);
  const disc = centeredCylinder(pivotThickness, pivotDiameter / 2, 56).pointAlong([1, 0, 0]);
  return disc.translate(x, yokeFrontY, cupCenterZ);
}

function pivotAccentRing(side) {
  const x = side * (earX + cupDepth / 2 + pivotThickness * 0.55 + 0.2);
  const ring = torus(pivotDiameter * 0.31, 0.45, 64).rotateY(90);
  return ring.translate(x, yokeFrontY, cupCenterZ);
}

function adjusterKnob(side) {
  const knobZ = yokeCenterZ + yokeLength * 0.14;
  const x = side * (earX + cupDepth / 2 + pivotThickness * 0.2);
  const knob = centeredCylinder(pivotThickness * 0.82, pivotDiameter * 0.38, 44).pointAlong([1, 0, 0]);
  return knob.translate(x, yokeFrontY - yokeThickness * 0.9, knobZ);
}

function adjusterRidges(side) {
  const parts = [];
  const knobZ = yokeCenterZ + yokeLength * 0.14;
  const x = side * (earX + cupDepth / 2 + pivotThickness * 0.68);
  const ridgeW = pivotDiameter * 0.085;
  const ridgeH = pivotDiameter * 0.08;
  const spacing = pivotDiameter * 0.12;
  for (let i = 0; i < adjusterRidgeCount; i++) {
    const y = yokeFrontY - yokeThickness * 1.35 + (i - (adjusterRidgeCount - 1) / 2) * spacing;
    const ridge = roundedRect(ridgeW, ridgeH, ridgeW / 2)
      .extrude(0.55)
      .rotateX(-90)
      .translate(x, y, knobZ + pivotDiameter * 0.03);
    parts.push(ridge);
  }
  return union(parts);
}

function railDrop(side, yOff) {
  const x = side * earX;
  const top = [x, yOff, bandEndHeight];
  const bottom = [x, yOff, cupRadius * 0.18];
  const spine = spline3d([top, [x + side * 2, yOff, bandEndHeight - 16], bottom], { tension: 0.2 });
  return sweep(circle2d(railThickness * 0.52, 12), spine, { samples: 20, up: [0, 1, 0] });
}

// ---------- Cable ----------
function cableStrainRelief(side) {
  const x = side * (earX - cupDepth * 0.08);
  const plug = cylinder(plugLength, cableDiameter * 1.55, cableDiameter * 0.92, 24)
    .translate(0, 0, -plugLength);
  return plug.translate(x, 0, -cupRadius + 3);
}

function detachableCable(side) {
  const x = side * (earX - cupDepth * 0.08);
  const startZ = -cupRadius + 3 - plugLength;
  const points = [
    [x, 0, startZ],
    [x - side * 4, -2, startZ - 36],
    [x + side * 10, -8, startZ - 92],
    [x + side * 18, -4, startZ - 160],
    [x + side * 8, 9, startZ - cableLength],
  ];
  return sweep(circle2d(cableDiameter / 2, 12), spline3d(points, { tension: 0.55 }), { samples: 44 });
}

// ---------- Scene ----------
scene({
  background: { top: "#15181d", bottom: "#2f343b" },
  camera: { position: [335, -430, 210], target: [0, 0, 48], fov: 36 },
  environment: { preset: "studio", intensity: 0.3, background: false },
  lights: [
    { type: "ambient", color: "#f0ede8", intensity: 0.12 },
    { type: "directional", position: [260, -340, 420], color: "#ffe3c6", intensity: 3.0, castShadow: true },
    { type: "directional", position: [-220, 210, 170], color: "#c8ddff", intensity: 0.9 },
    { type: "point", position: [-90, -120, 90], color: "#ffffff", intensity: 0.55, distance: 420, decay: 1 },
    { type: "hemisphere", skyColor: "#bac6d4", groundColor: "#111318", intensity: 0.16 },
  ],
  ground: { visible: true, color: "#202329", offset: 6, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.9, radius: 0.25 },
    vignette: { darkness: 0.48, offset: 0.34 },
    grain: { intensity: 0.025 },
    toneMappingExposure: 1.05,
  },
});

// ---------- Build ----------
const parts = [
  { name: "Front spring-steel headband rail", shape: paint(headbandRail(-railGap / 2), black, matteBlack), color: black },
  { name: "Rear spring-steel headband rail", shape: paint(headbandRail(railGap / 2), black, matteBlack), color: black },
  { name: "Slotted top bridge", shape: paint(topBridgePlate(), accentColor, accentMaterial), color: accentColor },
  { name: "Bridge slot shadow inserts", shape: paint(topSlotShadow(), nearBlack, matteBlack), color: nearBlack },

  { name: "Left cup shell", shape: paint(cupShell(-1), black, satinBlack), color: black },
  { name: "Right cup shell", shape: paint(cupShell(1), black, satinBlack), color: black },
  { name: "Left rear cap", shape: paint(cupRearCap(-1), nearBlack, matteBlack), color: nearBlack },
  { name: "Right rear cap", shape: paint(cupRearCap(1), nearBlack, matteBlack), color: nearBlack },
  { name: "Left cup rim highlight", shape: paint(cupOuterRing(-1), "#1f1f1f", satinBlack), color: "#1f1f1f" },
  { name: "Right cup rim highlight", shape: paint(cupOuterRing(1), "#1f1f1f", satinBlack), color: "#1f1f1f" },

  { name: "Left foam pad ring", shape: paint(padRing(-1), foamBlack, softFoam), color: foamBlack },
  { name: "Right foam pad ring", shape: paint(padRing(1), foamBlack, softFoam), color: foamBlack },
  { name: "Left acoustic mesh", shape: paint(acousticMesh(-1), meshBlack, darkMesh), color: meshBlack },
  { name: "Right acoustic mesh", shape: paint(acousticMesh(1), meshBlack, darkMesh), color: meshBlack },
  { name: "Left mesh concentric texture", shape: paint(acousticMeshRings(-1), "#242424", darkMesh), color: "#242424" },
  { name: "Right mesh concentric texture", shape: paint(acousticMeshRings(1), "#242424", darkMesh), color: "#242424" },

  { name: "Left front slotted yoke", shape: paint(yokePlate(-1, yokeFrontY), black, matteBlack), color: black },
  { name: "Right front slotted yoke", shape: paint(yokePlate(1, yokeFrontY), black, matteBlack), color: black },
  { name: "Left rear yoke stabilizer", shape: paint(yokePlate(-1, yokeRearY), nearBlack, matteBlack), color: nearBlack },
  { name: "Right rear yoke stabilizer", shape: paint(yokePlate(1, yokeRearY), nearBlack, matteBlack), color: nearBlack },
  { name: "Left front rail drop", shape: paint(railDrop(-1, -railGap / 2), black, matteBlack), color: black },
  { name: "Right front rail drop", shape: paint(railDrop(1, -railGap / 2), black, matteBlack), color: black },
  { name: "Left rear rail drop", shape: paint(railDrop(-1, railGap / 2), black, matteBlack), color: black },
  { name: "Right rear rail drop", shape: paint(railDrop(1, railGap / 2), black, matteBlack), color: black },

  { name: "Left pivot disc", shape: paint(pivotDisc(-1), nearBlack, satinBlack), color: nearBlack },
  { name: "Right pivot disc", shape: paint(pivotDisc(1), nearBlack, satinBlack), color: nearBlack },
  { name: "Left aluminum pivot accent", shape: paint(pivotAccentRing(-1), accentColor, accentMaterial), color: accentColor },
  { name: "Right aluminum pivot accent", shape: paint(pivotAccentRing(1), accentColor, accentMaterial), color: accentColor },
  { name: "Left adjustment knob", shape: paint(adjusterKnob(-1), nearBlack, satinBlack), color: nearBlack },
  { name: "Right adjustment knob", shape: paint(adjusterKnob(1), nearBlack, satinBlack), color: nearBlack },
  { name: "Left knob grip ridges", shape: paint(adjusterRidges(-1), "#303030", rubber), color: "#303030" },
  { name: "Right knob grip ridges", shape: paint(adjusterRidges(1), "#303030", rubber), color: "#303030" },
];

if (showCable) {
  parts.push(
    { name: "Left detachable cable strain relief", shape: paint(cableStrainRelief(-1), cableBlack, rubber), color: cableBlack },
    { name: "Detachable cable", shape: paint(detachableCable(-1), cableBlack, rubber), color: cableBlack },
  );
}

return parts;
