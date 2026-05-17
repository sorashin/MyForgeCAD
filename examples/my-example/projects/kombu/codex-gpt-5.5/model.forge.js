const bodyDiameter = Param.number("Body Diameter", 180, { min: 140, max: 230, step: 1, unit: "mm" });
const bodyHeight = Param.number("Body Height", 300, { min: 230, max: 380, step: 1, unit: "mm" });
const wallVisualDepth = Param.number("Front Recess Depth", 9, { min: 4, max: 18, step: 0.5, unit: "mm" });
const baseHeight = Param.number("Ribbed Base Height", 24, { min: 14, max: 42, step: 1, unit: "mm" });
const baseOverhang = Param.number("Base Overhang", 3.5, { min: 0, max: 9, step: 0.5, unit: "mm" });
const lidHeight = Param.number("Lid Height", 18, { min: 8, max: 32, step: 1, unit: "mm" });
const lidInset = Param.number("Lid Diameter Inset", 13, { min: 4, max: 26, step: 0.5, unit: "mm" });

const panelWidth = Param.number("Front Band Width", 42, { min: 28, max: 68, step: 1, unit: "mm" });
const panelHeight = Param.number("Front Band Height", 218, { min: 160, max: 285, step: 1, unit: "mm" });
const panelCornerRadius = Param.number("Front Band Corner Radius", 5, { min: 1, max: 14, step: 0.5, unit: "mm" });
const panelThickness = Param.number("Front Band Thickness", 2.4, { min: 1, max: 5, step: 0.2, unit: "mm" });
const displayHeight = Param.number("Display Height", 44, { min: 24, max: 70, step: 1, unit: "mm" });
const windowHeight = Param.number("Viewing Window Height", 112, { min: 70, max: 165, step: 1, unit: "mm" });
const windowWidth = Param.number("Viewing Window Width", 31, { min: 18, max: 48, step: 1, unit: "mm" });
const liquidFill = Param.number("Liquid Fill Level", 0.73, { min: 0.25, max: 0.95, step: 0.01 });

const spoutRadius = Param.number("Spout Radius", 7.5, { min: 4, max: 13, step: 0.5, unit: "mm" });
const spoutLength = Param.number("Spout Projection", 34, { min: 20, max: 56, step: 1, unit: "mm" });
const spoutZOffset = Param.number("Spout Height From Base", 58, { min: 34, max: 92, step: 1, unit: "mm" });

const topSlotWidth = Param.number("Top Opening Width", 108, { min: 68, max: 145, step: 1, unit: "mm" });
const topSlotDepth = Param.number("Top Opening Depth", 27, { min: 16, max: 45, step: 1, unit: "mm" });
const indicatorCount = Param.number("Top Indicator Dots", 3, { min: 0, max: 5, integer: true });
const ribCount = Param.number("Base Rib Count", 64, { min: 32, max: 96, integer: true });
const showBrandMark = Param.bool("Show KOMBU Mark", true);
const materialTone = Param.choice("Material Tone", "warm gallery", ["warm gallery", "cool ceramic", "deeper graphite"]);

const bodyRadius = bodyDiameter / 2;
const baseRadius = bodyRadius + baseOverhang;
const bodyBottomZ = baseHeight;
const bodyTopZ = bodyBottomZ + bodyHeight;
const lidRadius = Math.max(12, bodyRadius - lidInset);
const frontY = -bodyRadius;
const frontBandCenterZ = bodyBottomZ + bodyHeight * 0.51;
const spoutZ = bodyBottomZ + spoutZOffset;

const colors = materialTone === "cool ceramic"
  ? {
      body: "#eeeee8",
      lid: "#f4f3ed",
      panel: "#77766f",
      dark: "#171715",
      glass: "#2b302f",
      liquid: "#9a5629",
      base: "#2e302d",
      metal: "#686966",
    }
  : materialTone === "deeper graphite"
    ? {
        body: "#d9d5cc",
        lid: "#ebe6dd",
        panel: "#55534d",
        dark: "#131312",
        glass: "#222625",
        liquid: "#824b27",
        base: "#20221f",
        metal: "#565650",
      }
    : {
        body: "#ede8dc",
        lid: "#f5f0e4",
        panel: "#69665f",
        dark: "#171614",
        glass: "#252927",
        liquid: "#965426",
        base: "#282a26",
        metal: "#66655e",
      };

function verticalRoundedRect(width, height, radius, depth, yFront, zCenter) {
  return roundedRect(width, height, radius)
    .extrude(depth)
    .rotateX(90)
    .translate(0, yFront, zCenter);
}

function horizontalCylinder(length, radius, yOrigin, zCenter, segments) {
  return cylinder(length, radius, radius, segments)
    .pointAlong([0, -1, 0])
    .translate(0, yOrigin, zCenter);
}

