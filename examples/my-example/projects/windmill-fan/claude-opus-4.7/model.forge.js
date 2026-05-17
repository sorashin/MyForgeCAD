// Branch Creative-style desktop windmill fan
// ~250mm circular grille, slim stand, round base, two-tone palette.
// Stack (along fan axis, +Z while constructing the head):
//   z=0..grilleD           : grille ring + radial fin grille + hub cap (visible face)
//   z=grilleD..grilleD+midD: chunkier middle housing
//   z=...+rearD            : small rear motor housing with one button
// After construction the head is rotated -90 about X so its axis becomes world +Y.

// ---------- Parameters ----------
const grilleOD       = Param.number("Grille Outer Diameter", 250, { min: 200, max: 320 });
const grilleD        = Param.number("Grille Depth", 26,         { min: 18, max: 40 });
const grilleRingW    = Param.number("Grille Ring Wall", 10,     { min: 6,  max: 18 });
const barCount       = Param.number("Grille Fin Count", 64,     { min: 32, max: 120, integer: true });
const barAngularT    = Param.number("Grille Fin Thickness", 1.8,{ min: 1.2, max: 3.5 });
const hubDia         = Param.number("Front Hub Diameter", 78,   { min: 50, max: 110 });
const hubProud       = Param.number("Front Hub Proud", 3,       { min: 1,  max: 8 });
const midDia         = Param.number("Mid Housing Diameter", 200,{ min: 150, max: 240 });
const midDepth       = Param.number("Mid Housing Depth", 28,    { min: 18, max: 50 });
const rearDia        = Param.number("Rear Motor Diameter", 120, { min: 80, max: 170 });
const rearDepth      = Param.number("Rear Motor Depth", 22,     { min: 12, max: 40 });
const bladeCount     = Param.number("Impeller Blade Count", 4,  { min: 3, max: 8, integer: true });
const bladeLen       = Param.number("Blade Length", 70,         { min: 40, max: 100 });
const bladeWidth     = Param.number("Blade Chord", 26,          { min: 14, max: 45 });
const bladeThick     = Param.number("Blade Thickness", 2.4,     { min: 1.8, max: 4.0 });
const bladePitch     = Param.number("Blade Pitch (deg)", 28,    { min: 10, max: 45 });
const standPostH     = Param.number("Stand Post Height", 40,    { min: 25, max: 80 });
const standPostDia   = Param.number("Stand Post Diameter", 32,  { min: 22, max: 45 });
// headLift = extra distance from post top to bottom of grille rim (lifts the entire head).
// Grille bottom Z = baseH + standPostH + headLift; post embeds into mid-housing above this.
const headLift       = Param.number("Head Lift Above Post", 6,  { min: 0, max: 40 });
const baseDia        = Param.number("Base Diameter", 170,       { min: 130, max: 220 });
const baseH          = Param.number("Base Height", 18,          { min: 12, max: 28 });
const buttonDia      = Param.number("Rear Button Diameter", 14, { min: 8, max: 22 });

const accentColor    = Param.choice("Accent Color", "white",
  ["white", "navy", "coral", "forest", "yellow"]);
const showImpeller   = Param.bool("Show Impeller", true);

// ---------- Color palette ----------
const palettes = {
  white:  { shell: "#f3f4f4", grey: "#c9ccd1", hubCap: "#fafafa", impeller: "#b8bcc1", button: "#dddee0" },
  navy:   { shell: "#3b4d77", grey: "#2c3d63", hubCap: "#445b88", impeller: "#314168", button: "#2a3a5c" },
  coral:  { shell: "#e3614b", grey: "#c9523f", hubCap: "#ea7560", impeller: "#bd4a39", button: "#b8473a" },
  forest: { shell: "#4e7263", grey: "#3f5d52", hubCap: "#587f6f", impeller: "#3a574c", button: "#365245" },
  yellow: { shell: "#e8c456", grey: "#cca73f", hubCap: "#f0cf6a", impeller: "#c39e3a", button: "#b8943a" },
};
const C = palettes[accentColor];

const matShell = { roughness: 0.78, metalness: 0.02 };
const matFins  = { roughness: 0.85, metalness: 0.02 };
const matCap   = { roughness: 0.70, metalness: 0.02 };

