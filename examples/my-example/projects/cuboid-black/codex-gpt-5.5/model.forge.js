// Kord-inspired cuboid power object.
// Compact matte-black cube with circular Schuko-style sockets, cable grommet,
// coiled rubber lead, and restrained industrial detailing.

const cubeSize = Param.number("Cube size", 120, { min: 90, max: 150, step: 1, unit: "mm" });
const edgeRadius = Param.number("Edge radius", 1.8, { min: 0, max: 5, step: 0.1, unit: "mm" });
const socketFaces = Param.number("Socket faces", 3, { min: 1, max: 5, integer: true });
const showTopSocket = Param.bool("Top socket", true);
const showCable = Param.bool("Show cable", true);
const showPlug = Param.bool("Show plug", true);
const showLogoMarks = Param.bool("Subtle logo marks", true);

const socketOuterDiameter = Param.number("Socket outer diameter", 66, { min: 54, max: 76, step: 0.5, unit: "mm" });
const socketWellDiameter = Param.number("Socket well diameter", 51, { min: 42, max: 60, step: 0.5, unit: "mm" });
const socketRecessDepth = Param.number("Socket recess depth", 4.2, { min: 2, max: 8, step: 0.1, unit: "mm" });
const socketWellDepth = Param.number("Socket well depth", 12, { min: 6, max: 20, step: 0.5, unit: "mm" });
const pinHoleDiameter = Param.number("Pin hole diameter", 4.8, { min: 3.5, max: 6.2, step: 0.1, unit: "mm" });
const pinSpacing = Param.number("Pin spacing", 19, { min: 15, max: 24, step: 0.1, unit: "mm" });
const earthClipLength = Param.number("Earth clip length", 15.5, { min: 10, max: 22, step: 0.5, unit: "mm" });
const earthClipWidth = Param.number("Earth clip width", 4.4, { min: 2.5, max: 7, step: 0.1, unit: "mm" });
const earthClipOffset = Param.number("Earth clip offset", 20.5, { min: 15, max: 26, step: 0.5, unit: "mm" });

const cableDiameter = Param.number("Cable diameter", 8.5, { min: 5, max: 13, step: 0.1, unit: "mm" });
const grommetDiameter = Param.number("Grommet diameter", 14, { min: 8, max: 22, step: 0.5, unit: "mm" });
const grommetProjection = Param.number("Grommet projection", 8, { min: 3, max: 16, step: 0.5, unit: "mm" });
const cableLeadLength = Param.number("Cable lead length", 35, { min: 15, max: 70, step: 1, unit: "mm" });
const coilRadius = Param.number("Cable coil radius", 54, { min: 34, max: 75, step: 1, unit: "mm" });
const coilGap = Param.number("Cable coil gap", 10, { min: 5, max: 18, step: 0.5, unit: "mm" });
const plugScale = Param.number("Plug scale", 1, { min: 0.7, max: 1.25, step: 0.05 });

const socketOuterR = socketOuterDiameter / 2;
const socketWellR = socketWellDiameter / 2;
const pinHoleR = pinHoleDiameter / 2;
const cableR = cableDiameter / 2;
const grommetR = grommetDiameter / 2;
const half = cubeSize / 2;
const socketZ = cubeSize / 2;
const faceEps = 0.8;

const bodyColor = "#151716";
const socketDark = "#080909";
const rubberColor = "#0b0c0b";
const contactColor = "#c7c4ba";
const logoColor = "#2a2d2a";

function matPlastic(roughness) {
  return { metalness: 0.08, roughness };
}

function matRubber() {
  return { metalness: 0, roughness: 0.96 };
}

function matContact() {
  return { metalness: 0.88, roughness: 0.28 };
}

function cylAlong(depth, radius, dir, at, segments) {
  return cylinder(depth, radius, undefined, segments || 48)
    .pointAlong(dir)
    .translate(at[0], at[1], at[2]);
}

