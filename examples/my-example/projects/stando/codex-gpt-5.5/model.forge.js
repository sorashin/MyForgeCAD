// Stando-style Japanese kitchen tweezer tongs.
// One-piece matte metal body with tapered chopstick-like arms and stand-off feet.

const totalLength = Param.number("Overall Length", 180, { min: 145, max: 220, step: 1, unit: "mm" });
const rootWidth = Param.number("Rear Arm Width", 9.4, { min: 6.0, max: 13.5, step: 0.1, unit: "mm" });
const rootThickness = Param.number("Rear Thickness", 2.05, { min: 1.2, max: 3.2, step: 0.05, unit: "mm" });
const tipWidth = Param.number("Tip Width", 2.0, { min: 0.9, max: 3.8, step: 0.1, unit: "mm" });
const tipThickness = Param.number("Tip Thickness", 1.05, { min: 0.55, max: 2.0, step: 0.05, unit: "mm" });
const rearInsideGap = Param.number("Rear Inside Gap", 4.8, { min: 1.5, max: 10, step: 0.1, unit: "mm" });
const openingAngle = Param.number("Arm Opening Angle", 2.6, { min: 0, max: 7, step: 0.1, unit: "deg" });
const taperExponent = Param.number("Taper Exponent", 1.28, { min: 0.75, max: 2.2, step: 0.02 });

const footPosition = Param.number("Stand Foot Position", 0.47, { min: 0.30, max: 0.68, step: 0.01 });
const footLength = Param.number("Stand Foot Length", 13.5, { min: 7, max: 24, step: 0.5, unit: "mm" });
const footWidth = Param.number("Stand Foot Width", 6.7, { min: 3.5, max: 11, step: 0.1, unit: "mm" });
const footDrop = Param.number("Stand Foot Drop", 2.35, { min: 0.9, max: 4.8, step: 0.05, unit: "mm" });
const footEmbed = Param.number("Foot Blend Embed", 0.30, { min: 0.05, max: 0.8, step: 0.05, unit: "mm" });

const serrationCount = Param.number("Tip Serration Count", 10, { min: 0, max: 18, step: 1, integer: true });
const serrationPitch = Param.number("Tip Serration Pitch", 1.65, { min: 0.9, max: 3.0, step: 0.05, unit: "mm" });
const serrationWidth = Param.number("Serration Cut Width", 0.42, { min: 0.18, max: 0.9, step: 0.02, unit: "mm" });
const serrationDepth = Param.number("Serration Cut Depth", 0.22, { min: 0.05, max: 0.5, step: 0.01, unit: "mm" });

const showBrandMark = Param.bool("Show Brand Mark", true);
const brandSize = Param.number("Brand Mark Size", 4.3, { min: 2.5, max: 7.0, step: 0.1, unit: "mm" });
const finish = Param.choice("Finish", "Matte Stainless", [
  "Matte Stainless",
  "Warm Prototype Brass",
  "White Study Model",
]);

const finishes = {
  "Matte Stainless": {
    color: "#b6bac0",
    mark: "#5d6268",
    metalness: 0.86,
    roughness: 0.53,
  },
  "Warm Prototype Brass": {
    color: "#c7aa73",
    mark: "#5d4b2e",
    metalness: 0.78,
    roughness: 0.48,
  },
  "White Study Model": {
    color: "#edf1ef",
    mark: "#6b7174",
    metalness: 0.04,
    roughness: 0.72,
  },
};

const material = finishes[finish];
const armLength = totalLength - (rearInsideGap / 2 + rootWidth);
const rootCenterOffset = rearInsideGap / 2 + rootWidth / 2;
const uOuterR = rearInsideGap / 2 + rootWidth;
const uInnerR = Math.max(0.25, rearInsideGap / 2);

function widthAt(t) {
  const eased = Math.pow(Math.max(0, Math.min(1, t)), taperExponent);
  return rootWidth + (tipWidth - rootWidth) * eased;
}

function thicknessAt(t) {
  const eased = Math.pow(Math.max(0, Math.min(1, t)), taperExponent * 1.05);
  return rootThickness + (tipThickness - rootThickness) * eased;
}

