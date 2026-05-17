// Branch Creative inspired tabletop windmill fan.
// The head is authored along local +Z, then rotated so the grille faces -Y.

const grilleOuterDiameter = Param.number("Grille Outer Diameter", 250, { min: 200, max: 320, step: 1, unit: "mm" });
const grilleDepth = Param.number("Front Grille Depth", 24, { min: 14, max: 42, step: 0.5, unit: "mm" });
const grilleRimWidth = Param.number("Front Rim Width", 9.5, { min: 5, max: 18, step: 0.25, unit: "mm" });
const grilleBarCount = Param.number("Radial Grille Bar Count", 58, { min: 36, max: 96, step: 2, integer: true });
const grilleBarDiameter = Param.number("Radial Grille Bar Diameter", 2.45, { min: 1.2, max: 4.5, step: 0.05, unit: "mm" });
const innerHoopDiameter = Param.number("Inner Grille Hoop Diameter", 90, { min: 65, max: 125, step: 1, unit: "mm" });
const outerHoopInset = Param.number("Outer Support Hoop Inset", 22, { min: 12, max: 38, step: 0.5, unit: "mm" });

const frontHubDiameter = Param.number("Front Hub Diameter", 72, { min: 48, max: 105, step: 1, unit: "mm" });
const frontHubProud = Param.number("Front Hub Proudness", 5, { min: 1.5, max: 10, step: 0.25, unit: "mm" });
const showHubMark = Param.bool("Show Three-wave Hub Mark", true);
const hubMarkWidth = Param.number("Hub Mark Stroke Width", 1.05, { min: 0.45, max: 2.0, step: 0.05, unit: "mm" });

const bodyDiameter = Param.number("Main Body Diameter", 205, { min: 160, max: 240, step: 1, unit: "mm" });
const bodyDepth = Param.number("Main Body Depth", 32, { min: 20, max: 50, step: 0.5, unit: "mm" });
const rearMotorDiameter = Param.number("Rear Motor Diameter", 124, { min: 86, max: 170, step: 1, unit: "mm" });
const rearMotorDepth = Param.number("Rear Motor Depth", 26, { min: 14, max: 44, step: 0.5, unit: "mm" });
const rearButtonDiameter = Param.number("Rear Button Diameter", 15, { min: 8, max: 24, step: 0.25, unit: "mm" });
const rearButtonProud = Param.number("Rear Button Proudness", 1.4, { min: 0.4, max: 3.5, step: 0.1, unit: "mm" });
const rearVentCount = Param.number("Rear Vent Slot Count", 36, { min: 18, max: 64, step: 2, integer: true });

const bladeCount = Param.number("Windmill Blade Count", 4, { min: 3, max: 6, step: 1, integer: true });
const bladeLength = Param.number("Blade Length", 72, { min: 46, max: 104, step: 1, unit: "mm" });
const bladeRootWidth = Param.number("Blade Root Chord", 31, { min: 18, max: 48, step: 0.5, unit: "mm" });
const bladeTipWidth = Param.number("Blade Tip Chord", 20, { min: 10, max: 36, step: 0.5, unit: "mm" });
const bladeThickness = Param.number("Blade Thickness", 2.8, { min: 1.2, max: 5, step: 0.1, unit: "mm" });
const bladePitch = Param.number("Blade Pitch", 27, { min: 10, max: 44, step: 1, unit: "deg" });
const showImpeller = Param.bool("Show Impeller", true);

const baseDiameter = Param.number("Base Diameter", 168, { min: 125, max: 220, step: 1, unit: "mm" });
const baseHeight = Param.number("Base Height", 18, { min: 10, max: 30, step: 0.5, unit: "mm" });
const postHeight = Param.number("Post Height", 58, { min: 34, max: 92, step: 1, unit: "mm" });
const postDiameter = Param.number("Post Diameter", 30, { min: 18, max: 44, step: 0.5, unit: "mm" });
const neckDiameter = Param.number("Head Neck Diameter", 36, { min: 24, max: 52, step: 0.5, unit: "mm" });
const headTilt = Param.number("Head Up Tilt", 3, { min: -8, max: 12, step: 0.5, unit: "deg" });
const headYOffset = Param.number("Head Axis Y Offset", 9, { min: -12, max: 30, step: 0.5, unit: "mm" });
const standSetback = Param.number("Stand Setback Behind Grille", 40, { min: 18, max: 70, step: 0.5, unit: "mm" });