// ---------- Z layout for head (construction with axis = +Z) ----------
const zGrilleFront = 0;
const zGrilleBack  = grilleD;
const zMidFront    = zGrilleBack;
const zMidBack     = zMidFront + midDepth;
const zRearFront   = zMidBack;
const zRearBack    = zRearFront + rearDepth;

// ---------- Grille outer ring (the visible front bezel) ----------
const ringOuter = cylinder(grilleD, grilleOD / 2, grilleOD / 2, 96);
const ringInner = cylinder(grilleD + 2, grilleOD / 2 - grilleRingW, grilleOD / 2 - grilleRingW, 96)
  .translate(0, 0, -1);
const grilleRing = difference(ringOuter, ringInner)
  .color(C.shell).material(matShell);
const grilleRingF = fillet(grilleRing, 2.5, { atZ: grilleD, convex: true });

// ---------- Radial fin grille (vertical fins lying in radial planes) ----------
// Each fin = thin box whose long axis = radial X, thickness = Y (angular),
// height = Z (depth into grille).  circularPattern duplicates around Z axis.
const finInnerR = hubDia / 2 + 2;                 // start just outside hub
const finOuterR = grilleOD / 2 - grilleRingW * 0.4;
const finLen    = finOuterR - finInnerR;
const finH      = grilleD * 0.88;
const fin = box(finLen, barAngularT, finH)
  .placeReference('center', [finInnerR + finLen / 2, 0, finH / 2 + grilleD * 0.06])
  .color(C.grey).material(matFins);
const fins = circularPattern(fin, barCount);

// ---------- Front hub cap (white disc with subtle wave grooves) ----------
const hubCap = cylinder(hubProud + 2, hubDia / 2, hubDia / 2 - 1.2, 64)
  .translate(0, 0, grilleD * 0.18)
  .color(C.hubCap).material(matCap);
const waveBar = box(hubDia * 0.32, 1.2, 0.5)
  .placeReference('center', [0, 0, grilleD * 0.18 + hubProud + 2 - 0.25]);
const waves = union(
  waveBar.translate(0, -3.0, 0),
  waveBar.translate(0,  0.0, 0),
  waveBar.translate(0,  3.0, 0),
);
const hubCapMarked = difference(hubCap, waves);

// ---------- 4-blade impeller (sits inside mid-housing volume, behind the grille fins) ----------
// Real windmill fans hide the impeller in a deeper cavity behind the front bars.
const impellerZHub = zMidFront + midDepth * 0.55;
const impellerHubR = 14;
const impellerHub = cylinder(10, impellerHubR, impellerHubR - 1, 48)
  .translate(0, 0, impellerZHub - 5)
  .color(C.impeller).material({ roughness: 0.7 });

// One pitched blade — local frame: long axis +X, chord +Y, thin in Z
const oneBlade = box(bladeLen, bladeWidth, bladeThick)
  .placeReference('center', [impellerHubR + bladeLen / 2 - 2, 0, impellerZHub])
  .rotate([1, 0, 0], bladePitch);
let impellerAssembly;
if (showImpeller) {
  const bladesShape = circularPattern(oneBlade, bladeCount)
    .color(C.impeller).material({ roughness: 0.7 });
  impellerAssembly = { hub: impellerHub, blades: bladesShape };
}

// ---------- Mid housing (chunky cylinder behind grille; hollowed so impeller fits) ----------
const midRaw = cylinder(midDepth, midDia / 2, midDia / 2, 80)
  .translate(0, 0, zMidFront)
  .color(C.shell).material(matShell);
const midFilleted = fillet(midRaw, 3.0, { atZ: zMidBack, convex: true });
// Hollow cavity that fully contains the impeller (front-open, ends before rear face)
const midCavity = cylinder(midDepth - 6, midDia / 2 - 12, midDia / 2 - 12, 64)
  .translate(0, 0, zMidFront - 1);
const midHousing = difference(midFilleted, midCavity);

// ---------- Rear motor housing (small disc at back, rounded edge) ----------
const rearRaw = cylinder(rearDepth, rearDia / 2, rearDia / 2, 64)
  .translate(0, 0, zRearFront)
  .color(C.shell).material(matShell);
