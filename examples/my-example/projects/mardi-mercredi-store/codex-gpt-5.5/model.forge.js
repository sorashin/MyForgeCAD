// Mardi Mercredi store-inspired apparel display bench.
// Minimal architectural fixture with a thin matte slab and folded steel blade frames.

// ---------- Parameters ----------
const overallLength = Param.number("Overall Length", 1800, { min: 1200, max: 2400, step: 10, unit: "mm" });
const overallDepth = Param.number("Overall Depth", 600, { min: 420, max: 820, step: 10, unit: "mm" });
const overallHeight = Param.number("Overall Height", 400, { min: 300, max: 520, step: 5, unit: "mm" });

const topThickness = Param.number("Thin Top Plate Thickness", 28, { min: 14, max: 48, step: 1, unit: "mm" });
const topCornerRadius = Param.number("Top Corner Radius", 5, { min: 0, max: 24, step: 0.5, unit: "mm" });
const shadowGap = Param.number("Underside Shadow Gap", 10, { min: 0, max: 28, step: 1, unit: "mm" });

const supportFrameCount = Param.number("Support Frame Count", 3, { min: 2, max: 5, step: 1, integer: true });
const supportFrameInset = Param.number("Support Frame End Inset", 190, { min: 70, max: 420, step: 5, unit: "mm" });
const framePlateThickness = Param.number("Blade Frame Thickness", 50, { min: 20, max: 80, step: 1, unit: "mm" });
const legBladeWidth = Param.number("Leg Blade Width", 104, { min: 36, max: 130, step: 1, unit: "mm" });
const legInsetFromEdge = Param.number("Leg Inset From Front Edge", 72, { min: 20, max: 150, step: 1, unit: "mm" });
const crossRailHeight = Param.number("Folded Frame Top Rail Height", 58, { min: 28, max: 100, step: 1, unit: "mm" });
const steelCornerRadius = Param.number("Steel Plate Corner Radius", 2.5, { min: 0, max: 10, step: 0.25, unit: "mm" });

const sideRailHeight = Param.number("Longitudinal Rail Height", 50, { min: 18, max: 90, step: 1, unit: "mm" });
const sideRailDepth = Param.number("Longitudinal Rail Depth", 36, { min: 16, max: 64, step: 1, unit: "mm" });
const sideRailInset = Param.number("Longitudinal Rail Edge Inset", 64, { min: 20, max: 140, step: 1, unit: "mm" });
const centerSpineWidth = Param.number("Center Spine Rail Width", 26, { min: 12, max: 60, step: 1, unit: "mm" });
const showCenterSpine = Param.bool("Show Center Spine Rail", true);

const seamCount = Param.number("Top Panel Reveal Count", 2, { min: 0, max: 5, step: 1, integer: true });
const seamWidth = Param.number("Top Reveal Width", 3, { min: 1, max: 8, step: 0.25, unit: "mm" });
const seamMargin = Param.number("Top Reveal End Margin", 46, { min: 10, max: 120, step: 1, unit: "mm" });

const showLevelingFeet = Param.bool("Show Leveling Feet", true);
const footDiameter = Param.number("Leveling Foot Diameter", 42, { min: 22, max: 70, step: 1, unit: "mm" });
const footHeight = Param.number("Leveling Foot Height", 10, { min: 4, max: 24, step: 1, unit: "mm" });

const finish = Param.choice("Finish", "matte warm off-white", [
  "matte warm off-white",
  "soft concrete grey",
  "matte graphite",
]);

// ---------- Derived dimensions ----------
const frameCount = Math.max(2, Math.round(supportFrameCount));
const topBaseZ = overallHeight - topThickness;
const frameTopZ = Math.max(footHeight + crossRailHeight + 12, topBaseZ - shadowGap);
const legHeight = frameTopZ - footHeight;
const legY = Math.max(0, overallDepth / 2 - legInsetFromEdge - legBladeWidth / 2);
const frameDepth = Math.max(legBladeWidth * 2 + 40, overallDepth - 2 * legInsetFromEdge);
const railLength = Math.max(100, overallLength - 2 * supportFrameInset + framePlateThickness);
const railY = Math.max(0, overallDepth / 2 - sideRailInset - sideRailDepth / 2);

