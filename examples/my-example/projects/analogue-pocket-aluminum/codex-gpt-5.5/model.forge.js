// Analogue Pocket aluminum limited edition: CNC-milled handheld console.
// Physical layout is modeled in millimeters: portrait slab, square display,
// front controls, side buttons, cartridge/port cuts, and subtle production marks.

const bodyW = Param.number("Body Width", 75, { min: 64, max: 88, step: 0.5, unit: "mm" });
const bodyH = Param.number("Body Height", 150, { min: 128, max: 176, step: 0.5, unit: "mm" });
const bodyT = Param.number("Body Thickness", 20, { min: 14, max: 26, step: 0.5, unit: "mm" });
const cornerR = Param.number("Body Corner Radius", 5.2, { min: 2, max: 8, step: 0.1, unit: "mm" });
const rearStep = Param.number("Rear Shell Step", 3.2, { min: 1.2, max: 5.5, step: 0.1, unit: "mm" });

const screenSize = Param.number("Screen Size", 63, { min: 50, max: 70, step: 0.5, unit: "mm" });
const screenTopGap = Param.number("Screen Top Gap", 7.2, { min: 4, max: 14, step: 0.2, unit: "mm" });
const screenBezelR = Param.number("Screen Corner Radius", 1.5, { min: 0.2, max: 3, step: 0.1, unit: "mm" });
const screenRecess = Param.number("Screen Recess Depth", 0.75, { min: 0.2, max: 1.5, step: 0.05, unit: "mm" });
const glassProud = Param.number("Glass Proud Height", 0.08, { min: 0, max: 0.4, step: 0.02, unit: "mm" });

const dpadXInset = Param.number("D-pad X Inset", 20, { min: 14, max: 28, step: 0.5, unit: "mm" });
const dpadYFromBottom = Param.number("D-pad Y From Bottom", 39, { min: 28, max: 52, step: 0.5, unit: "mm" });
const dpadSpan = Param.number("D-pad Span", 24, { min: 17, max: 31, step: 0.5, unit: "mm" });
const dpadArm = Param.number("D-pad Arm Width", 8.4, { min: 5.8, max: 12, step: 0.1, unit: "mm" });
const dpadHeight = Param.number("D-pad Height", 2.5, { min: 1.2, max: 4.2, step: 0.1, unit: "mm" });
const dpadBaseGap = Param.number("D-pad Bezel Gap", 1.2, { min: 0.4, max: 2.2, step: 0.1, unit: "mm" });

const buttonClusterXInset = Param.number("Button Cluster X Inset", 17, { min: 11, max: 25, step: 0.5, unit: "mm" });
const buttonYFromBottom = Param.number("Button Cluster Y From Bottom", 54, { min: 42, max: 66, step: 0.5, unit: "mm" });
const buttonDia = Param.number("Face Button Diameter", 8.5, { min: 6, max: 12, step: 0.1, unit: "mm" });
const buttonPitch = Param.number("Face Button Pitch", 15.3, { min: 11, max: 21, step: 0.2, unit: "mm" });
const buttonHeight = Param.number("Face Button Height", 1.85, { min: 0.9, max: 3.4, step: 0.05, unit: "mm" });

const menuButtonDia = Param.number("Menu Button Diameter", 3.6, { min: 2.4, max: 5.4, step: 0.1, unit: "mm" });
const menuButtonPitch = Param.number("Menu Button Pitch", 8.2, { min: 6, max: 11, step: 0.1, unit: "mm" });
const menuYFromBottom = Param.number("Menu Buttons Y From Bottom", 24, { min: 16, max: 34, step: 0.5, unit: "mm" });
const menuXOffset = Param.number("Menu Row X Offset", 23.5, { min: 14, max: 31, step: 0.5, unit: "mm" });

const speakerHoleCount = Param.number("Side Speaker Holes", 8, { min: 5, max: 11, integer: true });
const speakerHoleDia = Param.number("Speaker Hole Diameter", 1.25, { min: 0.8, max: 1.8, step: 0.05, unit: "mm" });
const sideButtonLength = Param.number("Side Button Length", 13.5, { min: 8, max: 19, step: 0.5, unit: "mm" });
const shoulderLength = Param.number("Shoulder Button Length", 28, { min: 18, max: 38, step: 0.5, unit: "mm" });
const shoulderHeight = Param.number("Shoulder Button Height", 2.8, { min: 1.5, max: 5, step: 0.1, unit: "mm" });

