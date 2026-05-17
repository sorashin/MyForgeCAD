// Herman Miller Powerbox — portable 4-port USB shared power brick
// Based on Future Facility / Herman Miller Powerbox reference images.

// --- Parameters ----------------------------------------------------------

const W = Param.number("Width",  100, { min: 80,  max: 140, unit: "mm" });
const D = Param.number("Depth",   60, { min: 45,  max: 80,  unit: "mm" });
const H = Param.number("Height", 130, { min: 100, max: 170, unit: "mm" });

const CORNER_R   = Param.number("Corner radius",        9,  { min: 2,  max: 18, unit: "mm" });

const HANDLE_W   = Param.number("Handle width",   16, { min: 8,  max: 30, unit: "mm" });
const HANDLE_H   = Param.number("Handle height",  62, { min: 30, max: 100, unit: "mm" });
const HANDLE_R   = Param.number("Handle radius",   8, { min: 4,  max: 16, unit: "mm" });
const HANDLE_Y   = Param.number("Handle pos Z",   78, { min: 40, max: 130, unit: "mm" });

const FACE_INSET    = Param.number("Face inset",     2.5, { min: 0.5, max: 5,  unit: "mm" });
const FACE_DEPTH    = Param.number("Face depth",     0.8, { min: 0.2, max: 2,  unit: "mm" });

const PORT_W        = Param.number("Port width",     11, { min: 7,  max: 14, unit: "mm" });
const PORT_H        = Param.number("Port height",     8, { min: 4,  max: 11, unit: "mm" });
const PORT_DEPTH    = Param.number("Port depth",    2.5, { min: 1,  max: 5,  unit: "mm" });
const PORT_R        = Param.number("Port radius",   1.2, { min: 0.3, max: 3, unit: "mm" });
const PORT_GAP      = Param.number("Port spacing", 14.5, { min: 9,  max: 20, unit: "mm" });

const BUTTON_R      = Param.number("Button radius",  4,  { min: 2,  max: 7,  unit: "mm" });
const BUTTON_DEPTH  = Param.number("Button depth",  0.6, { min: 0.2, max: 1.5, unit: "mm" });

const SHOW_GHOST    = Param.bool("Show interior ghost", false);

// --- Body ----------------------------------------------------------------

// Soft-rounded brick body: rect XY with corner radius. Top/bottom horizontal
// edges are kept sharp because filleting them after a curved-corner extrude
// creates kernel topology loops. The matte material softens the look enough.
function softBody(w, d, h, cornerR) {
  return roundedRect(w, d, cornerR).extrude(h);
}

let body = softBody(W, D, H, CORNER_R);

// --- Handles (through-cut on both long sides) ----------------------------

// Build a stadium-shaped (capsule) cutter that goes all the way through the body in Y.
// Stadium = rect with full corner-rounding => width minus 2*R rectangle + two semicircles.
// roundedRect extrudes along +Z; rotate -90° about X so the extrusion goes along +Y,
// then place it so it overshoots both faces of the body in Y for a clean cut.
const handleCutter = roundedRect(HANDLE_W, HANDLE_H, HANDLE_R)
  .extrude(D + 20)
  .rotateX(-90)
  .translate(0, -(D / 2) - 10, HANDLE_Y);

body = difference(body, handleCutter);

// --- Recessed top face plate (slight inset where the ports + button live) ------

const topPlate = roundedRect(W - FACE_INSET * 2, D - FACE_INSET * 2, Math.max(0.5, CORNER_R - FACE_INSET))
  .extrude(FACE_DEPTH + 0.6)
  .translate(0, 0, H - FACE_DEPTH);

body = difference(body, topPlate);

// --- USB ports on the top (4 in a row toward the front edge) ----------------

const portsTotal = 4;
const portsCenterX = ((portsTotal - 1) * PORT_GAP) / 2;

function portCutter() {
  return roundedRect(PORT_W, PORT_H, PORT_R)
    .extrude(PORT_DEPTH + 1.5);
}

const portCuts = [];
for (let i = 0; i < portsTotal; i++) {
  const x = -portsCenterX + i * PORT_GAP + 10; // shifted right; left side reserved for button
  const cut = portCutter().translate(x, 0, H - PORT_DEPTH);
  portCuts.push(cut);
}
body = difference(body, union(portCuts));

// --- Power button (small recessed circle, left of the ports on the top) -----

