const standWidth = Param.number("Stand Width", 100, { min: 75, max: 140, step: 1, unit: "mm" });
const standDepth = Param.number("Stand Depth", 80, { min: 55, max: 115, step: 1, unit: "mm" });
const backHeight = Param.number("Backrest Height", 52, { min: 42, max: 90, step: 1, unit: "mm" });
const baseThickness = Param.number("Base Thickness", 8, { min: 5, max: 16, step: 0.5, unit: "mm" });
const boardThickness = Param.number("Backrest Board Thickness", 8, { min: 5, max: 14, step: 0.5, unit: "mm" });
const backLean = Param.number("Back Lean From Vertical", 15, { min: 6, max: 28, step: 1, unit: "deg" });
const frontLipHeight = Param.number("Front Lip Height", 14, { min: 8, max: 24, step: 1, unit: "mm" });
const frontLipThickness = Param.number("Front Lip Thickness", 8, { min: 5, max: 14, step: 0.5, unit: "mm" });
const lipFrontInset = Param.number("Lip Front Inset", 14, { min: 6, max: 26, step: 1, unit: "mm" });
const sideRailHeight = Param.number("Side Rail Height", 5, { min: 2, max: 10, step: 0.5, unit: "mm" });
const sideRailWidth = Param.number("Side Rail Width", 5, { min: 3, max: 10, step: 0.5, unit: "mm" });
const sideRailLength = Param.number("Side Rail Length", 48, { min: 24, max: 76, step: 1, unit: "mm" });
const sideRailInset = Param.number("Side Rail Inset", 9, { min: 4, max: 18, step: 0.5, unit: "mm" });
const rearSetback = Param.number("Backrest Rear Setback", 18, { min: 4, max: 24, step: 1, unit: "mm" });
const cableHoleDiameter = Param.number("Cable Hole Diameter", 18, { min: 10, max: 28, step: 1, unit: "mm" });
const cableHoleHeight = Param.number("Cable Hole Center Height", 22, { min: 12, max: 42, step: 1, unit: "mm" });
const cornerRadius = Param.number("Base Corner Radius", 6, { min: 1, max: 14, step: 0.5, unit: "mm" });
const grainCount = Param.number("Wood Grain Line Count", 9, { min: 3, max: 18, step: 1, integer: true });
const grainWidth = Param.number("Wood Grain Width", 0.8, { min: 0.25, max: 1.8, step: 0.05, unit: "mm" });
const grainRaise = Param.number("Wood Grain Relief", 0.22, { min: 0.05, max: 0.8, step: 0.05, unit: "mm" });
const footDiameter = Param.number("Rubber Foot Diameter", 9, { min: 5, max: 16, step: 0.5, unit: "mm" });
const footHeight = Param.number("Rubber Foot Height", 2, { min: 1, max: 5, step: 0.25, unit: "mm" });
const showWoodGrain = Param.bool("Show Wood Grain", true);
const showGrommet = Param.bool("Show Cable Grommet", true);
const woodTone = Param.choice("Wood Tone", "oak", ["oak", "walnut", "maple"]);

const tones = {
  oak: {
    base: "#b98248",
    light: "#d5a267",
    dark: "#6f4324",
    end: "#8a552f",
  },
  walnut: {
    base: "#6a402a",
    light: "#8a5a3a",
    dark: "#2f1d16",
    end: "#4d2e20",
  },
  maple: {
    base: "#d8b77c",
    light: "#efd59a",
    dark: "#8a6334",
    end: "#b88b54",
  },
};

const palette = tones[woodTone] || tones.oak;
const rubberColor = "#171717";
const shadowColor = "#24201b";