const cartSlotW = Param.number("Cartridge Slot Width", 55, { min: 42, max: 66, step: 0.5, unit: "mm" });
const cartSlotDepth = Param.number("Cartridge Slot Depth", 4.2, { min: 2.5, max: 7, step: 0.1, unit: "mm" });
const usbW = Param.number("USB-C Width", 9.2, { min: 7, max: 12, step: 0.1, unit: "mm" });
const usbH = Param.number("USB-C Height", 3.2, { min: 2.1, max: 4.2, step: 0.1, unit: "mm" });
const jackDia = Param.number("Headphone Jack Diameter", 3.5, { min: 2.5, max: 5, step: 0.1, unit: "mm" });

const showMarkings = Param.bool("Show Product Markings", true);
const finish = Param.choice("Aluminum Finish", "graphite", ["graphite", "natural silver", "matte black"]);

const finishPalette = {
  "graphite": {
    body: "#6e7477",
    bevel: "#545a5d",
    button: "#4c5154",
    side: "#3f4548",
    mark: "#2d3133",
  },
  "natural silver": {
    body: "#d5d4ce",
    bevel: "#b1b0aa",
    button: "#c6c5bf",
    side: "#8e8f8b",
    mark: "#777872",
  },
  "matte black": {
    body: "#17191b",
    bevel: "#0f1113",
    button: "#121416",
    side: "#0b0c0e",
    mark: "#2c2f32",
  },
};

const colors = finishPalette[finish];
const blackGlass = "#020304";
const screenLogo = "#e7e9e8";
const portDark = "#050607";

const aluminumMat = { metalness: 0.72, roughness: 0.82, clearcoat: 0.14, clearcoatRoughness: 0.72 };
const darkAluminumMat = { metalness: 0.62, roughness: 0.86, clearcoat: 0.08, clearcoatRoughness: 0.8 };
const glassMat = { metalness: 0.02, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.025 };
const rubberMat = { metalness: 0.12, roughness: 0.78 };

function topPlate(profile, height, z) {
  return profile.extrude(height).translate(0, 0, z);
}

function roundedSlab(w, h, r, t, z) {
  return topPlate(roundedRect(w, h, Math.max(0.01, r)), t, z);
}

function facePill(w, h, r, depth, x, y, z) {
  return roundedRect(w, h, r).extrude(depth).translate(x, y, z);
}

function sidePill(length, height, depth, x, y, z, side) {
  const direction = side === "left" ? [1, 0, 0] : [-1, 0, 0];
  const xCenter = side === "left" ? x + depth / 2 : x - depth / 2;
  const coreLen = Math.max(0.1, length - height);
  const core = box(depth, coreLen, height).translate(xCenter, y, z - height / 2);
  const capA = cylinder(depth, height / 2, height / 2, 32)
    .pointAlong(direction)
    .translate(x, y - coreLen / 2, z);
  const capB = cylinder(depth, height / 2, height / 2, 32)
    .pointAlong(direction)
    .translate(x, y + coreLen / 2, z);
  return union(core, capA, capB);
}

function frontCircularButton(x, y, dia, h, zBase) {
  return cylinder(h, dia / 2, Math.max(0.1, dia / 2 - 0.18), 48).translate(x, y, zBase);
}

function makeDpadCross(span, arm, radius, height) {
  const vertical = roundedRect(arm, span, radius).extrude(height);
  const horizontal = roundedRect(span, arm, radius).extrude(height);
  return union(vertical, horizontal);
}

function makeDpadBezel(span, arm, gap, height) {
  const outer = makeDpadCross(span + gap * 2, arm + gap * 2, Math.min(2.2, arm / 2), height);
  const inner = makeDpadCross(span + gap * 0.35, arm + gap * 0.35, Math.min(1.6, arm / 2), height + 0.2);
  return difference(outer, inner.translate(0, 0, -0.05));
}

function makePortFrame(width, height, radius, depth, x, y, z) {
  return roundedRect(width, height, radius)
    .extrude(depth)
    .pointAlong([0, 1, 0])
    .translate(x, y, z);
}

const frontZ = bodyT;
let body = roundedSlab(bodyW, bodyH, cornerR, bodyT, 0);

