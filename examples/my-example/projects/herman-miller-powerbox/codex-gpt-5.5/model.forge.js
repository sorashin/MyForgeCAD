// Future Facility / Herman Miller inspired shared portable power bank.
// Compact molded body, through-handle, four output ports, and restrained matte finish.

const bodyLength = Param.number("Body Length", 100, { min: 76, max: 140, step: 1, unit: "mm" });
const bodyDepth = Param.number("Body Depth", 60, { min: 42, max: 82, step: 1, unit: "mm" });
const bodyHeight = Param.number("Body Height", 20, { min: 14, max: 32, step: 0.5, unit: "mm" });
const cornerRadius = Param.number("Body Corner Radius", 8.5, { min: 3, max: 15, step: 0.25, unit: "mm" });
const topInset = Param.number("Top Taper Inset", 3.6, { min: 0, max: 9, step: 0.25, unit: "mm" });
const topCornerRadius = Param.number("Top Corner Radius", 7.2, { min: 2, max: 14, step: 0.25, unit: "mm" });

const handleLength = Param.number("Handle Opening Length", 45, { min: 26, max: 72, step: 1, unit: "mm" });
const handleHeight = Param.number("Handle Opening Height", 10.2, { min: 5, max: 16, step: 0.25, unit: "mm" });
const handleCenterZRatio = Param.number("Handle Center Height Ratio", 0.60, { min: 0.45, max: 0.82, step: 0.01 });
const handleYOffset = Param.number("Handle Front Offset", -3.0, { min: -12, max: 8, step: 0.5, unit: "mm" });
const handleRimWidth = Param.number("Handle Molded Rim Width", 2.8, { min: 1.5, max: 8, step: 0.25, unit: "mm" });
const handleRimThickness = Param.number("Handle Rim Face Thickness", 0.9, { min: 0.25, max: 2.0, step: 0.05, unit: "mm" });

const topButtonRadius = Param.number("Top Power Button Radius", 2.6, { min: 1.2, max: 5.0, step: 0.1, unit: "mm" });
const topButtonX = Param.number("Top Button X", -34, { min: -48, max: 0, step: 1, unit: "mm" });
const topButtonY = Param.number("Top Button Y", 19, { min: 8, max: 28, step: 0.5, unit: "mm" });
const topIndicatorCount = Param.number("Top Indicator Count", 4, { min: 1, max: 5, step: 1, integer: true });
const topIndicatorRadius = Param.number("Top Indicator Radius", 0.8, { min: 0.35, max: 1.6, step: 0.05, unit: "mm" });
const topIndicatorPitch = Param.number("Top Indicator Pitch", 4.0, { min: 2.2, max: 6.5, step: 0.1, unit: "mm" });

const panelWidth = Param.number("End Panel Width", 44, { min: 25, max: 56, step: 1, unit: "mm" });
const panelHeight = Param.number("End Panel Height", 15.5, { min: 10, max: 24, step: 0.5, unit: "mm" });
const panelCornerRadius = Param.number("End Panel Corner Radius", 4.2, { min: 1.5, max: 8, step: 0.25, unit: "mm" });
const panelInsetDepth = Param.number("End Panel Proud Thickness", 0.55, { min: 0.15, max: 1.4, step: 0.05, unit: "mm" });

const usbCPortCount = Param.number("USB-C Port Count", 3, { min: 1, max: 4, step: 1, integer: true });
const usbCPortWidth = Param.number("USB-C Port Width", 6.3, { min: 4.0, max: 8.5, step: 0.1, unit: "mm" });
const usbCPortHeight = Param.number("USB-C Port Height", 2.1, { min: 1.2, max: 3.4, step: 0.05, unit: "mm" });
const usbPortPitch = Param.number("USB Port Pitch", 8.4, { min: 5.5, max: 12, step: 0.1, unit: "mm" });
const usbPortZ = Param.number("USB Port Height From Bottom", 5.5, { min: 2.8, max: 10, step: 0.25, unit: "mm" });
const usbAPortWidth = Param.number("USB-A Port Width", 8.6, { min: 6.0, max: 12, step: 0.1, unit: "mm" });
const usbAPortHeight = Param.number("USB-A Port Height", 4.1, { min: 2.6, max: 6.4, step: 0.1, unit: "mm" });
const portPlateThickness = Param.number("Port Insert Thickness", 0.65, { min: 0.2, max: 1.4, step: 0.05, unit: "mm" });