function makeArmCore() {
  const stations = 30;
  const profiles = [];
  const heights = [];

  for (let i = 0; i < stations; i++) {
    const t = i / (stations - 1);
    const w = widthAt(t);
    const th = thicknessAt(t);
    const r = Math.min(w, th) * 0.46;
    profiles.push(roundedRect(th, w, r));
    heights.push(t * armLength);
  }

  let arm = loft(profiles, heights, { edgeLength: 0.9 })
    .rotate([0, 1, 0], 90);

  const cutters = [];
  const tipTop = tipThickness / 2;
  const serrationStart = armLength - 4.0;
  for (let i = 0; i < serrationCount; i++) {
    const x = serrationStart - i * serrationPitch;
    if (x < armLength - 26) break;
    cutters.push(
      box(serrationWidth, tipWidth * 2.8, serrationDepth * 3)
        .placeReference("center", [x, 0, tipTop - serrationDepth * 0.15])
    );
  }
  if (cutters.length > 0) {
    arm = difference(arm, union(cutters));
  }

  const footX = footPosition * armLength;
  const localMidThickness = thicknessAt(footPosition);
  const foot = ellipse(footLength / 2, footWidth / 2, 32)
    .extrude(footDrop)
    .placeReference("top", [footX, 0, -localMidThickness / 2 + footEmbed]);

  return union(arm, foot);
}

function makeRearBridge() {
  const ring = difference2d(circle2d(uOuterR, 64), circle2d(uInnerR, 64))
    .extrude(rootThickness)
    .placeReference("center", [0, 0, 0]);

  const frontCutter = box(uOuterR * 3.2, uOuterR * 3.2, rootThickness * 4)
    .placeReference("center", [uOuterR * 1.58, 0, 0]);

  return difference(ring, frontCutter);
}

function makeUpperBrandMark() {
  const markX = armLength * 0.42;
  const markZ = thicknessAt(0.42) / 2 + 0.025;
  return text2d("GESTURA", {
    size: brandSize,
    align: "center",
    baseline: "center",
    letterSpacing: 0.18,
  })
    .extrude(0.035)
    .placeReference("center", [markX, 0, markZ])
    .rotateZ(openingAngle, { pivot: [0, 0, 0] })
    .translate(0, rootCenterOffset, 0);
}

const localArm = makeArmCore();
const upperArm = localArm
  .rotateZ(openingAngle, { pivot: [0, 0, 0] })
  .translate(0, rootCenterOffset, 0);
const lowerArm = localArm
  .rotateZ(-openingAngle, { pivot: [0, 0, 0] })
  .translate(0, -rootCenterOffset, 0);

let body = union(upperArm, lowerArm, makeRearBridge())
  .translate(-armLength / 2 + uOuterR * 0.5, 0, footDrop / 2);

const brand = makeUpperBrandMark()
  .translate(-armLength / 2 + uOuterR * 0.5, 0, footDrop / 2);

const bodyShape = body.color(material.color).material({
  metalness: material.metalness,
  roughness: material.roughness,
  clearcoat: 0.08,
  clearcoatRoughness: 0.72,
});

scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera: { position: [150, -260, 120], target: [12, 0, 8], fov: 36 },
  environment: { preset: "studio", intensity: 0.18, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    { type: "directional", position: [260, -320, 420], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-260, 210, 220], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.14 },
  ],
  ground: { visible: true, color: "#22272e", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.035, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
  views: {
    hero: { camera: { position: [150, -260, 120], target: [12, 0, 8], up: [0, 0, 1], fov: 36 } },
    side: { camera: { position: [0, -330, 28], target: [8, 0, 6], up: [0, 0, 1], fov: 30 } },
    top: { camera: { position: [0, 0, 340], target: [0, 0, 0], up: [1, 0, 0], fov: 30 } },
  },
});

const result = [
  { name: "One-piece matte tapered tong body", shape: bodyShape, color: material.color },
];

if (showBrandMark) {
  result.push({
    name: "Subtle laser-etched brand mark",
    shape: brand.color(material.mark).material({ metalness: 0.35, roughness: 0.68 }),
    color: material.mark,
  });
}

return result;
