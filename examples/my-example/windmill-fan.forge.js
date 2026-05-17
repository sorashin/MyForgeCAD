// Windmill-style desktop fan, modeled from three reference views.
// Units are millimeters. The fan is a static product model with the rotor
// posed behind the front grille.

const grilleSpokes = Param.number("Front Grille Spokes", 44, { min: 36, max: 72, integer: true });
const rearGrilleSpokes = Param.number("Rear Grille Spokes", 36, { min: 28, max: 60, integer: true });
const bladeCount = Param.number("Blade Count", 5, { min: 3, max: 7, integer: true });
const fanDiameter = Param.number("Fan Diameter", 126, { min: 90, max: 170, unit: "mm" });
const housingDepth = Param.number("Housing Depth", 44, { min: 28, max: 70, unit: "mm" });
const baseDiameter = Param.number("Base Diameter", 120, { min: 90, max: 150, unit: "mm" });
const standHeight = Param.number("Stand Height", 70, { min: 45, max: 95, unit: "mm" });
const showCable = Param.bool("Show Power Cable", true);

const white = "#f1f2f1";
const shadowWhite = "#d6dad9";
const darkCavity = "#2f3335";
const bladeGrey = "#b8bcbd";
const cableGrey = "#c4c8c9";

const baseH = 10;
const baseR = baseDiameter / 2;
const fanR = fanDiameter / 2;
const fanZ = baseH + standHeight + fanR * 0.12;
const center = [0, 0, fanZ];

const frontY = -housingDepth / 2 - 8;
const bladeY = frontY + 10;
const rearY = housingDepth / 2;
const grilleDepth = 3.0;
const spokeW = Math.max(1.4, fanDiameter / 86);
const rimTube = Math.max(2.6, fanDiameter / 45);
const hubR = fanR * 0.25;
const rearHubR = fanR * 0.31;

function ringXZ(radius, tube, y, z = fanZ) {
  return torus(radius, tube, 96).rotate([1, 0, 0], 90).translate(0, y, z);
}

function diskY(depth, radius, y, z = fanZ, segments = 96) {
  return cylinder(depth, radius, radius, segments)
    .pointAlong([0, 1, 0])
    .translate(0, y - depth / 2, z);
}

function annularDiskY(depth, outerR, innerR, y, z = fanZ, segments = 128) {
  return difference(
    diskY(depth, outerR, y, z, segments),
    diskY(depth + 1.2, innerR, y, z, segments)
  );
}

function radialRod(innerR, outerR, width, depth, y, angleDeg, z = fanZ) {
  const len = outerR - innerR;
  const mid = innerR + len / 2;
  return box(len, depth, width)
    .translate(mid, y, z - width / 2)
    .rotate([0, 1, 0], angleDeg, { pivot: [0, y, z] });
}

function roundedPillOnFan(length, width, depth, radius, y, radialCenter, angleDeg, z = fanZ) {
  return roundedRect(length, width, radius)
    .extrude(depth)
    .pointAlong([0, 1, 0])
    .translate(radialCenter, y - depth / 2, z)
    .rotate([0, 1, 0], angleDeg, { pivot: [0, y, z] });
}

function makeGrille(spokeCount, y, innerR, outerR, width, depth, startDeg = 0) {
  const rods = [];
  for (let i = 0; i < spokeCount; i++) {
    const angle = startDeg + (360 * i) / spokeCount;
    rods.push(radialRod(innerR, outerR, width, depth, y, angle));
  }

  return union(
    ringXZ(outerR, rimTube, y),
    ringXZ(innerR, rimTube * 0.65, y),
    ringXZ((innerR + outerR) * 0.5, rimTube * 0.42, y),
    rods
  );
}

function makeBlade(angleDeg) {
  const bladeLen = fanR * 0.66;
  const bladeW = fanR * 0.18;
  const radialCenter = hubR + bladeLen * 0.48;
  const main = roundedPillOnFan(bladeLen, bladeW, 3.2, bladeW * 0.48, bladeY, radialCenter, angleDeg + 12);
  const tip = roundedPillOnFan(bladeLen * 0.36, bladeW * 0.72, 3.4, bladeW * 0.36, bladeY - 0.8, radialCenter + bladeLen * 0.22, angleDeg + 30);
  return union(main, tip);
}

const base = cylinder(baseH, baseR, baseR, 128)
  .material({ roughness: 0.62, clearcoat: 0.22 });

const baseBevel = torus(baseR - 1.8, 1.2, 128)
  .translate(0, 0, baseH - 0.8);

const stand = union(
  cylinder(standHeight, 8, 8, 48).translate(0, 0, baseH),
  cylinder(13, 11, 8, 48).translate(0, 0, baseH + standHeight - 6),
  sphere(11, 48).scale(1, 0.86, 0.72).translate(0, 0, baseH + standHeight)
).material({ roughness: 0.6, clearcoat: 0.25 });