const sideSeamHeight = Param.number("Horizontal Case Seam Height", 8.2, { min: 3.5, max: 14, step: 0.25, unit: "mm" });
const sideSeamThickness = Param.number("Case Seam Thickness", 0.28, { min: 0.08, max: 0.8, step: 0.02, unit: "mm" });
const brandSize = Param.number("Brand Mark Size", 3.3, { min: 1.8, max: 6, step: 0.1, unit: "mm" });
const showBrand = Param.bool("Show Subtle Branding", true);

const finish = Param.choice("Finish", "warm light grey", [
  "warm light grey",
  "soft graphite",
  "reference black",
]);

const palette = {
  "warm light grey": {
    shell: "#d8d9d5",
    rim: "#c6c8c4",
    panel: "#3b3d3e",
    insert: "#090a0a",
    led: "#f4f1e8",
    mark: "#9a9c98",
    shellMaterial: { metalness: 0.02, roughness: 0.82, clearcoat: 0.06, clearcoatRoughness: 0.78 },
  },
  "soft graphite": {
    shell: "#454748",
    rim: "#2d2f30",
    panel: "#151617",
    insert: "#050505",
    led: "#e9eee9",
    mark: "#6d7070",
    shellMaterial: { metalness: 0.03, roughness: 0.78, clearcoat: 0.05, clearcoatRoughness: 0.8 },
  },
  "reference black": {
    shell: "#171819",
    rim: "#080909",
    panel: "#111213",
    insert: "#020202",
    led: "#f1f4ef",
    mark: "#2b2d2f",
    shellMaterial: { metalness: 0.02, roughness: 0.74, clearcoat: 0.08, clearcoatRoughness: 0.72 },
  },
};

const colors = palette[finish];
const topLength = Math.max(bodyLength - topInset * 2, handleLength + handleRimWidth * 2 + 12);
const topDepth = Math.max(bodyDepth - topInset * 1.35, handleHeight + handleRimWidth * 2 + 22);
const handleZ = bodyHeight * handleCenterZRatio;
const frontY = -bodyDepth / 2 - 0.05;
const rearY = bodyDepth / 2 + 0.05;
const endX = bodyLength / 2 + panelInsetDepth / 2 - 0.06;
const endDetailX = bodyLength / 2 + panelInsetDepth + portPlateThickness / 2 + 0.14;

function faceSlotOnFront(length, height, thickness, y, z, extraRadius) {
  const profile = extraRadius && extraRadius > 0
    ? slot(length, height).offset(extraRadius, "Round")
    : slot(length, height);
  return profile
    .extrude(thickness)
    .pointAlong([0, -1, 0])
    .placeReference("center", [0, y, z]);
}

function faceRoundedPatch(widthX, heightZ, thicknessY, y, z, radius, direction, x) {
  return roundedRect(widthX, heightZ, radius)
    .extrude(thicknessY)
    .pointAlong(direction)
    .placeReference("center", [x || 0, y, z]);
}

function yzRoundedPatch(widthY, heightZ, thicknessX, x, y, z, radius) {
  return roundedRect(heightZ, widthY, radius)
    .extrude(thicknessX)
    .pointAlong([1, 0, 0])
    .placeReference("center", [x, y, z]);
}

function yzPill(widthY, heightZ, thicknessX, x, y, z) {
  return roundedRect(heightZ, widthY, Math.min(heightZ, widthY) * 0.45)
    .extrude(thicknessX)
    .pointAlong([1, 0, 0])
    .placeReference("center", [x, y, z]);
}

