// Analogue Pocket — CNC aluminum limited-edition handheld.
// Portrait body with square LCD on top half, D-pad + 4 face buttons on bottom,
// shoulder rocker on the left side, sandblasted aluminum finish.

// ─────────────────────────── Body shell ───────────────────────────
const bodyW       = Param.number("Body Width",         75,   { min: 60, max: 90,  unit: "mm" });
const bodyH       = Param.number("Body Height",       150,   { min: 120, max: 180, unit: "mm" });
const bodyT       = Param.number("Body Thickness",     20,   { min: 14, max: 28,  unit: "mm" });
const bodyCorner  = Param.number("Corner Radius",       4.5, { min: 2,  max: 8,   unit: "mm" });
const edgeRound   = Param.number("Edge Round",          1.8, { min: 0.5, max: 3,  unit: "mm" });

// ─────────────────────────── Screen ──────────────────────────────
const screenSize    = Param.number("Screen Size",      62,   { min: 40, max: 72,  unit: "mm" });
const screenInsetT  = Param.number("Screen Recess",     0.4, { min: 0.1, max: 1.5, unit: "mm" });
const screenTopGap  = Param.number("Screen Top Gap",    6.5, { min: 3,  max: 14,  unit: "mm" });

// ─────────────────────────── Controls ────────────────────────────
const dpadSize     = Param.number("D-pad Size",        24,   { min: 16, max: 32,  unit: "mm" });
const dpadArmW     = Param.number("D-pad Arm Width",    8.5, { min: 5,  max: 12,  unit: "mm" });
const dpadHeight   = Param.number("D-pad Height",       3.0, { min: 1.5, max: 5,  unit: "mm" });

const faceBtnDia   = Param.number("Face Button Dia",    8.5, { min: 5,  max: 14,  unit: "mm" });
const faceBtnH     = Param.number("Face Button Height", 2.4, { min: 1, max: 5,    unit: "mm" });
const faceBtnSpace = Param.number("Face Button Spacing", 22, { min: 12, max: 30,  unit: "mm" });

const smallBtnDia  = Param.number("Small Button Dia",   3.6, { min: 2, max: 6,    unit: "mm" });
const smallBtnH    = Param.number("Small Button Height", 0.8, { min: 0.3, max: 2, unit: "mm" });

// ─────────────────────────── Color / finish ──────────────────────
const finish = Param.choice("Finish", "graphite", ["aluminum", "graphite", "black", "silver"]);
const finishMap = {
  aluminum: '#b9bcc1',
  graphite: '#7a8089',
  black:    '#23252a',
  silver:   '#d2d5db',
};
const bodyColor   = finishMap[finish];
const buttonColor = finish === 'black' ? '#1d1f23' : bodyColor;
const screenBlack = '#0a0b0d';
const accent      = '#2a2c30';
const portsDark   = '#15171a';

// ─────────────────────────── Helpers ─────────────────────────────
function roundedBox(w, d, h, r) {
  // Build via 3D-rounded rectangle: a body slightly inset + chamfered top edges.
  // For a CAD/CNC-look, we use a tall extruded rounded rect from a 2D sketch.
  return rect(w, d, { round: r }).extrude(h);
}

// ─────────────────────────── Body ────────────────────────────────
// Build at origin centered in X/Y, base at Z=0.
let body = roundedBox(bodyW, bodyH, bodyT, bodyCorner);

// Soft fillet the long vertical edges (front-face perimeter + back perimeter)
body = fillet(body, edgeRound, { atZ: bodyT - 0.0, perpendicular: [0, 0, 1] });
body = fillet(body, edgeRound, { atZ: 0,         perpendicular: [0, 0, 1] });

// ─────────────────────────── Screen recess + glass ───────────────
const screenY  = bodyH / 2 - screenTopGap - screenSize / 2; // center of LCD in Y
const screenZ  = bodyT;                                     // front face
const recess = box(screenSize + 0.4, screenSize + 0.4, screenInsetT + 0.05)
  .translate(0, screenY, screenZ - screenInsetT);
body = difference(body, recess);

