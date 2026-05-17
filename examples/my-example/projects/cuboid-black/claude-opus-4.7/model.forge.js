// Kord-inspired compact cube power outlet.
// Matte-black aluminum cube body with Schuko (CEE 7/3) sockets on three faces
// and a soft rubber cable exit on the fourth side.

const cubeSize = param("Cube size", 120, { min: 80, max: 160, unit: "mm" });
const cornerR = param("Edge fillet radius", 1.6, { min: 0.0, max: 6.0, unit: "mm" });
const socketsCount = param("Socket faces", 3, { min: 1, max: 4, step: 1 });
const showCable = boolParam("Show cable", true);
const showPlug = boolParam("Show Schuko plug", true);

// Schuko socket dimensions (CEE 7/3 / Type F).
const socketOuterR = 33.5;   // recess outer radius
const socketRecessDepth = 4.6;
const wellR = 25.5;          // central well radius (inside the recess)
const wellDepth = 12.5;      // depth of the round well
const pinHoleR = 2.4;        // 4.8mm dia round pin holes
const pinSpacing = 19;       // distance between pin centers (Schuko ~19mm)
const earthClipLen = 16;     // length of side earth-clip groove
const earthClipWidth = 4.5;
const earthClipDepth = 2.0;
const earthSlotInsetFromCenter = 21; // measured from socket center to clip slot center

const cableR = 4.2;          // ~8.4mm dia rubber cord
const cableExitR = 5.0;      // strain-relief grommet radius
const cableExitH = 8;        // grommet protrusion length

// Plug dimensions (Schuko angled plug, sketch only).
const plugBodyW = 56;
const plugBodyD = 38;
const plugBodyH = 18;
const plugPinLen = 19;
const plugPinR = 2.35;

// ------------------------------------------------------------------
// Body — matte aluminum cube, centered on origin XY, base at z=0.
// ------------------------------------------------------------------
let body = box(cubeSize, cubeSize, cubeSize);

// Subtle edge fillet — keep small for performance.
if (cornerR > 0.05) {
  body = fillet(body, cornerR);
}

// ------------------------------------------------------------------
// Socket cutter — a reusable cutter built oriented along +Y,
//                 so it can be rotated onto any side face.
// ------------------------------------------------------------------
function socketCutter() {
  // Build along Y: socket faces toward +Y (we then rotate copies for other faces).
  // The cutter origin sits at the face plane (y=0), going into -Y (into the cube).

  // Outer flat recess disc (shallow ring around the well).
  const recess = cylinder(socketRecessDepth, socketOuterR)
    .rotate([1, 0, 0], 90)              // axis -> +Y
    .translate(0, socketRecessDepth / 2, 0);

  // Round well for the plug face.
  const well = cylinder(wellDepth, wellR)
    .rotate([1, 0, 0], 90)
    .translate(0, wellDepth / 2, 0);

  // Two pin holes (clear through any sane wall).
  const pinDepth = 40;
  const pinL = cylinder(pinDepth, pinHoleR)
    .rotate([1, 0, 0], 90)
    .translate(-pinSpacing / 2, pinDepth / 2, 0);
  const pinR = cylinder(pinDepth, pinHoleR)
    .rotate([1, 0, 0], 90)
    .translate(pinSpacing / 2, pinDepth / 2, 0);

  // Two earth-clip side grooves (top & bottom of socket well).
  const groove = box(earthClipWidth, earthClipDepth + wellDepth, earthClipLen)
    .placeReference('center', [0, (earthClipDepth + wellDepth) / 2 - earthClipDepth, 0]);
  const grooveTop = groove.translate(0, 0, earthSlotInsetFromCenter - earthClipLen / 2);
  const grooveBot = groove.translate(0, 0, -(earthSlotInsetFromCenter - earthClipLen / 2));

  return union(recess, well, pinL, pinR, grooveTop, grooveBot);
}

// Place the cube around the origin (center on XY, base at z=0).
body = body.placeReference('center', [0, 0, cubeSize / 2]);

const half = cubeSize / 2;
const socketZ = cubeSize / 2; // vertical center of each face

// Order: +Y (front), -X (left), +X (right), top (+Z).
// We render `socketsCount` of these starting from +Y, going around.
const facePlacements = [
  { rotZ: 0,   pos: [0, +half, socketZ] },                     // +Y
  { rotZ: 90,  pos: [-half, 0, socketZ] },                     // -X
  { rotZ: -90, pos: [+half, 0, socketZ] },                     // +X
  { rotZ: 0,   pos: [0, 0, cubeSize], rotX: -90 },             // +Z (top)
];

for (let i = 0; i < socketsCount; i++) {
  const f = facePlacements[i];
  let cutter = socketCutter();
  if (f.rotX) cutter = cutter.rotate([1, 0, 0], f.rotX);
  cutter = cutter.rotate([0, 0, 1], f.rotZ).translate(...f.pos);
  body = difference(body, cutter);
}

// ------------------------------------------------------------------
// Cable exit grommet on the -Y face, lower third.
// ------------------------------------------------------------------
const grommetZ = cubeSize * 0.30;
const grommetCutter = cylinder(40, cableR + 0.4)
  .rotate([1, 0, 0], 90)
  .translate(0, -half + 20, grommetZ);
body = difference(body, grommetCutter);

