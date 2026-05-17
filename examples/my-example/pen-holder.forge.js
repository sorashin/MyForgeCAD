// Parametric desk pen holder / small organizer.
// All dimensions are in millimeters.

const preset = Param.choice("Preset", "desktop", ["compact", "desktop", "wide"]);
const wellCount = Param.number("Pen Wells", 5, { min: 3, max: 7, integer: true });
const wellDiameter = Param.number("Pen Well Diameter", 14, { min: 10, max: 20, unit: "mm" });
const largeWellDiameter = Param.number("Large Well Diameter", 24, { min: 18, max: 32, unit: "mm" });
const wallThickness = Param.number("Wall Thickness", 4, { min: 3, max: 8, unit: "mm" });
const bottomThickness = Param.number("Bottom Thickness", 6, { min: 4, max: 12, unit: "mm" });
const cornerRadius = Param.number("Corner Radius", 8, { min: 2, max: 14, unit: "mm" });
const showRimInserts = Param.bool("Show Brass Rim Inserts", true);

const presets = {
  compact: { width: 118, depth: 66, height: 70, trayDepth: 16 },
  desktop: { width: 146, depth: 78, height: 82, trayDepth: 20 },
  wide: { width: 178, depth: 82, height: 86, trayDepth: 22 },
};

const dims = presets[preset];
const footHeight = 3;
const bodyZ = footHeight;
const bodyHeight = dims.height;
const topZ = bodyZ + bodyHeight;
const cutOverrun = 0.8;
const usableDepth = bodyHeight - bottomThickness;
const rimLip = 2.5;
const wellClearance = wallThickness + 7;

const bodyWidth = Math.max(
  dims.width,
  2 * (wallThickness + 8) + largeWellDiameter + wellCount * wellDiameter + wellCount * wellClearance
);
const bodyDepth = dims.depth;
const trayWidth = bodyWidth - 2 * (wallThickness + 8);
const trayDepth = Math.min(dims.trayDepth, bodyDepth * 0.36);
const trayPocketDepth = Math.min(18, bodyHeight - bottomThickness - 8);
const wellY = bodyDepth * 0.18;
const leftContentX = -bodyWidth / 2 + wallThickness + 8;
const largeWellX = leftContentX + largeWellDiameter / 2;
const firstWellX = largeWellX + largeWellDiameter / 2 + wellDiameter / 2 + wellClearance;
const lastWellX = bodyWidth / 2 - wallThickness - 8 - wellDiameter / 2;
const wellSpacing = wellCount > 1 ? (lastWellX - firstWellX) / (wellCount - 1) : 0;
const trayY = -bodyDepth * 0.27;

let holder = roundedRect(bodyWidth, bodyDepth, cornerRadius)
  .extrude(bodyHeight)
  .translate(0, 0, bodyZ);

const cutters = [];

cutters.push(
  cylinder(usableDepth + cutOverrun, largeWellDiameter / 2, largeWellDiameter / 2, 64)
    .translate(largeWellX, wellY, bodyZ + bottomThickness)
);

for (let i = 0; i < wellCount; i++) {
  cutters.push(
    cylinder(usableDepth + cutOverrun, wellDiameter / 2, wellDiameter / 2, 48)
      .translate(firstWellX + i * wellSpacing, wellY, bodyZ + bottomThickness)
  );
}

cutters.push(
  roundedRect(trayWidth, trayDepth, Math.min(5, trayDepth / 4))
    .extrude(trayPocketDepth + cutOverrun)
    .translate(0, trayY, topZ - trayPocketDepth)
);

const thumbScoop = cylinder(6, 7, 7, 32)
  .rotate([1, 0, 0], 90)
  .translate(0, -bodyDepth / 2 - 1, topZ - trayPocketDepth * 0.45);
cutters.push(thumbScoop);

holder = difference(holder, union(cutters));

const rimShapes = [];
const rimHeight = 1.4;

function makeRim(x, y, radius) {
  return difference(
    cylinder(rimHeight, radius + rimLip, radius + rimLip, 64),
    cylinder(rimHeight + 0.3, radius + 0.45, radius + 0.45, 64).translate(0, 0, -0.15)
  ).translate(x, y, topZ);
}

if (showRimInserts) {
  rimShapes.push(makeRim(largeWellX, wellY, largeWellDiameter / 2));
  for (let i = 0; i < wellCount; i++) {
    rimShapes.push(makeRim(firstWellX + i * wellSpacing, wellY, wellDiameter / 2));
  }
}

const footInsetX = bodyWidth / 2 - 18;
const footInsetY = bodyDepth / 2 - 14;
const footPositions = [
  [-footInsetX, -footInsetY],
  [footInsetX, -footInsetY],
  [-footInsetX, footInsetY],
  [footInsetX, footInsetY],
];
const feet = footPositions.map(([x, y]) =>
  cylinder(footHeight, 5.5, 5.5, 32).translate(x, y, 0)
);

console.log("body:", bodyWidth.toFixed(1), "x", bodyDepth.toFixed(1), "x", (bodyHeight + footHeight).toFixed(1), "mm");
console.log("floor thickness:", bottomThickness.toFixed(1), "mm");
console.log("pen well spacing:", wellSpacing.toFixed(1), "mm");

scene({
  background: { top: "#c9d2d8", bottom: "#5b6670" },
  camera: {
    position: [bodyWidth * 1.45, -bodyDepth * 2.4, bodyHeight * 1.25],
    target: [0, 0, bodyHeight * 0.5],
    fov: 34,
  },
  environment: { preset: "studio", intensity: 0.28, background: false },
  lights: [
    { type: "ambient", color: "#f4efe7", intensity: 0.12 },
    { type: "directional", position: [220, -260, 360], color: "#ffe5c4", intensity: 2.7, castShadow: true },
    { type: "directional", position: [-240, 160, 220], color: "#d7e8ff", intensity: 0.85 },
  ],
  ground: { visible: true, color: "#1c2024", height: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.03, threshold: 0.95, radius: 0.24 },
    vignette: { darkness: 0.34, offset: 0.32 },
    toneMappingExposure: 1.08,
  },
});

const output = [
  {
    name: "Graphite Organizer Body",
    shape: holder.material({ metalness: 0.04, roughness: 0.76 }),
    color: "#30343a",
  },
  {
    name: "Rubber Feet",
    shape: union(feet).material({ roughness: 0.88 }),
    color: "#111317",
  },
];

if (showRimInserts) {
  output.push({
    name: "Brass Well Rims",
    shape: union(rimShapes).material({ metalness: 0.55, roughness: 0.42 }),
    color: "#b7944f",
  });
}

return output;