const screenGlass = box(screenSize, screenSize, screenInsetT)
  .translate(0, screenY, screenZ - screenInsetT + 0.001);

// ─────────────────────────── D-pad (cross) ───────────────────────
// D-pad on the lower-left of bottom half.
const lowerY = -bodyH / 2 + 38;          // center Y of D-pad
const dpadX  = -bodyW / 2 + 19;          // center X of D-pad
const armV = box(dpadArmW, dpadSize, dpadHeight);
const armH = box(dpadSize, dpadArmW, dpadHeight);
let dpad = union(armV, armH);
dpad = dpad.translate(dpadX, lowerY, bodyT);

// ─────────────────────────── 4 face buttons (diamond) ────────────
// Diamond cluster on the lower-right.
const faceCx = bodyW / 2 - 16;
const faceCy = -bodyH / 2 + 52;
const faceOffsets = [
  [0,  faceBtnSpace / 2],   // top
  [0, -faceBtnSpace / 2],   // bottom
  [-faceBtnSpace / 2, 0],   // left
  [ faceBtnSpace / 2, 0],   // right
];
const faceButtons = faceOffsets.map(([dx, dy]) => {
  const cap = cylinder(faceBtnH, faceBtnDia / 2, faceBtnDia / 2 - 0.4, 48)
    .translate(faceCx + dx, faceCy + dy, bodyT);
  return cap;
});
const faceButtonShape = union(...faceButtons);

// ─────────────────────────── Small buttons (start / select / home / lib) ─
// Three small buttons in a row just to the right of the D-pad.
const smallY = -bodyH / 2 + 26;
const smallStartX = dpadX + 17;
const smallBtns = [];
for (let i = 0; i < 3; i++) {
  const x = smallStartX + i * 7.5;
  // middle button slightly larger (home)
  const d = (i === 1) ? smallBtnDia * 1.3 : smallBtnDia;
  const h = (i === 1) ? smallBtnH * 1.4 : smallBtnH;
  smallBtns.push(
    cylinder(h, d / 2, d / 2 - 0.1, 32).translate(x, smallY, bodyT)
  );
}
const smallButtonShape = union(...smallBtns);

// ─────────────────────────── Side: volume rocker + power btn (left side) ─
// Rocker pill on left edge near top.
const rocker = box(2.4, 14, 5)
  .translate(-bodyW / 2 - 1.2 + 2.4 / 2, bodyH / 2 - 30, bodyT - 9);
const powerBtn = box(2.4, 7, 3.6)
  .translate(-bodyW / 2 - 1.2 + 2.4 / 2, bodyH / 2 - 50, bodyT - 9);

// Speaker grille slots on left side near the top
const grilleHoles = [];
for (let i = 0; i < 8; i++) {
  const y = bodyH / 2 - 8 - i * 3.0;
  const slot = cylinder(3.0, 0.9, 0.9, 24)
    .rotateY(90)
    .translate(-bodyW / 2 + 1.5, y, bodyT - 3.0);
  grilleHoles.push(slot);
}
body = difference(body, ...grilleHoles);

// Volume rocker pocket on body (subtle recess so the rocker sits in)
const rockerPocket = box(1.5, 15, 6)
  .translate(-bodyW / 2 + 0.75, bodyH / 2 - 30, bodyT - 9);
body = difference(body, rockerPocket);
const powerPocket = box(1.5, 8, 4.2)
  .translate(-bodyW / 2 + 0.75, bodyH / 2 - 50, bodyT - 9);
body = difference(body, powerPocket);

// ─────────────────────────── Cartridge slot (top edge) ───────────
// Game Boy-style cart slot pokes a recessed opening from the back-top edge.
const cartSlotW = 56;
const cartSlotD = 4;
const cartSlot = box(cartSlotW, cartSlotD, 2.0)
  .translate(0, bodyH / 2 - cartSlotD / 2 + 0.5, bodyT - 3.5);
body = difference(body, cartSlot);