const grommet = cylinder(cableExitH, cableExitR, cableExitR * 0.85)
  .rotate([1, 0, 0], 90)
  .translate(0, -half - cableExitH / 2 + 0.5, grommetZ);

// ------------------------------------------------------------------
// Brand mark — small recessed dot on the -Y face (above grommet).
// ------------------------------------------------------------------
const brandDot = cylinder(0.4, 1.6)
  .rotate([1, 0, 0], -90)
  .translate(0, -half + 0.2, grommetZ + 22);
body = difference(body, brandDot);

// ------------------------------------------------------------------
// Cable — coiled rubber cord. Built as a piecewise tube approximation
//         using a torus-like loop + lead-in segment.
// ------------------------------------------------------------------
const parts = [];

const bodyColor = '#161616';
const bodyMat = { metalness: 0.18, roughness: 0.82 };
parts.push({
  name: 'Cube Body',
  shape: body.color(bodyColor).material(bodyMat),
});

const grommetColor = '#0e0e0e';
parts.push({
  name: 'Cable Grommet',
  shape: grommet.color(grommetColor).material({ metalness: 0.0, roughness: 0.95 }),
});

if (showCable) {
  // Lead-in stub from grommet to coil entry.
  const leadLen = 30;
  const lead = cylinder(leadLen, cableR)
    .rotate([1, 0, 0], 90)
    .translate(0, -half - cableExitH - leadLen / 2, grommetZ);

  // Coiled loop on the ground (1.5 turns approximated with two tori at offset).
  const coilR = 55;      // radius of the coil
  const coilCenter = [coilR + 18, -half - cableExitH - leadLen - 4, coilR * 0.05 + cableR];

  const coil1 = torus(coilR, cableR)
    .translate(coilCenter[0], coilCenter[1], cableR);
  // Slightly offset second loop to suggest two passes of cable.
  const coil2 = torus(coilR - cableR * 2.2, cableR)
    .translate(coilCenter[0] + 4, coilCenter[1] - 2, cableR + cableR * 1.9);

  // Bridge from lead end to coil (short arc approximation with a small torus quadrant).
  const bridge = torus(18, cableR)
    .rotate([0, 1, 0], 90)
    .translate(0, -half - cableExitH - leadLen, cableR);

  parts.push({
    name: 'Cable Lead',
    shape: lead.color('#0c0c0c').material({ metalness: 0.0, roughness: 0.92 }),
  });
  parts.push({
    name: 'Cable Bridge',
    shape: bridge.color('#0c0c0c').material({ metalness: 0.0, roughness: 0.92 }),
  });
  parts.push({
    name: 'Cable Coil A',
    shape: coil1.color('#0c0c0c').material({ metalness: 0.0, roughness: 0.92 }),
  });
  parts.push({
    name: 'Cable Coil B',
    shape: coil2.color('#0c0c0c').material({ metalness: 0.0, roughness: 0.92 }),
  });

  if (showPlug) {
    // Schuko angled plug at end of coil.
    let plugBody = fillet(box(plugBodyW, plugBodyD, plugBodyH), 3.5);
    plugBody = plugBody.placeReference('center', [0, 0, plugBodyH / 2]);
    const pin1 = cylinder(plugPinLen, plugPinR, plugPinR, 24)
      .translate(-pinSpacing / 2, 0, plugBodyH);
    const pin2 = cylinder(plugPinLen, plugPinR, plugPinR, 24)
      .translate(pinSpacing / 2, 0, plugBodyH);

    const plugX = coilCenter[0] + coilR + 6;
    const plugY = coilCenter[1] + 10;
    const plugZ = cableR;

    parts.push({
      name: 'Plug Body',
      shape: plugBody
        .rotate([0, 0, 1], 15)
        .translate(plugX, plugY, plugZ)
        .color('#111111')
        .material({ metalness: 0.05, roughness: 0.85 }),
    });
    const pinMat = { metalness: 0.9, roughness: 0.3 };
    parts.push({
      name: 'Plug Pin L',
      shape: pin1
        .rotate([0, 0, 1], 15)
        .translate(plugX, plugY, plugZ)
        .color('#c8c8c8')
        .material(pinMat),
    });
    parts.push({
      name: 'Plug Pin R',
      shape: pin2
        .rotate([0, 0, 1], 15)
        .translate(plugX, plugY, plugZ)
        .color('#c8c8c8')
        .material(pinMat),
    });
  }
}

// ------------------------------------------------------------------
// Scene — matte industrial hero shot.
// ------------------------------------------------------------------
scene({
  background: { top: '#c3ccd7', bottom: '#566474' },
  camera: { position: [320, -380, 240], target: [0, 0, 60], fov: 38 },
  environment: { preset: 'studio', intensity: 0.2, background: false },
  lights: [
    { type: 'ambient', color: '#efe7dc', intensity: 0.16 },
    {
      type: 'directional',
      position: [260, -320, 420],
      target: [0, 0, 60],
      color: '#ffe2bf',
      intensity: 2.9,
      castShadow: true,
    },
    {
      type: 'directional',
      position: [-260, 210, 220],
      target: [0, 0, 60],
      color: '#d4e6fb',
      intensity: 0.85,
    },
    {
      type: 'hemisphere',
      skyColor: '#c7d3df',
      groundColor: '#495463',
      intensity: 0.15,
    },
  ],
  ground: { visible: true, color: '#aab0b8', height: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

return parts;