scene({
  background: { top: "#16181b", bottom: "#050608" },
  camera: { position: [145, -150, 92], target: [0, 0, 28], fov: 38 },
  lights: [
    { type: "ambient", color: "#d8e2ee", intensity: 0.22 },
    { type: "directional", position: [90, -130, 150], color: "#fff0d0", intensity: 2.7, castShadow: true },
    { type: "directional", position: [-120, 70, 92], color: "#7aa7ff", intensity: 0.75 },
    { type: "point", position: [35, 78, 72], color: "#f0b36a", intensity: 1.2, distance: 260 },
  ],
  environment: { preset: "studio", intensity: 0.55, background: false },
  ground: { visible: true, color: "#111214", offset: -footHeight, receiveShadow: true },
  postProcessing: {
    toneMappingExposure: 1.18,
    vignette: { darkness: 0.45, offset: 0.28 },
    grain: { intensity: 0.035 },
  },
  capture: { size: 960, background: "#111214" },
});

const leanRad = backLean * Math.PI / 180;
const rearY = standDepth / 2 - rearSetback;
const panelZ = baseThickness + boardThickness * Math.sin(leanRad) / 2;

function onBackrest(localShape) {
  return localShape.rotateX(-backLean).translate(0, rearY, panelZ);
}

function woodMaterial(shape, color) {
  return shape
    .color(color)
    .material({ roughness: 0.78, metalness: 0.02, clearcoat: 0.18, clearcoatRoughness: 0.72 });
}

const baseProfile = roundedRect(standWidth, standDepth, Math.min(cornerRadius, standWidth / 2 - 1, standDepth / 2 - 1));
let baseTray = baseProfile.extrude(baseThickness);

const slotY = -standDepth / 2 + lipFrontInset + frontLipThickness / 2;
let frontLip = box(standWidth - 10, frontLipThickness, frontLipHeight)
  .translate(0, slotY, baseThickness);

const railStartY = slotY + frontLipThickness / 2 + 2;
const railBackLimit = rearY - boardThickness - 3;
const railLength = Math.max(12, Math.min(sideRailLength, railBackLimit - railStartY));
const railY = railStartY + railLength / 2;
const railX = standWidth / 2 - sideRailInset - sideRailWidth / 2;
const leftRail = box(sideRailWidth, railLength, sideRailHeight)
  .translate(-railX, railY, baseThickness);
const rightRail = box(sideRailWidth, railLength, sideRailHeight)
  .translate(railX, railY, baseThickness);

const cableCutterDepth = boardThickness * 3.5;
const cableCutter = cylinder(cableCutterDepth, cableHoleDiameter / 2, undefined, 48)
  .pointAlong([0, 1, 0])
  .translate(0, -cableCutterDepth / 2, cableHoleHeight);

let backrestLocal = box(standWidth - 8, boardThickness, backHeight)
  .subtract(cableCutter);
const backrest = onBackrest(backrestLocal);

const braceDepth = Math.max(12, boardThickness * 1.9);
const braceHeight = Math.max(18, backHeight * 0.44);
const braceX = standWidth / 2 - sideRailInset - sideRailWidth - 5;
const braceLocalY = -boardThickness / 2 - braceDepth / 2 - 0.4;
const braceLocalYMax = braceLocalY + braceDepth / 2;
const braceZLift = (baseThickness - panelZ + braceLocalYMax * Math.sin(leanRad)) / Math.cos(leanRad);
const leftBrace = onBackrest(box(8, braceDepth, braceHeight).translate(-braceX, braceLocalY, braceZLift));
const rightBrace = onBackrest(box(8, braceDepth, braceHeight).translate(braceX, braceLocalY, braceZLift));

const grommet = torus(cableHoleDiameter / 2 + 1.7, 1.15, 48)
  .rotateX(-90)
  .translate(0, boardThickness / 2 + 1.35, cableHoleHeight);
const placedGrommet = onBackrest(grommet);

const baseGrain = [];
if (showWoodGrain) {
  const usableWidth = standWidth - 18;
  const gap = usableWidth / (grainCount + 1);
  const grainStartY = railStartY + 2;
  const grainEndY = railBackLimit - 2;
  const grainSpan = Math.max(8, grainEndY - grainStartY);
  const grainCenterY = (grainStartY + grainEndY) / 2;
  for (let i = 0; i < grainCount; i++) {
    const x = -usableWidth / 2 + gap * (i + 1);
    const length = grainSpan * (0.72 + 0.12 * ((i % 3) / 2));
    const y = grainCenterY + ((i % 5) - 2) * 0.7;
    baseGrain.push(
      box(grainWidth * (1 + (i % 2) * 0.55), length, grainRaise)
        .translate(x, y, baseThickness + 0.03),
    );
  }
}