const finish = Param.choice("Finish", "matte warm white", [
  "matte warm white",
  "mist green",
  "soft coral",
  "deep navy",
]);
const renderQuality = Param.choice("Render Detail", "balanced", ["fast", "balanced", "fine"]);

const palettes = {
  "matte warm white": {
    shell: "#f2f3f1",
    secondary: "#c7cbd0",
    blade: "#b7bdc3",
    shadow: "#8d949b",
    button: "#e3e5e6",
    seam: "#aeb4ba",
  },
  "mist green": {
    shell: "#6ca184",
    secondary: "#5e8f77",
    blade: "#4f7d68",
    shadow: "#355d4b",
    button: "#79ab91",
    seam: "#426e5a",
  },
  "soft coral": {
    shell: "#e46f58",
    secondary: "#cc5e48",
    blade: "#b94c3a",
    shadow: "#853426",
    button: "#ed806b",
    seam: "#aa4939",
  },
  "deep navy": {
    shell: "#344a69",
    secondary: "#293c58",
    blade: "#24354f",
    shadow: "#162437",
    button: "#3e5677",
    seam: "#1d2d43",
  },
};

const detailSegments = {
  fast: { cylinder: 64, ring: 80, blade: 36 },
  balanced: { cylinder: 96, ring: 128, blade: 52 },
  fine: { cylinder: 144, ring: 176, blade: 72 },
}[renderQuality];

const C = palettes[finish];
const mattePlastic = { metalness: 0.02, roughness: 0.78, clearcoat: 0.08, clearcoatRoughness: 0.74 };
const satinPlastic = { metalness: 0.02, roughness: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.58 };
const shadowPlastic = { metalness: 0.02, roughness: 0.86 };

const grilleR = grilleOuterDiameter / 2;
const frontZ = 0;
const bodyFrontZ = grilleDepth;
const bodyBackZ = bodyFrontZ + bodyDepth;
const rearFrontZ = bodyBackZ;
const rearBackZ = rearFrontZ + rearMotorDepth;
const totalHeadDepth = rearBackZ + rearButtonProud;
const headCenterZ = baseHeight + postHeight + grilleOuterDiameter / 2 - 4;

function annularCylinder(height, outerR, innerR, segments) {
  const outer = cylinder(height, outerR, outerR, segments);
  const inner = cylinder(height + 2, innerR, innerR, segments).translate(0, 0, -1);
  return difference(outer, inner);
}

function materialize(shape, color, material) {
  return shape.color(color).material(material);
}

function safeFillet(shape, radius, selector) {
  try {
    return fillet(shape, radius, selector);
  } catch (e) {
    return shape;
  }
}

function makeFrontRim() {
  let rim = annularCylinder(grilleDepth, grilleR, grilleR - grilleRimWidth, detailSegments.ring);
  rim = safeFillet(rim, 1.8, { atZ: frontZ, convex: true });
  rim = safeFillet(rim, 1.2, { atZ: grilleDepth, convex: true });
  return materialize(rim, C.shell, mattePlastic);
}

function makeRadialBars() {
  const innerR = frontHubDiameter / 2 + 4.5;
  const outerR = grilleR - grilleRimWidth * 0.65;
  const rodLength = outerR - innerR;
  const rod = cylinder(rodLength, grilleBarDiameter / 2, grilleBarDiameter / 2, 10)
    .pointAlong([1, 0, 0])
    .translate(innerR, 0, 2.4);
  return materialize(circularPattern(rod, grilleBarCount), C.secondary, shadowPlastic);
}

function makeSupportHoops() {
  const innerHoop = torus(innerHoopDiameter / 2, Math.max(1.2, grilleBarDiameter * 0.55), detailSegments.ring)
    .translate(0, 0, 2.4);
  const outerHoop = torus(grilleR - outerHoopInset, Math.max(1.0, grilleBarDiameter * 0.45), detailSegments.ring)
    .translate(0, 0, 2.4);
  return materialize(union(innerHoop, outerHoop), C.secondary, shadowPlastic);
}

function makeHubMarkCutters() {
  const strokeW = hubMarkWidth;
  const z = -frontHubProud - 0.2;
  const wave = cylinder(18, strokeW / 2, strokeW / 2, 8)
    .pointAlong([0, 1, 0])
    .translate(0, -9, z)
    .rotateZ(-10);
  return union(
    wave.translate(-5.0, 0, 0),
    wave.translate(0, 0, 0),
    wave.translate(5.0, 0, 0)
  );
}