const baseProfile = roundedRect(bodyLength, bodyDepth, cornerRadius);
const lowerHeight = Math.max(2.5, handleZ - handleHeight / 2 - 1.1);
const upperStartZ = Math.min(bodyHeight - 2.0, handleZ + handleHeight / 2 + 1.0);
const upperHeight = Math.max(2.0, bodyHeight - upperStartZ);
const postHeight = Math.max(2.0, upperStartZ - lowerHeight);
const postWidth = Math.max(8.5, (bodyLength - handleLength) / 2 - 4.0);
const sidePostX = handleLength / 2 + postWidth / 2;
const segmentCorner = Math.min(cornerRadius, postWidth / 2 - 0.6);
const bodySegmentMaterial = colors.shellMaterial;

const lowerBody = loft([
  baseProfile,
  roundedRect(bodyLength - topInset * 0.75, bodyDepth - topInset * 0.45, Math.min(cornerRadius, topCornerRadius)),
], [0, lowerHeight], { edgeLength: 1.1 })
  .color(colors.shell)
  .material(bodySegmentMaterial);

const upperBridge = loft([
  roundedRect(bodyLength - topInset * 0.9, bodyDepth - topInset * 0.55, Math.min(cornerRadius, topCornerRadius)),
  roundedRect(topLength, topDepth, Math.min(topCornerRadius, topDepth / 2 - 0.5)),
], [0, upperHeight], { edgeLength: 1.1 })
  .translate(0, 0, upperStartZ)
  .color(colors.shell)
  .material(bodySegmentMaterial);

const leftPost = roundedRect(postWidth, bodyDepth - topInset * 0.7, segmentCorner)
  .extrude(postHeight)
  .translate(-sidePostX, 0, lowerHeight)
  .color(colors.shell)
  .material(bodySegmentMaterial);

const rightPost = roundedRect(postWidth, bodyDepth - topInset * 0.7, segmentCorner)
  .extrude(postHeight)
  .translate(sidePostX, 0, lowerHeight)
  .color(colors.shell)
  .material(bodySegmentMaterial);

const frontRimBarRadius = Math.min(handleRimWidth * 0.48, 2.2);
const frontRimBars = [
  faceRoundedPatch(handleLength, handleRimWidth, handleRimThickness, frontY, handleZ + handleHeight / 2 + handleRimWidth / 2, frontRimBarRadius, [0, -1, 0]),
  faceRoundedPatch(handleLength, handleRimWidth, handleRimThickness, frontY, handleZ - handleHeight / 2 - handleRimWidth / 2, frontRimBarRadius, [0, -1, 0]),
  faceRoundedPatch(handleRimWidth, handleHeight + handleRimWidth * 2, handleRimThickness, frontY, handleZ, frontRimBarRadius, [0, -1, 0], -handleLength / 2 - handleRimWidth / 2),
  faceRoundedPatch(handleRimWidth, handleHeight + handleRimWidth * 2, handleRimThickness, frontY, handleZ, frontRimBarRadius, [0, -1, 0], handleLength / 2 + handleRimWidth / 2)
].map((shape) => shape
  .color(colors.rim)
  .material({ metalness: 0.02, roughness: 0.86, clearcoat: 0.04, clearcoatRoughness: 0.82 }));

const rearRimBars = [
  faceRoundedPatch(handleLength, handleRimWidth, handleRimThickness, rearY, handleZ + handleHeight / 2 + handleRimWidth / 2, frontRimBarRadius, [0, 1, 0]),
  faceRoundedPatch(handleLength, handleRimWidth, handleRimThickness, rearY, handleZ - handleHeight / 2 - handleRimWidth / 2, frontRimBarRadius, [0, 1, 0]),
  faceRoundedPatch(handleRimWidth, handleHeight + handleRimWidth * 2, handleRimThickness, rearY, handleZ, frontRimBarRadius, [0, 1, 0], -handleLength / 2 - handleRimWidth / 2),
  faceRoundedPatch(handleRimWidth, handleHeight + handleRimWidth * 2, handleRimThickness, rearY, handleZ, frontRimBarRadius, [0, 1, 0], handleLength / 2 + handleRimWidth / 2)
].map((shape) => shape
  .color(colors.rim)
  .material({ metalness: 0.02, roughness: 0.86, clearcoat: 0.04, clearcoatRoughness: 0.82 }));