const palette = {
  "matte warm off-white": {
    slab: "#e8e4dc",
    steel: "#ddd8ce",
    shadow: "#1d1d1b",
    foot: "#202020",
    material: { metalness: 0.04, roughness: 0.82, clearcoat: 0.08, clearcoatRoughness: 0.72 },
  },
  "soft concrete grey": {
    slab: "#cfcfc8",
    steel: "#bfc0ba",
    shadow: "#222321",
    foot: "#2a2b28",
    material: { metalness: 0.03, roughness: 0.88, clearcoat: 0.04, clearcoatRoughness: 0.8 },
  },
  "matte graphite": {
    slab: "#2c2d2c",
    steel: "#252625",
    shadow: "#080808",
    foot: "#090909",
    material: { metalness: 0.1, roughness: 0.74, clearcoat: 0.08, clearcoatRoughness: 0.65 },
  },
};
const colors = palette[finish];
const powderCoat = colors.material;
const blackenedSteel = { metalness: 0.28, roughness: 0.64, clearcoat: 0.06, clearcoatRoughness: 0.72 };

function painted(shape, color, material) {
  return shape.color(color).material(material);
}

function roundedPlate(width, depth, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2 - 0.1, depth / 2 - 0.1));
  if (r <= 0.05) return box(width, depth, height);
  return roundedRect(width, depth, r).extrude(height);
}

function frameXs() {
  const usable = Math.max(framePlateThickness, overallLength - 2 * supportFrameInset);
  const xs = [];
  if (frameCount === 1) return [0];
  for (let i = 0; i < frameCount; i++) {
    xs.push(-usable / 2 + (usable * i) / (frameCount - 1));
  }
  return xs;
}

function makeSupportFrame(x) {
  const parts = [];
  const post = roundedPlate(framePlateThickness, legBladeWidth, legHeight, steelCornerRadius);
  parts.push(post.translate(x, legY, footHeight));
  parts.push(post.translate(x, -legY, footHeight));

  const railBaseZ = frameTopZ - crossRailHeight;
  const crossRail = roundedPlate(framePlateThickness, frameDepth, crossRailHeight, steelCornerRadius)
    .translate(x, 0, railBaseZ);
  parts.push(crossRail);
  return union(parts);
}

function makeSteelBase() {
  const pieces = [];
  for (const x of frameXs()) {
    pieces.push(makeSupportFrame(x));
  }

  const railBaseZ = frameTopZ - sideRailHeight;
  const longRail = roundedPlate(railLength, sideRailDepth, sideRailHeight, steelCornerRadius);
  pieces.push(longRail.translate(0, railY, railBaseZ));
  pieces.push(longRail.translate(0, -railY, railBaseZ));

  if (showCenterSpine) {
    const spine = roundedPlate(railLength, centerSpineWidth, Math.max(18, sideRailHeight * 0.72), steelCornerRadius);
    pieces.push(spine.translate(0, 0, railBaseZ + sideRailHeight * 0.14));
  }

  return painted(union(pieces), colors.steel, powderCoat);
}

function makeRevealStrips() {
  const revealH = Math.max(1.2, Math.min(4, shadowGap * 0.45 + 1));
  const revealT = Math.max(3, Math.min(10, sideRailDepth * 0.35));
  const z = topBaseZ - revealH;
  const longStrip = box(overallLength - 14, revealT, revealH);
  const endStrip = box(revealT, overallDepth - 14, revealH);
  const y = overallDepth / 2 - revealT / 2 - 3;
  const x = overallLength / 2 - revealT / 2 - 3;
  return painted(
    union(
      longStrip.translate(0, y, z),
      longStrip.translate(0, -y, z),
      endStrip.translate(x, 0, z),
      endStrip.translate(-x, 0, z),
    ),
    colors.shadow,
    blackenedSteel,
  );
}