function makeFrontHub() {
  let hub = cylinder(frontHubProud + 2, frontHubDiameter / 2, frontHubDiameter / 2 - 1.0, detailSegments.cylinder)
    .translate(0, 0, -frontHubProud);
  hub = safeFillet(hub, 1.0, { atZ: -frontHubProud, convex: true });
  return materialize(hub, C.shell, satinPlastic);
}

function makeBladeProfile() {
  const rootR = frontHubDiameter / 2 - 2;
  const tipR = Math.min(grilleR - grilleRimWidth - 12, rootR + bladeLength);
  const points = [
    [rootR, -bladeRootWidth * 0.42],
    [rootR + bladeLength * 0.22, -bladeRootWidth * 0.62],
    [tipR - bladeTipWidth * 0.36, -bladeTipWidth * 0.48],
    [tipR, 0],
    [tipR - bladeTipWidth * 0.28, bladeTipWidth * 0.52],
    [rootR + bladeLength * 0.18, bladeRootWidth * 0.55],
    [rootR - 2.5, bladeRootWidth * 0.32],
  ];
  return polygon(points);
}

function makeImpeller() {
  const impellerZ = bodyFrontZ + bodyDepth * 0.45;
  const blade = makeBladeProfile()
    .extrude(bladeThickness)
    .translate(0, 0, impellerZ - bladeThickness / 2)
    .rotate([1, 0, 0], bladePitch, { pivot: [0, 0, impellerZ] });
  const blades = materialize(circularPattern(blade, bladeCount), C.blade, satinPlastic);
  const hub = materialize(
    cylinder(12, frontHubDiameter * 0.20, frontHubDiameter * 0.18, detailSegments.cylinder)
      .translate(0, 0, impellerZ - 6),
    C.blade,
    satinPlastic
  );
  return { blades, hub };
}

function makeMainBody() {
  const body = cylinder(bodyDepth, bodyDiameter / 2, bodyDiameter / 2, detailSegments.cylinder)
    .translate(0, 0, bodyFrontZ);
  const cavity = cylinder(bodyDepth + 4, bodyDiameter / 2 - 13, bodyDiameter / 2 - 13, detailSegments.cylinder)
    .translate(0, 0, bodyFrontZ - 2);
  let shell = difference(body, cavity);
  shell = safeFillet(shell, 2.3, { atZ: bodyBackZ, convex: true });
  return materialize(shell, C.shell, mattePlastic);
}

function makeRearMotor() {
  let motor = cylinder(rearMotorDepth, rearMotorDiameter / 2, rearMotorDiameter / 2, detailSegments.cylinder)
    .translate(0, 0, rearFrontZ);
  motor = safeFillet(motor, 4.2, { atZ: rearBackZ, convex: true });
  return materialize(motor, C.shell, mattePlastic);
}

function makeRearDetails() {
  const slotInner = rearButtonDiameter / 2 + 12;
  const slotOuter = rearMotorDiameter / 2 - 12;
  const slotLen = slotOuter - slotInner;
  const slotW = Math.max(1.2, grilleBarDiameter * 0.9);
  const rearZ = rearBackZ + 0.18;
  const slot = roundedRect(slotLen, slotW, slotW / 2)
    .extrude(0.55)
    .placeReference("center", [slotInner + slotLen / 2, 0, rearZ]);
  const vents = materialize(circularPattern(slot, rearVentCount), C.seam, shadowPlastic);
  const button = materialize(
    cylinder(rearButtonProud, rearButtonDiameter / 2, rearButtonDiameter / 2, 36)
      .translate(0, 0, rearBackZ),
    C.button,
    satinPlastic
  );
  return { vents, button };
}

function makeSeams() {
  const frontSeam = torus(grilleR - 1.0, 0.55, detailSegments.ring).translate(0, 0, grilleDepth + 0.15);
  const rearSeam = torus(rearMotorDiameter / 2 - 0.5, 0.48, detailSegments.ring).translate(0, 0, rearFrontZ + 0.4);
  return materialize(union(frontSeam, rearSeam), C.seam, shadowPlastic);
}

