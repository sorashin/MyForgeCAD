// AIAIAI Tracks-style on-ear headphones (KiBiSi).
// Slim twin-strap headband, circular ear cups, matte black + aluminum bridge.

// ---------- Parameters ----------
const cupDia        = Param.number("Cup Diameter",      90,  { min: 70,  max: 110, step: 1,   unit: "mm" });
const cupThick      = Param.number("Cup Thickness",     16,  { min: 10,  max: 28,  step: 0.5, unit: "mm" });
const foamThick     = Param.number("Foam Thickness",    10,  { min: 6,   max: 16,  step: 0.5, unit: "mm" });
const foamDia       = Param.number("Foam Diameter",     76,  { min: 50,  max: 96,  step: 1,   unit: "mm" });

const headWidth     = Param.number("Head Width",        160, { min: 130, max: 200, step: 1,   unit: "mm" });
const headHeight    = Param.number("Head Height",       180, { min: 140, max: 220, step: 1,   unit: "mm" });

const strapWidth    = Param.number("Strap Width",       7,   { min: 3,   max: 12,  step: 0.5, unit: "mm" });
const strapThick    = Param.number("Strap Thickness",   2.0, { min: 1.0, max: 3.0, step: 0.1, unit: "mm" });
const strapGap      = Param.number("Strap Gap (front-back)", 18, { min: 8,  max: 32,  step: 1, unit: "mm" });

const bridgeLen     = Param.number("Bridge Length",     58,  { min: 30,  max: 90,  step: 1,   unit: "mm" });
const bridgeWidth   = Param.number("Bridge Width",      18,  { min: 10,  max: 28,  step: 0.5, unit: "mm" });
const bridgeThick   = Param.number("Bridge Thickness",  1.4, { min: 0.8, max: 3.0, step: 0.1, unit: "mm" });
const bridgeSlotLen = Param.number("Bridge Slot Length",36,  { min: 10,  max: 70,  step: 1,   unit: "mm" });
const bridgeSlotW   = Param.number("Bridge Slot Width", 3.2, { min: 1.5, max: 6,   step: 0.25, unit: "mm" });

const yokeLen       = Param.number("Yoke Length",       40,  { min: 24,  max: 70,  step: 1,   unit: "mm" });
const yokeWidth     = Param.number("Yoke Width",        9,   { min: 5,   max: 18,  step: 0.5, unit: "mm" });

const pivotDia      = Param.number("Pivot Disc Diameter", 18, { min: 10, max: 28,  step: 0.5, unit: "mm" });
const pivotThick    = Param.number("Pivot Disc Thickness", 3.5, { min: 2, max: 8,  step: 0.5, unit: "mm" });

const cableLen      = Param.number("Cable Length",      300, { min: 100, max: 500, step: 5,   unit: "mm" });
const cableDia      = Param.number("Cable Diameter",    2.6, { min: 1.5, max: 4,   step: 0.1, unit: "mm" });

const showCable     = Param.bool("Show Cable", true);

// ---------- Derived ----------
const cupR        = cupDia / 2;
const foamR       = foamDia / 2;
const headHalfW   = headWidth / 2;        // X distance from center to ear (and cup pivot)
const archAmpZ    = headHeight - cupR;    // peak height of band above ear center

// ---------- Materials ----------
const matMatteBlack = { metalness: 0.05, roughness: 0.72 };
const matAluminum   = { metalness: 0.85, roughness: 0.32 };
const matFoam       = { metalness: 0.0,  roughness: 0.95 };
const matRubber     = { metalness: 0.0,  roughness: 0.82 };

const colorBlack    = "#1c1c1c";
const colorBlackSat = "#0f0f0f";
const colorFoam     = "#171717";
const colorAlu      = "#b8bcc2";
const colorCable    = "#0d0d0d";