// Fillet first, then cut the recess (Truck can't fillet over a partial chain with a hole)
const rearFilleted = fillet(rearRaw, 5.0, { atZ: zRearBack, convex: true });
const buttonRecess = cylinder(1.4, buttonDia / 2 + 0.8, buttonDia / 2 + 0.8, 32)
  .translate(0, 0, zRearBack - 0.7);
const rearHousing = difference(rearFilleted, buttonRecess);

const rearButton = cylinder(1.0, buttonDia / 2, buttonDia / 2, 32)
  .translate(0, 0, zRearBack - 0.3)
  .color(C.button).material({ roughness: 0.55 });

// ---------- Assemble head, rotate it so axis points +Y (grille faces -Y / camera) ----------
// Camera is at +X, -Y, +Z roughly; we want the fan to face -Y so the grille is visible.
// rotate([1,0,0], -90): local (x,y,z) -> (x, z, -y).  Original Z (axial, depth-into-head)
// becomes world +Y (away from -Y camera).  The grille front (local z=0) ends up at world y=0
// and the back of the head extends toward +Y.  Good.
// Lift the head so the bottom of the grille rim sits at (post top + headLift).
const headCenterZWorld = baseH + standPostH + headLift + grilleOD / 2;
function placeHead(s) {
  return s
    .rotate([1, 0, 0], -90)
    .translate(0, -4, headCenterZWorld);
}

const headParts = [
  { name: "GrilleRing", shape: grilleRingF,  color: C.shell },
  { name: "GrilleFins", shape: fins,         color: C.grey },
  { name: "HubCap",     shape: hubCapMarked, color: C.hubCap },
  { name: "MidHousing", shape: midHousing,   color: C.shell },
  { name: "RearHousing",shape: rearHousing,  color: C.shell },
  { name: "RearButton", shape: rearButton,   color: C.button },
];
if (impellerAssembly) {
  headParts.push({ name: "ImpellerHub",    shape: impellerAssembly.hub,    color: C.impeller });
  headParts.push({ name: "ImpellerBlades", shape: impellerAssembly.blades, color: C.impeller });
}
const placedHead = headParts.map(p => ({ name: p.name, shape: placeHead(p.shape), color: p.color }));

// ---------- Stand post (slim vertical cylinder w/ rounded top) ----------
const standPostRaw = cylinder(standPostH, standPostDia / 2, standPostDia / 2, 48)
  .translate(0, 0, baseH)
  .color(C.shell).material(matShell);
const standPost = fillet(standPostRaw, standPostDia / 2 - 0.5,
  { atZ: baseH + standPostH, convex: true });

// ---------- Base (flat round puck, soft top edge) ----------
const baseRaw = cylinder(baseH, baseDia / 2, baseDia / 2, 80)
  .color(C.shell).material(matShell);
const baseTop = fillet(baseRaw, 4.0, { atZ: baseH, convex: true });

// Small power-indicator dot in front of stand post
const baseIndicator = cylinder(0.6, 3.5, 3.5, 24)
  .translate(0, -baseDia * 0.22, baseH + 0.01)
  .color(C.grey).material({ roughness: 0.6 });

// ---------- Scene: matte industrial hero ----------
scene({
  background: { top: "#e0e5ea", bottom: "#737e8a" },
  camera: { position: [430, -560, 350], target: [0, -10, 170], fov: 36 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient",     color: "#efe7dc", intensity: 0.18 },
    { type: "directional", position: [300, -340, 460], color: "#ffe4c2",
      intensity: 2.8, castShadow: true },
    { type: "directional", position: [-260, 220, 250], color: "#d4e6fb",
      intensity: 0.9 },
    { type: "hemisphere",  skyColor: "#c7d3df", groundColor: "#495463",
      intensity: 0.15 },
  ],
  ground: { visible: true, color: "#98a2ae", height: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.03, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

return [
  ...placedHead,
  { name: "StandPost",     shape: standPost,      color: C.shell },
  { name: "Base",          shape: baseTop,        color: C.shell },
  { name: "BaseIndicator", shape: baseIndicator,  color: C.grey  },
];