const screenY = bodyH / 2 - screenTopGap - screenSize / 2;
const controlsSplitY = screenY - screenSize / 2 - 1.3;
const displayCut = roundedSlab(screenSize + 1.1, screenSize + 1.1, screenBezelR + 0.3, screenRecess + 0.25, frontZ - screenRecess)
  .translate(0, screenY, 0);
body = difference(body, displayCut);

const rearPanelCut = roundedSlab(bodyW - rearStep * 2, bodyH - rearStep * 2, Math.max(1, cornerR - rearStep * 0.45), 0.42, -0.08);
body = difference(body, rearPanelCut);

const cartridgeSlot = roundedRect(cartSlotW, cartSlotDepth, cartSlotDepth / 2)
  .extrude(3.1)
  .pointAlong([0, -1, 0])
  .translate(0, bodyH / 2 + 0.25, bodyT * 0.62);
body = difference(body, cartridgeSlot);

const usbCut = makePortFrame(usbW, usbH, usbH / 2, 6.5, 0, -bodyH / 2 - 0.35, bodyT * 0.45);
const jackCut = cylinder(6.5, jackDia / 2, jackDia / 2, 32)
  .pointAlong([0, 1, 0])
  .translate(-bodyW / 2 + 10, -bodyH / 2 - 0.35, bodyT * 0.48);
const linkCut = makePortFrame(6.8, 2.1, 0.75, 5.6, bodyW / 2 - 10.5, -bodyH / 2 - 0.35, bodyT * 0.48);
body = difference(body, usbCut, jackCut, linkCut);

const sideCutters = [];
const speakerStartY = bodyH / 2 - 12;
for (let i = 0; i < speakerHoleCount; i++) {
  sideCutters.push(
    cylinder(bodyW * 0.08, speakerHoleDia / 2, speakerHoleDia / 2, 18)
      .pointAlong([1, 0, 0])
      .translate(-bodyW / 2 - 1.2, speakerStartY - i * 3, bodyT * 0.76)
  );
}
const leftSideButtonPocket = sidePill(sideButtonLength + 1.2, 4.2, 2.6, -bodyW / 2 - 0.2, bodyH / 2 - 46, bodyT * 0.47, "left");
const leftPowerPocket = sidePill(7.8, 4.0, 2.6, -bodyW / 2 - 0.2, bodyH / 2 - 64, bodyT * 0.47, "left");
const leftShoulderPocket = sidePill(shoulderLength + 1.5, shoulderHeight + 0.8, 3.0, -bodyW / 2 - 0.2, bodyH / 2 - 7.5, bodyT * 0.82, "left");
const rightShoulderPocket = sidePill(shoulderLength + 1.5, shoulderHeight + 0.8, 3.0, bodyW / 2 + 0.2, bodyH / 2 - 7.5, bodyT * 0.82, "right");
body = difference(body, ...sideCutters, leftSideButtonPocket, leftPowerPocket, leftShoulderPocket, rightShoulderPocket);

const screenGlass = roundedSlab(screenSize, screenSize, screenBezelR, 0.18, frontZ + 0.04 + glassProud)
  .translate(0, screenY, 0)
  .material(glassMat);

const logoPill = roundedRect(10.5, 4.2, 2.1).extrude(0.08)
  .rotateZ(-24)
  .translate(1.2, screenY + 1.2, frontZ + 0.32 + glassProud);
const logoDot = cylinder(0.08, 2.0, 2.0, 28)
  .translate(-3.6, screenY - 4.7, frontZ + 0.32 + glassProud);

const separatorLine = box(bodyW - 4.5, 0.25, 0.18)
  .translate(0, controlsSplitY, frontZ + 0.03);

const dpadX = -bodyW / 2 + dpadXInset;
const dpadY = -bodyH / 2 + dpadYFromBottom;
const dpadBezel = makeDpadBezel(dpadSpan, dpadArm, dpadBaseGap, 0.34)
  .translate(dpadX, dpadY, frontZ + 0.02);
let dpad = makeDpadCross(dpadSpan, dpadArm, Math.min(1.8, dpadArm / 2), dpadHeight)
  .translate(dpadX, dpadY, frontZ + 0.18);