// ---------- Headband strap (one of the twin straps) ----------
// Build as a swept rectangular profile along a 3D elliptical arc in the XZ plane
// (Y is constant for each strap; the gap between front/rear straps is along Y).
function strapPath(yOff) {
  const N = 36;
  const a = headHalfW;     // X half-extent (ear-to-ear)
  const b = archAmpZ;      // Z amplitude (cup-center to apex)
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ang = Math.PI - t * Math.PI;       // 180° → 0°
    const x = a * Math.cos(ang);
    const z = b * Math.sin(ang);
    pts.push([x, yOff, z]);
  }
  return pts;
}

function buildStrap(yOff) {
  const pts = strapPath(yOff);
  const spine = spline3d(pts, { tension: 0.5 });
  // Rectangular cross-section: width along Y (so it reads as a flat strap from the side),
  // thickness along Z (radial-ish). rect() lives in XY with X = width, Y = height.
  // sweep aligns the profile's X with the path's "right" and Y with the path's "up".
  // We want the strap's broad face to face the user (i.e. perpendicular to Y).
  const profile = rect(strapThick, strapWidth);  // thin in radial, wide along axis-of-head
  return sweep(profile, spine, { samples: 50, up: [0, 1, 0] });
}

// ---------- Aluminum bridge ----------
function aluminumBridge() {
  const platePlan = roundedRect(bridgeLen, bridgeWidth, bridgeWidth / 2 - 0.5);
  const slotCut = slot(bridgeSlotLen, bridgeSlotW);
  const plateSketch = difference2d(platePlan, slotCut);
  // Extrude in Z, then lay it flat so its broad face points up (Z+) like a plate riding on top of the straps.
  let plate = plateSketch.extrude(bridgeThick);
  // Place at apex: centered in X, centered between the two straps in Y, just above the strap apex.
  plate = plate.translate(0, 0, archAmpZ + strapThick / 2 - 0.2);
  return plate;
}

// ---------- Lower yoke (slim strap from headband pivot down to cup) ----------
function yokeStrap(side) {
  // Two thin vertical struts hanging from the strap ends down to the cup pivot.
  // Build a slim flat strap in XZ, thickness along Y.
  const yokePlan = roundedRect(yokeWidth, yokeLen, yokeWidth / 2);
  let yoke = yokePlan.extrude(strapThick);
  // Extrude is +Z (thickness 0 to strapThick) but plan is in XY.
  // We want: a strip with X = yokeWidth, Z direction = yokeLen, thickness along Y.
  // Rotate -90° about X: world +Y → world +Z, world +Z → world -Y.
  yoke = yoke.rotate([1, 0, 0], -90);
  // Now yoke sits hanging downward (-Y after rotation? let's center it):
  // After rotate, the original (XY) plane sketch is now in (X, -Z) plane, thickness along -Y.
  // The plan was centered at origin so it sits centered in X, in Z = [-yokeLen/2, yokeLen/2],
  // and Y = [-strapThick, 0]. We want the yoke top to attach near strap end, bottom at cup pivot.
  // Translate so top of yoke is at the strap-Y range and apex of cup.
  return yoke.translate(side * headHalfW, 0, -yokeLen / 2);
}

// ---------- Ear cup ----------
function earCup(side) {
  // The cup is a disc whose axis points along world X (inward toward head).
  // cylinder() axis is along Z, so build then rotate.
  const cupShell = cylinder(cupThick, cupR)
    .translate(0, 0, -cupThick / 2);  // center on Z
  // Slightly rounded back face
  const cupFilleted = fillet(cupShell, 3.5, { convex: true });
  // Foam pad sits on the inboard face (toward the head). We'll place it +Z relative to cup center.
  const foam = cylinder(foamThick, foamR)
    .translate(0, 0, cupThick / 2 - 0.2);
  // Soften foam edges
  const foamSoft = fillet(foam, 3.0, { convex: true });
  // Group then rotate so the disc axis (+Z) points toward +X (inboard for the LEFT cup if side=-1
  // we want the foam facing +X; rotate so +Z → +X means rotate +90° about Y axis).
  const cupGroup = group(
    { name: "Shell", shape: cupFilleted.color(colorBlack).material(matMatteBlack) },
    { name: "Pad",   shape: foamSoft.color(colorFoam).material(matFoam) },
  );
  // For side = -1 (left cup at x = -headHalfW), foam should face +X (toward head center)
  // For side = +1 (right cup at x = +headHalfW), foam should face -X
  // side = -1 → rotate so cup +Z → +X: rotateY(+90°)
  // side = +1 → rotate so cup +Z → -X: rotateY(-90°)
  const rotated = cupGroup.rotate([0, 1, 0], side > 0 ? -90 : 90);
  // Place at ear position (slightly outboard of headHalfW so the band can extend to the pivot point)
  const cupX = side * (headHalfW + cupThick / 2 + 1);
  return rotated.translate(cupX, 0, 0);
}