const buttonRecess = cylinder(BUTTON_DEPTH + 0.4, BUTTON_R + 0.4)
  .translate(-(W / 2) + 12, 0, H - BUTTON_DEPTH);

body = difference(body, buttonRecess);

// The actual button "pip" — flush, slightly proud cap that sits in the recess.
const buttonCap = cylinder(BUTTON_DEPTH - 0.1, BUTTON_R)
  .translate(-(W / 2) + 12, 0, H - BUTTON_DEPTH - 0.05);

// --- Battery LED indicator dots (four small dots between button and ports) --

const ledDots = [];
const ledCount = 4;
const ledGap = 3.6;
const ledOriginX = -(W / 2) + 12 + BUTTON_R + 8;
for (let i = 0; i < ledCount; i++) {
  ledDots.push(
    cylinder(0.3, 0.45).translate(ledOriginX + i * ledGap, 0, H - 0.25)
  );
}

// --- Subtle parting line / band around the body (just below the handle) -----

// Make a thin recessed groove that wraps the body roughly mid-height. This sells
// the two-piece molded enclosure look from the reference images.
const grooveZ = H * 0.45;
const grooveOuter = roundedRect(W + 1, D + 1, CORNER_R).extrude(0.5)
  .translate(0, 0, grooveZ);
const grooveInner = roundedRect(W - 0.6, D - 0.6, CORNER_R).extrude(0.5)
  .translate(0, 0, grooveZ);
const groove = difference(grooveOuter, grooveInner);
body = difference(body, groove);

// --- Tiny rubber feet on the bottom ----------------------------------------

const FOOT_R = 3.5;
const FOOT_H = 1.2;
const footInset = 10;
const footPositions = [
  [ W/2 - footInset,  D/2 - footInset],
  [-W/2 + footInset,  D/2 - footInset],
  [ W/2 - footInset, -D/2 + footInset],
  [-W/2 + footInset, -D/2 + footInset],
];
const feet = footPositions.map(([x, y]) =>
  cylinder(FOOT_H, FOOT_R).translate(x, y, -FOOT_H * 0.5)
);

// --- Optional ghost interior (battery cells) -------------------------------

let ghost = null;
if (SHOW_GHOST) {
  const cellW = W - 14;
  const cellD = D - 14;
  const cellH = (HANDLE_Y - HANDLE_H / 2) - 14;
  ghost = box(cellW, cellD, cellH)
    .placeReference("bottom", [0, 0, 10])
    .color("#3a3f47")
    .material({ opacity: 0.55, metalness: 0.05, roughness: 0.6 });
}

// --- Materials --------------------------------------------------------------

const bodyColor   = "#1c1d20";   // matte near-black charcoal
const accentColor = "#2a2c30";   // very slightly lighter top inset / button
const footColor   = "#101012";   // dark rubber
const dotColor    = "#e6e6e6";   // tiny LED dots, slightly cool white

const matteBody    = { metalness: 0.04, roughness: 0.78 };
const matteAccent  = { metalness: 0.05, roughness: 0.72 };
const rubberMat    = { metalness: 0.0,  roughness: 0.92 };
const ledMat       = { metalness: 0.0,  roughness: 0.35, emissive: "#ffffff", emissiveIntensity: 0.15 };

// --- Scene ------------------------------------------------------------------

scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera:     { position: [240, -280, 200], target: [0, 0, H * 0.55], fov: 36 },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    { type: "directional", position: [260, -320, 420], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-260, 210, 220], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere",   skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.15 },
  ],
  ground: { visible: true, color: "#a6afba", height: -1.2, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
});

// Optional matte studio plinth.
const stage = cylinder(2, 180)
  .translate(0, 0, -3.2)
  .color("#8b97a4")
  .material({ metalness: 0.04, roughness: 0.78 });
mock(stage, "StudioPlinth");

// --- Assemble parts ---------------------------------------------------------

const parts = [
  { name: "Body",      shape: body.color(bodyColor).material(matteBody) },
  { name: "ButtonCap", shape: buttonCap.color(accentColor).material(matteAccent) },
  ...ledDots.map((d, i) => ({
    name: `LED ${i + 1}`,
    shape: d.color(dotColor).material(ledMat),
  })),
  ...feet.map((f, i) => ({
    name: `Foot ${i + 1}`,
    shape: f.color(footColor).material(rubberMat),
  })),
];

if (ghost) parts.push({ name: "BatteryGhost", shape: ghost });

return parts;