const backGrain = [];
if (showWoodGrain) {
  const usableWidth = standWidth - 34;
  const gap = usableWidth / (grainCount + 1);
  for (let i = 0; i < grainCount; i++) {
    const x = -usableWidth / 2 + gap * (i + 1);
    const h = backHeight * (0.62 + 0.16 * ((i + 1) % 3));
    const z = backHeight * 0.5 + ((i % 4) - 1.5) * 2;
    const lineWidth = grainWidth * (1 + (i % 2) * 0.4);
    const crossesCable = Math.abs(x) < cableHoleDiameter / 2 + 2.2;
    if (crossesCable) {
      const lowerHeight = Math.max(6, cableHoleHeight - cableHoleDiameter / 2 - 5);
      const upperStart = cableHoleHeight + cableHoleDiameter / 2 + 5;
      const upperHeight = Math.max(6, backHeight - upperStart - 4);
      backGrain.push(
        onBackrest(box(lineWidth, grainRaise, lowerHeight).translate(x, -boardThickness / 2 - grainRaise / 2, lowerHeight / 2)),
      );
      backGrain.push(
        onBackrest(box(lineWidth, grainRaise, upperHeight).translate(x, -boardThickness / 2 - grainRaise / 2, upperStart + upperHeight / 2)),
      );
    } else {
      backGrain.push(
        onBackrest(
          box(lineWidth, grainRaise, h)
            .translate(x, -boardThickness / 2 - grainRaise / 2, z - h / 2),
        ),
      );
    }
  }
}

const footInsetX = standWidth / 2 - 14;
const footInsetY = standDepth / 2 - 13;
const foot = cylinder(footHeight, footDiameter / 2, undefined, 32)
  .translate(0, 0, -footHeight);
const feet = union(
  foot.translate(-footInsetX, -footInsetY, 0),
  foot.translate(footInsetX, -footInsetY, 0),
  foot.translate(-footInsetX, footInsetY, 0),
  foot.translate(footInsetX, footInsetY, 0),
);

bom(1, "desktop smartphone stand body", {
  material: "solid wood",
  process: "CNC routed and sanded",
  dimensions: [standWidth, standDepth, backHeight],
  notes: "Supports portrait and landscape use; rear cable pass-through included.",
});
bom(4, "self-adhesive rubber foot", { material: "rubber", diameter: footDiameter, length: footHeight });

const objects = [
  { name: "Base tray", shape: woodMaterial(baseTray, palette.base), color: palette.base },
  { name: "Angled backrest with cable pass-through", shape: woodMaterial(backrest, palette.base), color: palette.base },
  { name: "Front retaining lip", shape: woodMaterial(frontLip, palette.end), color: palette.end },
  { name: "Left side guide rail", shape: woodMaterial(leftRail, palette.light), color: palette.light },
  { name: "Right side guide rail", shape: woodMaterial(rightRail, palette.light), color: palette.light },
  { name: "Left rear brace", shape: woodMaterial(leftBrace, palette.end), color: palette.end },
  { name: "Right rear brace", shape: woodMaterial(rightBrace, palette.end), color: palette.end },
  { name: "Rubber feet", shape: feet.color(rubberColor).material({ roughness: 0.92, metalness: 0, clearcoat: 0 }), color: rubberColor },
];

if (showWoodGrain && baseGrain.length > 0) {
  objects.push({ name: "Base wood grain", shape: union(baseGrain).color(palette.dark).material({ roughness: 0.88 }), color: palette.dark });
}

if (showWoodGrain && backGrain.length > 0) {
  objects.push({ name: "Backrest wood grain", shape: union(backGrain).color(palette.dark).material({ roughness: 0.88 }), color: palette.dark });
}

if (showGrommet) {
  objects.push({ name: "Rear cable grommet", shape: placedGrommet.color(shadowColor).material({ roughness: 0.72, metalness: 0.02 }), color: shadowColor });
}

return objects;