function makeRibbedBase() {
  const core = cylinder(baseHeight, baseRadius - 2.2, baseRadius - 2.2, 128);
  const ribDepth = Param.number("Base Rib Depth", 3.2, { min: 1, max: 6, step: 0.2, unit: "mm" });
  const ribWidth = Math.max(1.0, (2 * Math.PI * baseRadius) / ribCount * 0.36);
  const ribs = [];

  for (let i = 0; i < ribCount; i++) {
    const a = (i * 360) / ribCount;
    const p = Points.polar(baseRadius - ribDepth / 2, a);
    ribs.push(
      box(ribWidth, ribDepth, baseHeight)
        .rotateZ(a - 90)
        .translate(p[0], p[1], 0)
    );
  }

  return union(core, ...ribs);
}

const bodyPocket = verticalRoundedRect(
  panelWidth + 6,
  panelHeight + 7,
  panelCornerRadius + 3,
  wallVisualDepth + 8,
  frontY + wallVisualDepth,
  frontBandCenterZ
);

const lowerWindowRelief = verticalRoundedRect(
  windowWidth + 7,
  windowHeight + 10,
  4.5,
  wallVisualDepth + 12,
  frontY + wallVisualDepth + 2,
  frontBandCenterZ - panelHeight * 0.11
);

let mainBody = cylinder(bodyHeight, bodyRadius, bodyRadius * 0.985, 160)
  .translate(0, 0, bodyBottomZ);
mainBody = difference(mainBody, bodyPocket, lowerWindowRelief);

const frontBandBlank = verticalRoundedRect(
  panelWidth,
  panelHeight,
  panelCornerRadius,
  panelThickness,
  frontY + 0.45,
  frontBandCenterZ
);
const displayAperture = verticalRoundedRect(
  panelWidth - 3,
  displayHeight + 3,
  2,
  panelThickness + 4,
  frontY + 1,
  frontBandCenterZ + panelHeight / 2 - displayHeight / 2 - 4
);
const windowAperture = verticalRoundedRect(
  windowWidth + 4,
  windowHeight + 5,
  4,
  panelThickness + 4,
  frontY + 1,
  frontBandCenterZ - panelHeight * 0.12
);
const frontBand = difference(frontBandBlank, displayAperture, windowAperture);

const display = verticalRoundedRect(
  panelWidth - 5,
  displayHeight,
  1.2,
  0.75,
  frontY - panelThickness - 0.2,
  frontBandCenterZ + panelHeight / 2 - displayHeight / 2 - 4
);

const windowGlass = verticalRoundedRect(
  windowWidth,
  windowHeight,
  3.2,
  0.85,
  frontY - panelThickness - 0.3,
  frontBandCenterZ - panelHeight * 0.12
);

const liquidHeight = Math.max(8, windowHeight * liquidFill);
const liquid = verticalRoundedRect(
  windowWidth - 3.6,
  liquidHeight,
  2.2,
  1.5,
  frontY + 2.3,
  frontBandCenterZ - panelHeight * 0.12 - windowHeight / 2 + liquidHeight / 2 + 2
);

const meniscus = box(windowWidth - 5, 0.8, 1.2)
  .placeReference("center", [0, frontY - 0.6, frontBandCenterZ - panelHeight * 0.12 - windowHeight / 2 + liquidHeight + 2.5]);

const lidBlank = cylinder(lidHeight, lidRadius, lidRadius * 0.985, 160)
  .translate(0, 0, bodyTopZ + 0.2);
const lidSlotCut = roundedRect(topSlotWidth + 4, topSlotDepth + 4, (topSlotDepth + 4) / 2)
  .extrude(lidHeight * 0.6)
  .translate(0, -bodyRadius * 0.16, bodyTopZ + lidHeight * 0.42);
const lid = difference(lidBlank, lidSlotCut);
const topOpening = roundedRect(topSlotWidth, topSlotDepth, topSlotDepth / 2)
  .extrude(1.1)
  .translate(0, -bodyRadius * 0.16, bodyTopZ + lidHeight * 0.43);

const topIndicators = [];
for (let i = 0; i < indicatorCount; i++) {
  const x = (i - (indicatorCount - 1) / 2) * 9;
  topIndicators.push(
    cylinder(0.65, 1.15, 1.15, 24)
      .translate(x, bodyRadius * 0.26, bodyTopZ + lidHeight + 0.35)
  );
}

const base = makeRibbedBase();
const topSeam = difference(
  cylinder(2.4, bodyRadius + 0.9, bodyRadius + 0.9, 160),
  cylinder(3.0, bodyRadius + 0.08, bodyRadius + 0.08, 160).translate(0, 0, -0.3)
).translate(0, 0, bodyTopZ - 1.5);
const lowerShadowSeam = difference(
  cylinder(2.0, bodyRadius + 0.7, bodyRadius + 0.7, 160),
  cylinder(2.6, bodyRadius + 0.05, bodyRadius + 0.05, 160).translate(0, 0, -0.3)
).translate(0, 0, bodyBottomZ + 1.5);