const topButton = cylinder(0.22, topButtonRadius, undefined, 48)
  .translate(topButtonX, topButtonY, bodyHeight + 0.03)
  .color(colors.rim)
  .material({ metalness: 0.04, roughness: 0.76, clearcoat: 0.05, clearcoatRoughness: 0.7 });

const indicators = [];
const ledStartX = topButtonX + 12;
for (let i = 0; i < topIndicatorCount; i++) {
  const active = i < Math.max(1, topIndicatorCount - 1);
  indicators.push(
    cylinder(0.18, topIndicatorRadius, undefined, 24)
      .translate(ledStartX + i * topIndicatorPitch, topButtonY, bodyHeight + 0.06)
      .color(active ? colors.led : colors.panel)
      .material(active
        ? { metalness: 0.0, roughness: 0.38, emissive: colors.led, emissiveIntensity: 0.35 }
        : { metalness: 0.0, roughness: 0.7 })
  );
}

const seam = box(bodyLength - cornerRadius * 1.8, sideSeamThickness, sideSeamThickness)
  .placeReference("center", [0, frontY - 0.9, sideSeamHeight])
  .color(colors.rim)
  .material({ metalness: 0.01, roughness: 0.9 });

const endPanel = yzRoundedPatch(panelWidth, panelHeight, panelInsetDepth, endX, 0, panelHeight / 2 + 2.1, panelCornerRadius)
  .color(colors.panel)
  .material({ metalness: 0.02, roughness: 0.72, clearcoat: 0.05, clearcoatRoughness: 0.75 });

const panelButton = cylinder(portPlateThickness, 2.45, undefined, 48)
  .pointAlong([1, 0, 0])
  .placeReference("center", [endDetailX, 0, panelHeight + 0.8])
  .color(colors.insert)
  .material({ metalness: 0.02, roughness: 0.58 });

const panelLeds = [];
for (let i = 0; i < 4; i++) {
  panelLeds.push(
    cylinder(portPlateThickness + 0.03, 0.55, undefined, 18)
      .pointAlong([1, 0, 0])
      .placeReference("center", [endDetailX, 0, 13.4 - i * 1.8])
      .color(i < 3 ? colors.led : colors.insert)
      .material(i < 3
        ? { metalness: 0.0, roughness: 0.32, emissive: colors.led, emissiveIntensity: 0.4 }
        : { metalness: 0.0, roughness: 0.65 })
  );
}

const ports = [];
const usbGroupWidth = (usbCPortCount - 1) * usbPortPitch + usbCPortWidth + usbAPortWidth + usbPortPitch;
const firstUsbCY = -usbGroupWidth / 2 + usbCPortWidth / 2;
for (let i = 0; i < usbCPortCount; i++) {
  ports.push(
    yzPill(usbCPortWidth, usbCPortHeight, portPlateThickness, endDetailX, firstUsbCY + i * usbPortPitch, usbPortZ)
      .color(colors.insert)
      .material({ metalness: 0.0, roughness: 0.42 })
  );
}

const usbAY = firstUsbCY + usbCPortCount * usbPortPitch + (usbAPortWidth - usbCPortWidth) / 2;
const usbA = yzRoundedPatch(usbAPortWidth, usbAPortHeight, portPlateThickness, endDetailX, usbAY, usbPortZ, 0.65)
  .color(colors.insert)
  .material({ metalness: 0.0, roughness: 0.42 });
const usbATongue = box(portPlateThickness + 0.12, usbAPortWidth * 0.68, usbAPortHeight * 0.22)
  .placeReference("center", [endDetailX + portPlateThickness / 2 + 0.12, usbAY, usbPortZ])
  .color("#343638")
  .material({ metalness: 0.05, roughness: 0.48 });
ports.push(usbA, usbATongue);