function socketCutters(face) {
  const d = socketWellDepth + 3;
  const recess = cylAlong(socketRecessDepth + faceEps, socketOuterR, face.inward, face.origin, 80);
  const well = cylAlong(socketWellDepth + faceEps, socketWellR, face.inward, face.origin, 80);
  const pinDepth = d + 18;
  const pinA = cylAlong(pinDepth, pinHoleR, face.inward, [
    face.origin[0] + face.u[0] * (-pinSpacing / 2),
    face.origin[1] + face.u[1] * (-pinSpacing / 2),
    face.origin[2] + face.u[2] * (-pinSpacing / 2),
  ], 32);
  const pinB = cylAlong(pinDepth, pinHoleR, face.inward, [
    face.origin[0] + face.u[0] * (pinSpacing / 2),
    face.origin[1] + face.u[1] * (pinSpacing / 2),
    face.origin[2] + face.u[2] * (pinSpacing / 2),
  ], 32);

  const clipDepth = socketWellDepth + faceEps;
  const clipA = faceBox(earthClipWidth, clipDepth, earthClipLength, face, 0, earthClipOffset);
  const clipB = faceBox(earthClipWidth, clipDepth, earthClipLength, face, 0, -earthClipOffset);
  return union(recess, well, pinA, pinB, clipA, clipB);
}

function faceBox(widthU, depth, heightV, face, uOff, vOff) {
  // Builds a world-axis box for the five supported orthogonal socket faces.
  const c = [
    face.origin[0] + face.u[0] * uOff + face.v[0] * vOff + face.inward[0] * (depth / 2 - faceEps * 0.35),
    face.origin[1] + face.u[1] * uOff + face.v[1] * vOff + face.inward[1] * (depth / 2 - faceEps * 0.35),
    face.origin[2] + face.u[2] * uOff + face.v[2] * vOff + face.inward[2] * (depth / 2 - faceEps * 0.35),
  ];

  if (Math.abs(face.normal[1]) > 0.5) {
    return box(widthU, depth, heightV).placeReference("center", c);
  }
  if (Math.abs(face.normal[0]) > 0.5) {
    return box(depth, widthU, heightV).placeReference("center", c);
  }
  return box(widthU, heightV, depth).placeReference("center", c);
}

function socketContactParts(face, label) {
  const inset = socketWellDepth - 2.2;
  const base = [
    face.origin[0] + face.inward[0] * inset,
    face.origin[1] + face.inward[1] * inset,
    face.origin[2] + face.inward[2] * inset,
  ];
  const contactDepth = 3.4;
  const pinA = cylAlong(contactDepth, pinHoleR * 0.5, face.inward, [
    base[0] + face.u[0] * (-pinSpacing / 2),
    base[1] + face.u[1] * (-pinSpacing / 2),
    base[2] + face.u[2] * (-pinSpacing / 2),
  ], 20);
  const pinB = cylAlong(contactDepth, pinHoleR * 0.5, face.inward, [
    base[0] + face.u[0] * (pinSpacing / 2),
    base[1] + face.u[1] * (pinSpacing / 2),
    base[2] + face.u[2] * (pinSpacing / 2),
  ], 20);
  const clipA = faceBox(earthClipWidth * 0.42, 1.2, earthClipLength * 0.78, {
    ...face,
    origin: [
      face.origin[0] + face.inward[0] * (socketWellDepth - 1.0),
      face.origin[1] + face.inward[1] * (socketWellDepth - 1.0),
      face.origin[2] + face.inward[2] * (socketWellDepth - 1.0),
    ],
  }, 0, earthClipOffset);
  const clipB = faceBox(earthClipWidth * 0.42, 1.2, earthClipLength * 0.78, {
    ...face,
    origin: [
      face.origin[0] + face.inward[0] * (socketWellDepth - 1.0),
      face.origin[1] + face.inward[1] * (socketWellDepth - 1.0),
      face.origin[2] + face.inward[2] * (socketWellDepth - 1.0),
    ],
  }, 0, -earthClipOffset);
  return [
    { name: `${label} Pin Contact L`, shape: pinA, color: contactColor },
    { name: `${label} Pin Contact R`, shape: pinB, color: contactColor },
    { name: `${label} Earth Clip A`, shape: clipA, color: contactColor },
    { name: `${label} Earth Clip B`, shape: clipB, color: contactColor },
  ];
}

