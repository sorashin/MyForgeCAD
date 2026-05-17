// Parametric tapered-candle holder: heavy turned brass body with subtle rim grooves.

const baseDiameter = Param.number("Base Diameter", 70, { min: 45, max: 110, step: 0.5, unit: "mm" });
const totalHeight = Param.number("Overall Height", 40, { min: 24, max: 70, step: 0.5, unit: "mm" });
const topDiameterInput = Param.number("Top Rim Diameter", 56, { min: 34, max: 92, step: 0.5, unit: "mm" });
const waistDiameterInput = Param.number("Waist Diameter", 52, { min: 30, max: 86, step: 0.5, unit: "mm" });

const socketDiameter = Param.number("Socket Opening Diameter", 22, { min: 16, max: 32, step: 0.25, unit: "mm" });
const socketBottomDiameterInput = Param.number("Socket Bottom Diameter", 18, { min: 10, max: 28, step: 0.25, unit: "mm" });
const socketDepthInput = Param.number("Socket Depth", 25, { min: 10, max: 45, step: 0.5, unit: "mm" });
const wickReliefDiameter = Param.number("Center Relief Diameter", 6, { min: 0, max: 12, step: 0.25, unit: "mm" });
const wickReliefDepth = Param.number("Center Relief Depth", 2, { min: 0, max: 5, step: 0.25, unit: "mm" });

const footHeight = Param.number("Foot Band Height", 4.5, { min: 1.5, max: 9, step: 0.25, unit: "mm" });
const footInset = Param.number("Foot Upper Inset", 2.2, { min: 0, max: 6, step: 0.25, unit: "mm" });
const shoulderHeight = Param.number("Shoulder Height", 9, { min: 4, max: 18, step: 0.5, unit: "mm" });
const topCollarHeight = Param.number("Top Collar Height", 7, { min: 3, max: 14, step: 0.5, unit: "mm" });
const rimLipHeight = Param.number("Raised Rim Lip Height", 1.5, { min: 0.5, max: 4, step: 0.25, unit: "mm" });

const sideGrooveCount = Param.number("Side Groove Count", 3, { min: 0, max: 6, step: 1, integer: true });
const sideGrooveDepth = Param.number("Side Groove Depth", 0.55, { min: 0.15, max: 1.4, step: 0.05, unit: "mm" });
const sideGrooveWidth = Param.number("Side Groove Width", 1.1, { min: 0.4, max: 2.5, step: 0.05, unit: "mm" });
const sideGrooveSpacing = Param.number("Side Groove Spacing", 2.8, { min: 1.3, max: 6, step: 0.1, unit: "mm" });

const showTopGrooves = Param.bool("Show Top Rim Grooves", true);
const topGrooveDepth = Param.number("Top Groove Depth", 0.38, { min: 0.1, max: 1.1, step: 0.05, unit: "mm" });
const topGrooveWidth = Param.number("Top Groove Width", 1.2, { min: 0.5, max: 2.8, step: 0.05, unit: "mm" });
const topGrooveOffset = Param.number("Top Groove Offset From Edge", 5.4, { min: 2, max: 12, step: 0.25, unit: "mm" });

const finish = Param.choice("Brass Finish", "aged satin brass", [
  "aged satin brass",
  "polished brass",
  "dark antique brass",
]);
const radialSegments = Param.number("Radial Segments", 160, { min: 72, max: 256, step: 8, integer: true });

const baseR = baseDiameter / 2;
const socketTopR = socketDiameter / 2;
const minTopR = socketTopR + 8;
const rimR = Math.max(topDiameterInput / 2, minTopR);
const waistR = Math.max(waistDiameterInput / 2, socketTopR + 5);
const footUpperR = Math.max(baseR - footInset, waistR + 0.8);
const socketBottomR = Math.min(socketTopR - 0.35, Math.max(socketBottomDiameterInput / 2, 3.5));
const socketDepth = Math.min(socketDepthInput, totalHeight - 5);
const socketFloorZ = totalHeight - socketDepth;
const reliefR = Math.min(wickReliefDiameter / 2, Math.max(socketBottomR - 2, 0));
const reliefFloorZ = Math.max(1.5, socketFloorZ - wickReliefDepth);
const shoulderZ = Math.min(totalHeight - topCollarHeight - rimLipHeight, footHeight + shoulderHeight);
const collarBaseZ = Math.max(shoulderZ + 1, totalHeight - topCollarHeight);

const palette = {
  "aged satin brass": {
    color: "#b99443",
    material: { metalness: 0.86, roughness: 0.42, clearcoat: 0.12, clearcoatRoughness: 0.5 },
  },
  "polished brass": {
    color: "#d7ad42",
    material: { metalness: 0.95, roughness: 0.18, clearcoat: 0.35, clearcoatRoughness: 0.18 },
  },
  "dark antique brass": {
    color: "#79612f",
    material: { metalness: 0.82, roughness: 0.58, clearcoat: 0.08, clearcoatRoughness: 0.68 },
  },
};
const brass = palette[finish];