const buttonCX = bodyW / 2 - buttonClusterXInset;
const buttonCY = -bodyH / 2 + buttonYFromBottom;
const buttonOffsets = [
  [0, buttonPitch / 2],
  [buttonPitch / 2, 0],
  [0, -buttonPitch / 2],
  [-buttonPitch / 2, 0],
];
const faceButtons = buttonOffsets.map(([x, y]) => frontCircularButton(buttonCX + x, buttonCY + y, buttonDia, buttonHeight, frontZ + 0.13));
const faceButtonShadows = buttonOffsets.map(([x, y]) => frontCircularButton(buttonCX + x, buttonCY + y, buttonDia + 1.5, 0.28, frontZ + 0.02));

const menuY = -bodyH / 2 + menuYFromBottom;
const menuCenterX = menuXOffset;
const menuButtons = [
  frontCircularButton(menuCenterX - menuButtonPitch, menuY, menuButtonDia, 0.75, frontZ + 0.12),
  frontCircularButton(menuCenterX, menuY + 0.6, menuButtonDia * 1.18, 0.9, frontZ + 0.12),
  frontCircularButton(menuCenterX + menuButtonPitch, menuY, menuButtonDia, 0.75, frontZ + 0.12),
];

const homeGlyph = showMarkings
  ? text2d("S", { size: 2.4, align: "center", baseline: "center" })
      .extrude(0.06)
      .translate(menuCenterX, menuY + 0.6, frontZ + 1.1)
  : null;

const leftRocker = sidePill(sideButtonLength, 3.5, 1.4, -bodyW / 2 - 0.55, bodyH / 2 - 46, bodyT * 0.47, "left");
const leftPower = sidePill(7.0, 3.4, 1.4, -bodyW / 2 - 0.55, bodyH / 2 - 64, bodyT * 0.47, "left");
const shoulderLeft = sidePill(shoulderLength, shoulderHeight, 1.75, -bodyW / 2 - 0.55, bodyH / 2 - 7.5, bodyT * 0.82, "left");
const shoulderRight = sidePill(shoulderLength, shoulderHeight, 1.75, bodyW / 2 + 0.55, bodyH / 2 - 7.5, bodyT * 0.82, "right");

const usbInterior = makePortFrame(usbW - 1.5, usbH - 0.8, Math.max(0.3, (usbH - 0.8) / 2), 0.65, 0, -bodyH / 2 - 0.8, bodyT * 0.45);
const jackInterior = cylinder(0.65, jackDia * 0.35, jackDia * 0.35, 28)
  .pointAlong([0, 1, 0])
  .translate(-bodyW / 2 + 10, -bodyH / 2 - 0.8, bodyT * 0.48);
const linkInterior = makePortFrame(5.1, 1.3, 0.45, 0.65, bodyW / 2 - 10.5, -bodyH / 2 - 0.8, bodyT * 0.48);

const rearPocketPanel = roundedSlab(bodyW - rearStep * 2 - 0.8, bodyH - rearStep * 2 - 0.8, Math.max(1, cornerR - rearStep), 0.22, -0.04);
const rearCartRelief = roundedRect(cartSlotW * 0.82, 12, 1.8)
  .extrude(0.35)
  .translate(0, bodyH / 2 - 18, -0.05);
const rearScrewR = Param.number("Rear Screw Diameter", 2.4, { min: 1.4, max: 3.5, step: 0.1, unit: "mm" });
const rearScrewInsetX = Param.number("Rear Screw X Inset", 8, { min: 5, max: 13, step: 0.5, unit: "mm" });
const rearScrewInsetY = Param.number("Rear Screw Y Inset", 8.5, { min: 5, max: 14, step: 0.5, unit: "mm" });
const rearScrews = [
  [-bodyW / 2 + rearScrewInsetX, -bodyH / 2 + rearScrewInsetY],
  [bodyW / 2 - rearScrewInsetX, -bodyH / 2 + rearScrewInsetY],
].map(([x, y]) => cylinder(0.28, rearScrewR / 2, rearScrewR / 2, 28).translate(x, y, -0.08));