const faceSpecs = [
  {
    label: "Front Socket",
    normal: [0, 1, 0],
    inward: [0, -1, 0],
    u: [1, 0, 0],
    v: [0, 0, 1],
    origin: [0, half + faceEps, socketZ],
  },
  {
    label: "Left Socket",
    normal: [-1, 0, 0],
    inward: [1, 0, 0],
    u: [0, 1, 0],
    v: [0, 0, 1],
    origin: [-half - faceEps, 0, socketZ],
  },
  {
    label: "Right Socket",
    normal: [1, 0, 0],
    inward: [-1, 0, 0],
    u: [0, -1, 0],
    v: [0, 0, 1],
    origin: [half + faceEps, 0, socketZ],
  },
  {
    label: "Rear Socket",
    normal: [0, -1, 0],
    inward: [0, 1, 0],
    u: [-1, 0, 0],
    v: [0, 0, 1],
    origin: [0, -half - faceEps, socketZ],
  },
  {
    label: "Top Socket",
    normal: [0, 0, 1],
    inward: [0, 0, -1],
    u: [1, 0, 0],
    v: [0, 1, 0],
    origin: [0, 0, cubeSize + faceEps],
  },
];

const activeFaces = [];
for (let i = 0; i < Math.min(socketFaces, 4); i++) activeFaces.push(faceSpecs[i]);
if (showTopSocket) activeFaces.push(faceSpecs[4]);

let body = box(cubeSize, cubeSize, cubeSize);
if (edgeRadius > 0.05) body = fillet(body, edgeRadius);
body = body.placeReference("bottom", [0, 0, 0]);
const logoParts = [];

for (const f of activeFaces) {
  body = body.subtract(socketCutters(f));
}

const grommetZ = cubeSize * 0.30;
const grommetCut = cylAlong(34, cableR + 0.7, [0, 1, 0], [0, -half - faceEps, grommetZ], 40);
body = body.subtract(grommetCut);

if (showLogoMarks) {
  const markW = cubeSize * 0.018;
  const markH = cubeSize * 0.055;
  const markX = half - cubeSize * 0.18;
  const markZ = cubeSize * 0.24;
  const markY = half + 0.18;
  logoParts.push(box(markW, 0.28, markH).placeReference("center", [markX, markY, markZ]));
  logoParts.push(box(markW, 0.28, markH * 0.62).placeReference("center", [markX, markY, markZ + markH * 1.04]));
}

const parts = [];
parts.push({
  name: "Matte Cuboid Body",
  shape: body.color(bodyColor).material(matPlastic(0.88)),
  color: bodyColor,
});

for (let i = 0; i < logoParts.length; i++) {
  parts.push({
    name: `Low Contrast Logo Mark ${i + 1}`,
    shape: logoParts[i].color(logoColor).material(matPlastic(0.92)),
    color: logoColor,
  });
}

for (const f of activeFaces) {
  for (const part of socketContactParts(f, f.label)) {
    parts.push({
      name: part.name,
      shape: part.shape.color(part.color).material(matContact()),
      color: part.color,
    });
  }
}

const grommet = cylinder(grommetProjection, grommetR, grommetR * 0.86, 48)
  .pointAlong([0, -1, 0])
  .translate(0, -half - 0.6, grommetZ);
parts.push({
  name: "Soft Cable Grommet",
  shape: grommet.color(rubberColor).material(matRubber()),
  color: rubberColor,
});