const topPortStrip = [];
const stripY = bodyDepth / 2 - 8.5;
for (let i = 0; i < Math.min(4, usbCPortCount + 1); i++) {
  const w = i === 3 ? usbAPortWidth : usbCPortWidth;
  const h = i === 3 ? usbAPortHeight * 0.66 : usbCPortHeight;
  topPortStrip.push(
    roundedRect(w, h, Math.min(w, h) * 0.45)
      .extrude(0.16)
      .placeReference("center", [12 + i * 9.2, stripY, bodyHeight + 0.08])
      .color(colors.insert)
      .material({ metalness: 0.0, roughness: 0.48 })
  );
}

let brandMark;
if (showBrand) {
  brandMark = roundedRect(brandSize * 5.4, Math.max(0.35, brandSize * 0.17), Math.max(0.16, brandSize * 0.08))
    .extrude(0.04)
    .placeReference("center", [2, -bodyDepth * 0.11, bodyHeight + 0.1])
    .color(colors.mark)
    .material({ metalness: 0.0, roughness: 0.82 });
}

scene({
  background: { top: "#d5d9db", bottom: "#717a82" },
  camera: { position: [118, -154, 72], target: [4, -1, 10], fov: 35 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#f1ece4", intensity: 0.16 },
    { type: "directional", position: [210, -260, 240], target: [0, 0, 8], color: "#ffe2bd", intensity: 2.8, castShadow: true },
    { type: "directional", position: [-180, 150, 120], target: [0, 0, 8], color: "#d7e8fb", intensity: 0.8 },
    { type: "hemisphere", skyColor: "#cbd5dd", groundColor: "#4d565f", intensity: 0.16 },
  ],
  ground: { visible: true, color: "#2d3237", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.42, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
  views: {
    hero: { camera: { position: [118, -154, 72], target: [4, -1, 10], up: [0, 0, 1], fov: 35 } },
    front: { camera: { position: [0, -210, 42], target: [0, 0, 10], up: [0, 0, 1], fov: 28 } },
    endPanel: { camera: { position: [178, -14, 26], target: [49, 0, 9], up: [0, 0, 1], fov: 26 } },
    top: { camera: { position: [0, 0, 210], target: [0, 0, 8], up: [0, 1, 0], fov: 30 } },
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#717a82" },
});

const result = [
  { name: "Lower molded battery body", shape: lowerBody, color: colors.shell },
  { name: "Upper molded carry bridge", shape: upperBridge, color: colors.shell },
  { name: "Left molded handle cheek", shape: leftPost, color: colors.shell },
  { name: "Right molded handle cheek", shape: rightPost, color: colors.shell },
  { name: "Top power button", shape: topButton, color: colors.rim },
  { name: "Subtle horizontal case seam", shape: seam, color: colors.rim },
  { name: "Recessed end control panel", shape: endPanel, color: colors.panel },
  { name: "End panel power button", shape: panelButton, color: colors.insert },
];

for (let i = 0; i < frontRimBars.length; i++) {
  result.push({ name: `Front molded handle lip segment ${i + 1}`, shape: frontRimBars[i], color: colors.rim });
}
for (let i = 0; i < rearRimBars.length; i++) {
  result.push({ name: `Rear molded handle lip segment ${i + 1}`, shape: rearRimBars[i], color: colors.rim });
}
for (let i = 0; i < indicators.length; i++) {
  result.push({ name: `Top charge indicator ${i + 1}`, shape: indicators[i], color: i < topIndicatorCount - 1 ? colors.led : colors.panel });
}
for (let i = 0; i < panelLeds.length; i++) {
  result.push({ name: `End panel status LED ${i + 1}`, shape: panelLeds[i], color: i < 3 ? colors.led : colors.insert });
}
for (let i = 0; i < ports.length; i++) {
  result.push({ name: i < usbCPortCount ? `USB-C output ${i + 1}` : i === usbCPortCount ? "USB-A output shell" : "USB-A inner tongue", shape: ports[i], color: i === usbCPortCount + 1 ? "#343638" : colors.insert });
}
for (let i = 0; i < topPortStrip.length; i++) {
  result.push({ name: `Top edge output silhouette ${i + 1}`, shape: topPortStrip[i], color: colors.insert });
}
if (showBrand) {
  result.push({ name: "Subtle molded Herman Miller mark", shape: brandMark, color: colors.mark });
}

return result;