function placeHeadPart(shape) {
  return shape
    .rotate([1, 0, 0], -90)
    .rotate([1, 0, 0], headTilt, { pivot: [0, 0, 0] })
    .translate(0, headYOffset, headCenterZ);
}

function makeBase() {
  let base = cylinder(baseHeight, baseDiameter / 2, baseDiameter / 2, detailSegments.cylinder);
  base = safeFillet(base, 3.2, { atZ: baseHeight, convex: true });
  return materialize(base, C.shell, mattePlastic);
}

function makePostAndNeck() {
  const mountY = headYOffset + standSetback;
  const post = materialize(
    cylinder(postHeight, postDiameter / 2, postDiameter / 2, 48).translate(0, mountY, baseHeight),
    C.shell,
    mattePlastic
  );
  const neckTop = baseHeight + postHeight + 10;
  const neck = materialize(
    cylinder(20, neckDiameter / 2, neckDiameter / 2, 48)
      .translate(0, mountY, baseHeight + postHeight - 2),
    C.shell,
    mattePlastic
  );
  const saddle = materialize(
    sphere(neckDiameter / 2, 40)
      .scale([1.08, 0.72, 0.58])
      .translate(0, mountY + 2, neckTop),
    C.shell,
    mattePlastic
  );
  return { post, neck, saddle };
}

scene({
  background: { top: "#dfe5eb", bottom: "#6e7985" },
  camera: { position: [420, -550, 335], target: [0, 8, 162], fov: 36 },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.17 },
    { type: "directional", position: [280, -340, 430], target: [0, 0, 145], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-260, 220, 240], target: [0, 0, 140], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.14 },
  ],
  ground: { visible: true, color: "#9aa4af", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.035, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
  views: {
    hero: { camera: { position: [420, -550, 335], target: [0, 8, 162], up: [0, 0, 1], fov: 36 } },
    front: { camera: { position: [0, -610, 160], target: [0, 8, 162], up: [0, 0, 1], fov: 31 } },
    side: { camera: { position: [430, 20, 165], target: [0, 28, 150], up: [0, 0, 1], fov: 32 } },
    rear: { camera: { position: [210, 570, 210], target: [0, 42, 152], up: [0, 0, 1], fov: 34 } },
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#6e7985" },
});

const frontRim = makeFrontRim();
const radialBars = makeRadialBars();
const supportHoops = makeSupportHoops();
const frontHub = makeFrontHub();
const hubMark = materialize(makeHubMarkCutters(), C.seam, shadowPlastic);
const mainBody = makeMainBody();
const rearMotor = makeRearMotor();
const rearDetails = makeRearDetails();
const seams = makeSeams();
const base = makeBase();
const stand = makePostAndNeck();

const result = [
  { name: "Low round base", shape: base, color: C.shell },
  { name: "Slim vertical stand post", shape: stand.post, color: C.shell },
  { name: "Head neck sleeve", shape: stand.neck, color: C.shell },
  { name: "Rounded head saddle", shape: stand.saddle, color: C.shell },
  { name: "Stepped rear motor housing", shape: placeHeadPart(rearMotor), color: C.shell },
  { name: "Main fan body shell", shape: placeHeadPart(mainBody), color: C.shell },
  { name: "Subtle circular body seams", shape: placeHeadPart(seams), color: C.seam },
  { name: "Rear radial intake slots", shape: placeHeadPart(rearDetails.vents), color: C.seam },
  { name: "Single rear push button", shape: placeHeadPart(rearDetails.button), color: C.button },
  { name: "Front circular grille rim", shape: placeHeadPart(frontRim), color: C.shell },
  { name: "Radial grille bars", shape: placeHeadPart(radialBars), color: C.secondary },
  { name: "Inner and outer grille support hoops", shape: placeHeadPart(supportHoops), color: C.secondary },
  { name: "Plain front hub cap with wave mark", shape: placeHeadPart(frontHub), color: C.shell },
];

if (showHubMark) {
  result.push({ name: "Subtle three-wave hub mark", shape: placeHeadPart(hubMark), color: C.seam });
}

if (showImpeller) {
  const impeller = makeImpeller();
  result.splice(5, 0,
    { name: "Four broad windmill blades", shape: placeHeadPart(impeller.blades), color: C.blade },
    { name: "Impeller center boss", shape: placeHeadPart(impeller.hub), color: C.blade }
  );
}

return result;