const lowerEmblem = showMarkings
  ? union(
      box(5.2, 0.65, 0.22).translate(bodyW / 2 - 12, -bodyH / 2 + 8.5, frontZ + 0.18),
      box(0.65, 5.2, 0.22).translate(bodyW / 2 - 12, -bodyH / 2 + 8.5, frontZ + 0.18),
      box(5.2, 0.65, 0.22).translate(bodyW / 2 - 8.5, -bodyH / 2 + 8.5, frontZ + 0.18),
      box(0.65, 5.2, 0.22).translate(bodyW / 2 - 8.5, -bodyH / 2 + 8.5, frontZ + 0.18)
    )
  : null;

const productName = showMarkings
  ? text2d("Analogue Pocket", { size: 2.05, align: "left", baseline: "center" })
      .extrude(0.06)
      .rotateZ(90)
      .translate(-bodyW / 2 + 1.5, controlsSplitY - 7.2, frontZ + 0.16)
  : null;

scene({
  background: { top: "#eef0f0", bottom: "#aab0b3" },
  camera: { position: [118, -195, 168], target: [0, 0, bodyT * 0.52], fov: 30 },
  environment: { preset: "studio", intensity: 0.33, background: false },
  lights: [
    { type: "ambient", color: "#f3eadc", intensity: 0.16 },
    { type: "directional", position: [220, -280, 330], target: [0, 0, bodyT * 0.48], color: "#fff1dd", intensity: 2.8, castShadow: true },
    { type: "directional", position: [-170, 120, 210], target: [0, 0, bodyT * 0.5], color: "#d3e1ee", intensity: 0.86 },
    { type: "hemisphere", skyColor: "#dce3e9", groundColor: "#606569", intensity: 0.18 },
  ],
  ground: { visible: true, color: "#c7c9c8", offset: -1.0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.012, threshold: 0.94, radius: 0.18 },
    vignette: { darkness: 0.22, offset: 0.31 },
    toneMappingExposure: 1.04,
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#aab0b3" },
});

const parts = [
  { name: "CNC Aluminum Front Shell", shape: body.material(aluminumMat), color: colors.body },
  { name: "Rear Recessed Back Plate", shape: rearPocketPanel.material(darkAluminumMat), color: colors.bevel },
  { name: "Rear Cartridge Relief", shape: rearCartRelief.material(darkAluminumMat), color: colors.side },
  { name: "Rear Screw Heads", shape: union(...rearScrews).material(darkAluminumMat), color: colors.mark },
  { name: "Black Square Display Glass", shape: screenGlass, color: blackGlass },
  { name: "Display Boot Logo Mark", shape: union(logoPill, logoDot).material({ roughness: 0.2 }), color: screenLogo },
  { name: "Control Section Hairline", shape: separatorLine.material(darkAluminumMat), color: colors.mark },
  { name: "D-pad Recess Bezel", shape: dpadBezel.material(darkAluminumMat), color: colors.bevel },
  { name: "Raised Aluminum D-pad", shape: dpad.material(aluminumMat), color: colors.button },
  { name: "Face Button Recesses", shape: union(...faceButtonShadows).material(darkAluminumMat), color: colors.bevel },
  { name: "Four Round Face Buttons", shape: union(...faceButtons).material(aluminumMat), color: colors.button },
  { name: "Menu Row Buttons", shape: union(...menuButtons).material(aluminumMat), color: colors.button },
  { name: "Left Volume Rocker", shape: leftRocker.material(aluminumMat), color: colors.button },
  { name: "Left Power Button", shape: leftPower.material(aluminumMat), color: colors.button },
  { name: "Left Shoulder Button", shape: shoulderLeft.material(aluminumMat), color: colors.side },
  { name: "Right Shoulder Button", shape: shoulderRight.material(aluminumMat), color: colors.side },
  { name: "USB-C Dark Insert", shape: usbInterior.material(rubberMat), color: portDark },
  { name: "Headphone Jack Dark Insert", shape: jackInterior.material(rubberMat), color: portDark },
  { name: "Link Port Dark Insert", shape: linkInterior.material(rubberMat), color: portDark },
];

if (homeGlyph) {
  parts.push({ name: "Home Button Mark", shape: homeGlyph.material(rubberMat), color: colors.mark });
}
if (lowerEmblem) {
  parts.push({ name: "Subtle FPGA-style Emblem", shape: lowerEmblem.material(darkAluminumMat), color: colors.mark });
}
if (productName) {
  parts.push({ name: "Analogue Pocket Bezel Marking", shape: productName.material(rubberMat), color: "#d6d9d8" });
}

return parts;