function makeTopReveals() {
  const count = Math.max(0, Math.round(seamCount));
  if (count === 0) return null;
  const lines = [];
  const usable = Math.max(1, overallLength - 2 * seamMargin);
  for (let i = 1; i <= count; i++) {
    const x = -usable / 2 + (usable * i) / (count + 1);
    lines.push(box(seamWidth, overallDepth - 2 * seamMargin, 0.7).translate(x, 0, overallHeight + 0.08));
  }
  return painted(union(lines), colors.shadow, { metalness: 0.05, roughness: 0.92 });
}

function makeLevelingFeet() {
  if (!showLevelingFeet) return null;
  const feet = [];
  for (const x of frameXs()) {
    feet.push(cylinder(footHeight, footDiameter / 2, footDiameter / 2, 40).translate(x, legY, 0));
    feet.push(cylinder(footHeight, footDiameter / 2, footDiameter / 2, 40).translate(x, -legY, 0));
  }
  return painted(union(feet), colors.foot, blackenedSteel);
}

// ---------- Geometry ----------
const topPlate = painted(
  roundedPlate(overallLength, overallDepth, topThickness, topCornerRadius).translate(0, 0, topBaseZ),
  colors.slab,
  powderCoat,
);

const steelBase = makeSteelBase();
const revealStrips = makeRevealStrips();
const topReveals = makeTopReveals();
const levelingFeet = makeLevelingFeet();

// Basic dimensional checks surfaced in ForgeCAD's check panel.
verify.greaterThan("Top plate remains above steel frame", topBaseZ - frameTopZ, -0.01);
verify.greaterThan("Bench has usable display length", overallLength, 1000);
verify.greaterThan("Support legs clear front/back edges", legY, 20);
verify.notEmpty("Top plate exists", topPlate);
verify.notEmpty("Powder-coated steel base exists", steelBase);

// ---------- Scene ----------
scene({
  background: { top: "#d7d9d8", bottom: "#717570" },
  camera: { position: [1450, -1150, 620], target: [0, 0, overallHeight * 0.48], fov: 34 },
  environment: { preset: "warehouse", intensity: 0.28, background: false },
  lights: [
    { type: "ambient", color: "#f1ede3", intensity: 0.18 },
    { type: "directional", position: [900, -1100, 900], target: [0, 0, 150], color: "#fff0d3", intensity: 2.8, castShadow: true },
    { type: "directional", position: [-900, 600, 520], target: [0, 0, 140], color: "#d6e2ed", intensity: 0.9 },
    { type: "hemisphere", skyColor: "#d8dee1", groundColor: "#454943", intensity: 0.18 },
  ],
  ground: { visible: true, color: "#5f625c", offset: 0, receiveShadow: true },
  fog: { color: "#b7bbb8", near: 4200, far: 9500 },
  postProcessing: {
    bloom: { intensity: 0.03, threshold: 0.95, radius: 0.22 },
    vignette: { darkness: 0.36, offset: 0.28 },
    toneMappingExposure: 1.08,
  },
  views: {
    hero: {
      camera: { position: [1450, -1150, 620], target: [0, 0, overallHeight * 0.48], up: [0, 0, 1], fov: 34 },
    },
    lowFront: {
      camera: { position: [1100, -1550, 290], target: [0, 0, 190], up: [0, 0, 1], fov: 32 },
    },
    sideElevation: {
      camera: { position: [0, -2300, 220], target: [0, 0, 190], up: [0, 0, 1], fov: 28 },
    },
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#717570" },
});

const output = [
  { name: "Thin Matte Top Plate", shape: topPlate, color: colors.slab },
  { name: "Powder Coated Folded Steel Base", shape: steelBase, color: colors.steel },
  { name: "Black Underside Shadow Reveal", shape: revealStrips, color: colors.shadow },
];

if (topReveals) {
  output.push({ name: "Incised Top Panel Reveals", shape: topReveals, color: colors.shadow });
}

if (levelingFeet) {
  output.push({ name: "Black Adjustable Leveling Feet", shape: levelingFeet, color: colors.foot });
}

return output;