const spoutBoss = horizontalCylinder(7.5, spoutRadius + 4.5, frontY - panelThickness - 0.2, spoutZ, 64);
const spoutTube = horizontalCylinder(spoutLength, spoutRadius, frontY - 6, spoutZ, 64);
const spoutNozzle = horizontalCylinder(8, spoutRadius * 0.78, frontY - spoutLength - 7, spoutZ - 1.6, 48);
const spoutHandle = cylinder(18, spoutRadius * 0.64, spoutRadius * 0.64, 48)
  .translate(0, frontY - spoutLength * 0.73, spoutZ + spoutRadius * 0.5);
const spout = union(spoutBoss, spoutTube, spoutNozzle, spoutHandle);

const dripShadow = roundedRect(24, 8, 4)
  .extrude(0.7)
  .rotateX(90)
  .translate(0, frontY - panelThickness - 0.9, spoutZ - spoutRadius - 9);

const brand = showBrandMark
  ? text2d("KOMBU", { size: 7.4, letterSpacing: 2.2, align: "center", baseline: "center" })
      .extrude(0.45)
      .rotateX(90)
      .translate(0, frontY - panelThickness - 0.55, frontBandCenterZ + panelHeight / 2 - displayHeight - 17)
  : null;

scene({
  background: { top: "#e5e3de", bottom: "#b7b4ac" },
  camera: { position: [220, -285, 245], target: [0, 0, bodyBottomZ + bodyHeight * 0.54], fov: 34 },
  environment: { preset: "studio", intensity: 0.36, background: false },
  lights: [
    { type: "ambient", color: "#f3eadc", intensity: 0.17 },
    { type: "directional", position: [230, -260, 360], target: [0, 0, bodyBottomZ + bodyHeight * 0.52], color: "#fff0d6", intensity: 2.4, castShadow: true },
    { type: "directional", position: [-240, -80, 180], target: [0, 0, bodyBottomZ + bodyHeight * 0.45], color: "#c9d8e7", intensity: 0.75 },
    { type: "hemisphere", skyColor: "#ece9df", groundColor: "#635f58", intensity: 0.18 },
  ],
  ground: { visible: true, color: "#d4d0c8", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.018, threshold: 0.92, radius: 0.18 },
    vignette: { darkness: 0.24, offset: 0.31 },
    toneMappingExposure: 1.03,
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#b7b4ac" },
});

const parts = [
  { name: "Matte Off-White Cylindrical Body", shape: mainBody.material({ metalness: 0.02, roughness: 0.88 }), color: colors.body },
  { name: "Warm Gray Front Band", shape: frontBand.material({ metalness: 0.03, roughness: 0.82 }), color: colors.panel },
  { name: "Muted Display Window", shape: display.material({ metalness: 0.0, roughness: 0.55 }), color: colors.dark },
  { name: "Smoked Vertical Sight Glass", shape: windowGlass.material({ metalness: 0, roughness: 0.13, opacity: 0.38, transmission: 0.25 }), color: colors.glass },
  { name: "Visible Kombucha Volume", shape: liquid.material({ metalness: 0, roughness: 0.22, opacity: 0.64, transmission: 0.18 }), color: colors.liquid },
  { name: "Liquid Meniscus Line", shape: meniscus.material({ metalness: 0, roughness: 0.32, opacity: 0.62 }), color: "#d5b18a" },
  { name: "Round Top Lid", shape: lid.material({ metalness: 0.02, roughness: 0.86 }), color: colors.lid },
  { name: "Dark Top Fermentation Opening", shape: topOpening.material({ metalness: 0.01, roughness: 0.7 }), color: colors.dark },
  { name: "Ribbed Graphite Base", shape: base.material({ metalness: 0.05, roughness: 0.78 }), color: colors.base },
  { name: "Top Body Seam", shape: topSeam.material({ metalness: 0.02, roughness: 0.78 }), color: colors.body },
  { name: "Lower Body Seam", shape: lowerShadowSeam.material({ metalness: 0.03, roughness: 0.82 }), color: colors.panel },
  { name: "Compact Pour Spout", shape: spout.material({ metalness: 0.18, roughness: 0.55 }), color: colors.metal },
  { name: "Small Drip Shelf", shape: dripShadow.material({ metalness: 0.03, roughness: 0.76 }), color: colors.panel },
];

if (indicatorCount > 0) {
  parts.push({
    name: "Three Minimal Lid Indicators",
    shape: union(...topIndicators).material({ metalness: 0.02, roughness: 0.52 }),
    color: colors.dark,
  });
}

if (brand) {
  parts.push({
    name: "Subtle KOMBU Product Mark",
    shape: brand.material({ metalness: 0.02, roughness: 0.7 }),
    color: colors.dark,
  });
}

return parts.map((part) => ({
  name: part.name,
  shape: part.shape.color(part.color),
  color: part.color,
}));