if (showCable) {
  const cableY0 = -half - grommetProjection - 0.85;
  const lead = cylinder(cableLeadLength, cableR, undefined, 32)
    .pointAlong([0, -1, 0])
    .translate(0, cableY0, grommetZ);

  const coilCenterX = half + coilRadius * 0.70;
  const coilCenterY = cableY0 - cableLeadLength - coilRadius * 0.36;
  const coilZ = cableR + 0.6;
  const coilOuter = torus(coilRadius, cableR, 96).translate(coilCenterX, coilCenterY, coilZ);
  const coilInner = torus(Math.max(16, coilRadius - cableDiameter - coilGap), cableR, 96)
    .translate(coilCenterX + cableR * 0.75, coilCenterY - cableR * 0.4, coilZ + cableR * 1.72);
  const coilTail = cylinder(coilRadius * 0.72, cableR, undefined, 32)
    .pointAlong([1, 0, 0])
    .translate(coilCenterX + coilRadius * 0.56, coilCenterY + coilRadius * 0.30, coilZ);

  const bridgeStart = [0, cableY0 - cableLeadLength, grommetZ];
  const bridgeEnd = [coilCenterX - coilRadius - cableR * 0.25, coilCenterY + coilRadius * 0.16, coilZ + cableR * 0.35];
  const bridgeDir = [
    bridgeEnd[0] - bridgeStart[0],
    bridgeEnd[1] - bridgeStart[1],
    bridgeEnd[2] - bridgeStart[2],
  ];
  const bridgeLen = Math.sqrt(bridgeDir[0] ** 2 + bridgeDir[1] ** 2 + bridgeDir[2] ** 2);
  const leadToCoil = cylinder(bridgeLen, cableR, undefined, 32)
    .pointAlong(bridgeDir)
    .translate(bridgeStart[0], bridgeStart[1], bridgeStart[2]);

  const cableShape = union(lead, leadToCoil, coilOuter, coilInner, coilTail);
  parts.push({
    name: "Continuous Rubber Cable",
    shape: cableShape.color(rubberColor).material(matRubber()),
    color: rubberColor,
  });

  if (showPlug) {
    const plugBodyW = 54 * plugScale;
    const plugBodyD = 37 * plugScale;
    const plugBodyH = 18 * plugScale;
    const pinLen = 19 * plugScale;
    const pinR = 2.3 * plugScale;
    const plugBody = roundedRect(plugBodyW, plugBodyD, 3.2 * plugScale).extrude(plugBodyH);
    const plugNose = box(26 * plugScale, 20 * plugScale, 5 * plugScale)
      .placeReference("bottom", [0, 0, plugBodyH]);
    const plugShell = union(plugBody, plugNose);
    const plugPinA = cylinder(pinLen, pinR, undefined, 24)
      .pointAlong([0, 0, 1])
      .translate(-pinSpacing / 2, 0, plugBodyH + 4 * plugScale);
    const plugPinB = cylinder(pinLen, pinR, undefined, 24)
      .pointAlong([0, 0, 1])
      .translate(pinSpacing / 2, 0, plugBodyH + 4 * plugScale);
    const plugX = coilCenterX + coilRadius + 48;
    const plugY = coilCenterY + coilRadius * 0.28;
    const plugZ = cableR + 1.2;
    const plugRot = 18;

    parts.push({
      name: "Schuko Plug Body",
      shape: plugShell.rotateZ(plugRot).translate(plugX, plugY, plugZ).color("#101110").material(matPlastic(0.9)),
      color: "#101110",
    });
    parts.push({
      name: "Schuko Plug Pin L",
      shape: plugPinA.rotateZ(plugRot).translate(plugX, plugY, plugZ).color(contactColor).material(matContact()),
      color: contactColor,
    });
    parts.push({
      name: "Schuko Plug Pin R",
      shape: plugPinB.rotateZ(plugRot).translate(plugX, plugY, plugZ).color(contactColor).material(matContact()),
      color: contactColor,
    });
  }
}

scene({
  background: { top: "#bec7cf", bottom: "#59636d" },
  camera: { position: [320, -360, 220], target: [55, -28, 55], fov: 38 },
  environment: { preset: "studio", intensity: 0.18, background: false },
  lights: [
    { type: "ambient", color: "#f1e9dd", intensity: 0.18 },
    {
      type: "directional",
      position: [240, -320, 420],
      target: [20, -20, 55],
      color: "#ffe1bd",
      intensity: 3.0,
      castShadow: true,
    },
    {
      type: "directional",
      position: [-280, 180, 210],
      target: [0, 0, 60],
      color: "#d7e8fa",
      intensity: 0.9,
    },
    { type: "hemisphere", skyColor: "#d4dde5", groundColor: "#4c555e", intensity: 0.17 },
  ],
  ground: { visible: true, color: "#a8adb2", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.035, threshold: 0.95, radius: 0.25 },
    vignette: { darkness: 0.38, offset: 0.28 },
    grain: { intensity: 0.025 },
    toneMappingExposure: 1.08,
  },
});

return parts;