// ---------- Pivot disc (the AIAIAI-logo cap that the yoke pivots on) ----------
function pivotDisc(side) {
  // A small disc on the outboard face of the cup
  const disc = cylinder(pivotThick, pivotDia / 2)
    .translate(0, 0, -pivotThick / 2)
    .rotate([0, 1, 0], side > 0 ? -90 : 90);
  // Position on the outboard side (further out than the cup's outer face)
  const xOut = side * (headHalfW + cupThick + pivotThick / 2 + 1.5);
  return disc.translate(xOut, 0, 0);
}

// ---------- Detachable cable ----------
function cable(side = -1) {
  // Cable exits from the bottom of the left cup and drapes downward
  const sx = side * (headHalfW + cupThick / 2 + 2);
  const ctrl = [
    [sx,            6,                  -cupR + 4],
    [sx - 4 * side, 8,                  -cupR - 30],
    [sx + 6 * side, 14,                 -cupR - 90],
    [sx - 2 * side, 6,                  -cupR - 160],
    [sx + 4 * side, -2,                 -cupR - cableLen],
  ];
  const spine = spline3d(ctrl, { tension: 0.5 });
  return sweep(circle2d(cableDia / 2, 12), spine, { samples: 36 });
}

// ---------- Build ----------
const strapFront = buildStrap(-strapGap / 2).color(colorBlack).material(matMatteBlack);
const strapRear  = buildStrap( strapGap / 2).color(colorBlack).material(matMatteBlack);

const bridge = aluminumBridge().color(colorAlu).material(matAluminum);

const yokeL = yokeStrap(-1).color(colorBlackSat).material(matMatteBlack);
const yokeR = yokeStrap(+1).color(colorBlackSat).material(matMatteBlack);

const cupL = earCup(-1);
const cupR_ = earCup(+1);

const pivotL = pivotDisc(-1).color(colorBlackSat).material({ metalness: 0.1, roughness: 0.6 });
const pivotR = pivotDisc(+1).color(colorBlackSat).material({ metalness: 0.1, roughness: 0.6 });

const parts = [
  { name: "Headband Front Strap", shape: strapFront },
  { name: "Headband Rear Strap",  shape: strapRear  },
  { name: "Aluminum Bridge",      shape: bridge     },
  { name: "Left Yoke",            shape: yokeL      },
  { name: "Right Yoke",           shape: yokeR      },
  { name: "Left Ear Cup",         shape: cupL       },
  { name: "Right Ear Cup",        shape: cupR_      },
  { name: "Left Pivot Disc",      shape: pivotL     },
  { name: "Right Pivot Disc",     shape: pivotR     },
];

if (showCable) {
  parts.push({
    name: "Cable",
    shape: cable(-1).color(colorCable).material(matRubber),
  });
}

// ---------- Scene ----------
scene({
  background: { top: "#d8dde3", bottom: "#5b6470" },
  camera: { position: [380, -460, 200], target: [0, 0, 50], fov: 38 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient",     color: "#efe7dc", intensity: 0.18 },
    { type: "directional", position: [240, -300, 380], color: "#ffe2bf", intensity: 2.9, castShadow: true },
    { type: "directional", position: [-260, 220, 200], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere",  skyColor: "#c7d3df", groundColor: "#4a5360", intensity: 0.16 },
  ],
  ground: { visible: true, color: "#1d2026", height: -260, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.05, threshold: 0.93, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

return parts;