// ─────────────────────────── Bottom edge ports ───────────────────
// USB-C centered, headphone left, link/microSD right.
const usbC = box(9, 4, 3.2)
  .translate(0, -bodyH / 2 + 2, bodyT / 2 - 1.6);
const usbCCutout = box(9.5, 5, 3.6)
  .translate(0, -bodyH / 2 + 1.5, bodyT / 2 - 1.8);
body = difference(body, usbCCutout);

const headphone = cylinder(6, 1.8, 1.8, 32)
  .rotateX(90)
  .translate(-bodyW / 2 + 9, -bodyH / 2 + 3, bodyT / 2);
body = difference(body, headphone);

const linkPort = box(8, 4, 2.4)
  .translate(bodyW / 2 - 9, -bodyH / 2 + 1.8, bodyT / 2 - 1.2);
body = difference(body, linkPort);

// ─────────────────────────── Back panel parting line (visual) ───
// Engraved line ~6mm below front face, showing the front housing / back housing seam.
const seamRing = box(bodyW + 0.5, bodyH + 0.5, 0.25)
  .translate(0, 0, bodyT - 7);
// Won't subtract this — it would slice the body. Use it as a thin painted ring.
// Instead, mark the seam as a tiny groove along the perimeter:
const seamGrooveOuter = rect(bodyW, bodyH, { round: bodyCorner }).extrude(0.25);
const seamGrooveInner = rect(bodyW - 0.5, bodyH - 0.5, { round: bodyCorner - 0.25 }).extrude(0.3);
const seamGroove = difference(seamGrooveOuter, seamGrooveInner).translate(0, 0, bodyT - 7);
body = difference(body, seamGroove);

// ─────────────────────────── Manufacturer mark (subtle plate) ───
// Tiny rectangular emblem near bottom-right (FPGA label area on real device)
const emblem = box(10, 4, 0.25)
  .translate(bodyW / 2 - 12, -bodyH / 2 + 9, bodyT + 0.01);

// ─────────────────────────── Scene ───────────────────────────────
scene({
  background: { top: '#c3ccd7', bottom: '#566474' },
  camera: { position: [180, -240, 200], target: [0, 0, bodyT / 2], fov: 32 },
  environment: { preset: 'studio', intensity: 0.18, background: false },
  lights: [
    { type: 'ambient',     color: '#efe7dc', intensity: 0.18 },
    { type: 'directional', position: [220, -280, 360], color: '#ffe2bf', intensity: 2.9, castShadow: true },
    { type: 'directional', position: [-220, 200, 200], color: '#d4e6fb', intensity: 0.85 },
    { type: 'hemisphere',  skyColor: '#c7d3df', groundColor: '#495463', intensity: 0.16 },
  ],
  ground: { visible: true, color: '#3c424a', height: -0.5, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.05, threshold: 0.93, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.33 },
    toneMappingExposure: 1.12,
  },
});

// ─────────────────────────── Materials ───────────────────────────
// Sandblasted aluminum: very matte, slight metalness.
const aluminumMat   = { metalness: 0.55, roughness: 0.72 };
const buttonMat     = { metalness: 0.45, roughness: 0.78 };
const screenMat     = { metalness: 0.05, roughness: 0.18, clearcoat: 1.0, clearcoatRoughness: 0.05 };
const darkPlasticMat = { metalness: 0.05, roughness: 0.85 };

return [
  { name: 'Body',          shape: body.material(aluminumMat),         color: bodyColor },
  { name: 'Screen Glass',  shape: screenGlass.material(screenMat),    color: screenBlack },
  { name: 'D-pad',         shape: dpad.material(buttonMat),           color: buttonColor },
  { name: 'Face Buttons',  shape: faceButtonShape.material(buttonMat), color: buttonColor },
  { name: 'Small Buttons', shape: smallButtonShape.material(buttonMat), color: buttonColor },
  { name: 'Volume Rocker', shape: rocker.material(buttonMat),         color: buttonColor },
  { name: 'Power Button',  shape: powerBtn.material(buttonMat),       color: buttonColor },
  { name: 'Emblem',        shape: emblem.material(darkPlasticMat),    color: accent },
];