const rearHousing = union(
  annularDiskY(housingDepth * 0.86, fanR * 0.94, fanR * 0.80, rearY - housingDepth * 0.33, fanZ, 128),
  annularDiskY(housingDepth * 0.46, fanR * 0.72, rearHubR + 5, rearY - housingDepth * 0.82, fanZ, 128),
  diskY(housingDepth * 0.32, rearHubR, rearY - housingDepth * 0.08, fanZ, 96)
).material({ roughness: 0.58, clearcoat: 0.28 });

const outerFrontRim = union(
  ringXZ(fanR - rimTube * 0.7, rimTube * 1.2, frontY),
  ringXZ(fanR * 0.87, rimTube * 0.55, frontY + 1.4)
);

const frontGrille = makeGrille(
  grilleSpokes,
  frontY,
  hubR + 4.5,
  fanR - rimTube * 2.3,
  spokeW,
  grilleDepth,
  -2
);

const rearGrille = makeGrille(
  rearGrilleSpokes,
  frontY + housingDepth * 0.54,
  rearHubR + 7,
  fanR - rimTube * 2.8,
  spokeW * 1.05,
  2.2,
  4
).material({ roughness: 0.72 });

const blades = [];
for (let i = 0; i < bladeCount; i++) {
  blades.push(makeBlade((360 * i) / bladeCount));
}
const rotorBlades = union(blades).material({ roughness: 0.7, opacity: 0.78 });

const frontHub = union(
  diskY(6, hubR, frontY - 2.7, fanZ, 96),
  ringXZ(hubR + 1.0, 1.5, frontY - 3.2)
).material({ roughness: 0.55, clearcoat: 0.35 });

const logoY = frontY - 6.2;
const logoMarks = union(
  roundedPillOnFan(7.5, 1.35, 0.65, 0.65, logoY, 0, -13, fanZ + 2.8),
  roundedPillOnFan(7.5, 1.35, 0.65, 0.65, logoY, 0, -13, fanZ),
  roundedPillOnFan(7.5, 1.35, 0.65, 0.65, logoY, 0, -13, fanZ - 2.8)
).material({ roughness: 0.5, clearcoat: 0.4 });

const neckFairing = union(
  cylinder(18, 9, 11, 48)
    .pointAlong([0, 1, 0])
    .translate(0, frontY + 12 - 9, baseH + standHeight + 2),
  roundedRect(26, 18, 7)
    .extrude(12)
    .pointAlong([0, 1, 0])
    .translate(0, frontY + 14 - 6, baseH + standHeight + 3)
).material({ roughness: 0.62, clearcoat: 0.22 });

const buttons = union(
  roundedRect(12, 4, 2).extrude(1.0).translate(-7, -baseR * 0.42, baseH),
  cylinder(0.9, 2.2, 2.2, 32).translate(9, -baseR * 0.42, baseH)
).material({ roughness: 0.5, clearcoat: 0.2 });

let cable = null;
if (showCable) {
  cable = path()
    .moveTo(-baseR - 5, baseR * 0.1)
    .lineTo(-baseR * 1.12, baseR * 0.12)
    .lineTo(-baseR * 1.45, baseR * 0.04)
    .lineTo(-baseR * 2.0, baseR * 0.08)
    .stroke(2.4, "Round")
    .extrude(1.1)
    .translate(0, 0, 0.15)
    .material({ roughness: 0.82 });
}

console.log("fan diameter:", fanDiameter.toFixed(1), "mm");
console.log("overall height:", (fanZ + fanR).toFixed(1), "mm");
console.log("housing depth:", housingDepth.toFixed(1), "mm");
console.log("front grille spokes:", grilleSpokes);

scene({
  background: { top: "#f1f1ef", bottom: "#d7d9d8" },
  camera: {
    position: [fanDiameter * 0.85, -fanDiameter * 1.95, fanZ + fanDiameter * 0.28],
    target: [0, frontY, fanZ],
    fov: 30,
  },
  environment: { preset: "studio", intensity: 0.34, background: false },
  lights: [
    { type: "ambient", color: "#ffffff", intensity: 0.18 },
    { type: "directional", position: [180, -260, 260], color: "#fff4df", intensity: 2.6, castShadow: true },
    { type: "directional", position: [-240, 120, 220], color: "#dceaff", intensity: 0.7 },
  ],
  ground: { visible: true, color: "#e8e9e7", height: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.02, threshold: 0.94, radius: 0.22 },
    vignette: { darkness: 0.12, offset: 0.45 },
    toneMappingExposure: 1.08,
  },
});

const whitePlasticBody = union(
  base,
  baseBevel,
  stand,
  neckFairing,
  rearHousing,
  outerFrontRim,
  frontGrille,
  rearGrille,
  frontHub,
  logoMarks,
  buttons
).material({ roughness: 0.6, clearcoat: 0.26 });

const output = [
  { name: "White Molded Body", shape: whitePlasticBody, color: white },
  { name: "Rotor Blades", shape: rotorBlades, color: bladeGrey },
];

if (cable) {
  output.push({ name: "Power Cable", shape: cable, color: cableGrey });
}

return output;