function radiusAtOuterZ(z) {
  if (z <= footHeight) {
    const t = z / Math.max(footHeight, 0.001);
    return baseR + (footUpperR - baseR) * t;
  }
  if (z <= shoulderZ) {
    const t = (z - footHeight) / Math.max(shoulderZ - footHeight, 0.001);
    return footUpperR + (waistR - footUpperR) * t;
  }
  if (z <= collarBaseZ) {
    const t = (z - shoulderZ) / Math.max(collarBaseZ - shoulderZ, 0.001);
    return waistR + (rimR - rimLipHeight - waistR) * t;
  }
  const t = (z - collarBaseZ) / Math.max(totalHeight - collarBaseZ, 0.001);
  return (rimR - rimLipHeight) + (rimR - (rimR - rimLipHeight)) * t;
}

const profile = path().moveTo(0, 0);

profile.lineTo(baseR, 0);
profile.lineTo(baseR, 1.2);
profile.lineTo(footUpperR, footHeight);
profile.lineTo(waistR + 0.9, shoulderZ);

const grooveStartZ = Math.max(shoulderZ + 1.2, totalHeight - topCollarHeight + 1.0);
const grooveZs = [];
for (let i = 0; i < sideGrooveCount; i++) {
  const z = grooveStartZ + i * sideGrooveSpacing;
  if (z + sideGrooveWidth * 0.65 < totalHeight - 1.1) {
    grooveZs.push(z);
  }
}

for (const grooveZ of grooveZs) {
  const z0 = grooveZ - sideGrooveWidth / 2;
  const z1 = grooveZ + sideGrooveWidth / 2;
  profile.lineTo(radiusAtOuterZ(z0), z0);
  profile.lineTo(Math.max(radiusAtOuterZ(grooveZ) - sideGrooveDepth, socketTopR + 7), grooveZ);
  profile.lineTo(radiusAtOuterZ(z1), z1);
}

profile.lineTo(rimR - 0.9, totalHeight - rimLipHeight);
profile.lineTo(rimR, totalHeight);

if (showTopGrooves) {
  const outerGrooveR = Math.max(socketTopR + 4, rimR - topGrooveOffset);
  const innerGrooveR = Math.max(socketTopR + 2.5, outerGrooveR - topGrooveWidth);
  const innerLipR = Math.max(socketTopR + 1.4, innerGrooveR - topGrooveWidth * 1.4);
  profile.lineTo(outerGrooveR, totalHeight);
  profile.lineTo((outerGrooveR + innerGrooveR) / 2, totalHeight - topGrooveDepth);
  profile.lineTo(innerGrooveR, totalHeight);
  profile.lineTo(innerLipR, totalHeight);
  profile.lineTo(Math.max(innerLipR - topGrooveWidth * 0.7, socketTopR + 0.8), totalHeight - topGrooveDepth * 0.55);
}

profile.lineTo(socketTopR, totalHeight);
profile.lineTo(socketBottomR, socketFloorZ);

if (reliefR > 0.1 && wickReliefDepth > 0.05) {
  profile.lineTo(reliefR, socketFloorZ);
  profile.lineTo(reliefR, reliefFloorZ);
  profile.lineTo(0, reliefFloorZ);
} else {
  profile.lineTo(0, socketFloorZ);
}

const holder = profile
  .close()
  .revolve(360, radialSegments)
  .color(brass.color)
  .material(brass.material);

const plinth = cylinder(9, Math.max(baseR + 18, 54), undefined, 96)
  .translate(0, 0, -10)
  .color("#6f7780")
  .material({ metalness: 0.03, roughness: 0.86 });
mock(plinth, "Matte Studio Plinth");

scene({
  background: { top: "#c8d0d8", bottom: "#596571" },
  camera: { position: [150, -185, 116], target: [0, 0, totalHeight * 0.48], fov: 36 },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient", color: "#efe6db", intensity: 0.16 },
    { type: "directional", position: [210, -280, 260], target: [0, 0, 18], color: "#ffe1bd", intensity: 3.0, castShadow: true },
    { type: "directional", position: [-210, 130, 150], target: [0, 0, 18], color: "#d4e5fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c9d5df", groundColor: "#4b5561", intensity: 0.15 },
  ],
  ground: { visible: true, color: "#31363c", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.26 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
  views: {
    hero: { camera: { position: [150, -185, 116], target: [0, 0, totalHeight * 0.48], up: [0, 0, 1], fov: 36 } },
    top: { camera: { position: [0, -8, 210], target: [0, 0, 18], up: [0, 1, 0], fov: 34 } },
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#596571" },
});

return [
  {
    name: "Turned Brass Candle Holder",
    shape: holder,
    color: brass.color,
  },
];
