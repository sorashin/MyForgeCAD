// Desktop matte-black analog wall clock.
// Minimal face: 12 markers (no numerals), hour / minute / second hands.

const diameter      = Param.number("Diameter",        80,   { min: 50, max: 200, unit: "mm" });
const thickness     = Param.number("Body Thickness",  25,   { min: 10, max: 60, unit: "mm" });
const bezelWidth    = Param.number("Bezel Width",     4,    { min: 1,  max: 12, unit: "mm" });
const bezelHeight   = Param.number("Bezel Lip",       1.5,  { min: 0.5, max: 5,  unit: "mm" });
const glassInset    = Param.number("Glass Inset",     0.8,  { min: 0.4, max: 4,  unit: "mm" });
const dialInset     = Param.number("Dial Inset",      5.0,  { min: 1,  max: 10, unit: "mm" });

const markerLen     = Param.number("Marker Length",   5.0,  { min: 2,  max: 12, unit: "mm" });
const markerWide    = Param.number("Marker Width",    1.6,  { min: 0.5, max: 4,  unit: "mm" });
const markerHourLen = Param.number("Hour Marker Len", 7.5,  { min: 3,  max: 14, unit: "mm" });
const markerHeight  = Param.number("Marker Relief",   0.4,  { min: 0.05, max: 2, unit: "mm" });

const hourHandLen   = Param.number("Hour Hand Len",   20,   { min: 10, max: 40, unit: "mm" });
const minHandLen    = Param.number("Minute Hand Len", 30,   { min: 12, max: 50, unit: "mm" });
const secHandLen    = Param.number("Second Hand Len", 33,   { min: 12, max: 55, unit: "mm" });
const handThick     = Param.number("Hand Thickness",  0.7,  { min: 0.4, max: 3,  unit: "mm" });

const hourTimeDeg   = Param.number("Hour Pose",       300,  { min: 0, max: 360, unit: "°" }); // 10:00 ish
const minTimeDeg    = Param.number("Minute Pose",     60,   { min: 0, max: 360, unit: "°" });
const secTimeDeg    = Param.number("Second Pose",     192,  { min: 0, max: 360, unit: "°" });

const showSecond    = Param.bool  ("Show Second Hand", true);

const radius        = diameter / 2;
const faceZ         = thickness - dialInset;        // top of dial face
const glassZ        = thickness - glassInset;       // top of glass surface
const bezelTopZ     = thickness + bezelHeight;      // bezel raised lip
const handBaseZ     = faceZ + 0.05;                 // hands float just above dial

// ──────────────────────────────────────────────────────────────
// Body (matte black case)
// ──────────────────────────────────────────────────────────────
let body = cylinder(thickness, radius, radius, 96);

// Recessed dial cavity (where face + hands live, covered by glass)
const cavity = cylinder(dialInset + 0.01, radius - bezelWidth, radius - bezelWidth, 96)
  .translate(0, 0, faceZ);
body = difference(body, cavity);

// Small back recess for wall mount (rear keyhole-ish counterbore)
const mountRecess = cylinder(3, 6, 6, 48).translate(0, 0, -0.01);
body = difference(body, mountRecess);

// (skip outer bottom-rim chamfer — interferes with the mount recess cap)

// ──────────────────────────────────────────────────────────────
// Dial face (slightly different black for subtle contrast)
// ──────────────────────────────────────────────────────────────
const dialThick = 0.8;
const dial = cylinder(dialThick, radius - bezelWidth - 0.3, radius - bezelWidth - 0.3, 96)
  .translate(0, 0, faceZ - dialThick + 0.01);

// ──────────────────────────────────────────────────────────────
// 12 Hour Markers (3/6/9/12 are slightly longer)
// ──────────────────────────────────────────────────────────────
const markerRingR = radius - bezelWidth - 2.0;
const markers = [];
for (let i = 0; i < 12; i++) {
  const isHour = (i % 3 === 0); // 12, 3, 6, 9 slightly longer
  const len = isHour ? markerHourLen : markerLen;
  // Marker oriented radially: long axis along Y (we'll rotate around Z)
  // Build at top (12 o'clock = +Y direction) then rotate by -i*30°.
  const angle = -i * 30; // degrees, clockwise from 12
  const marker = box(markerWide, len, markerHeight)
    .translate(0, markerRingR - len / 2, faceZ + 0.001)
    .rotateZ(angle);
  markers.push(marker);
}
const markerUnion = union(...markers);

// ──────────────────────────────────────────────────────────────
// Hands (slim rectangular silhouettes, tapered tip via narrow ratio)
// ──────────────────────────────────────────────────────────────
function makeHand(length, width, height, tail) {
  // Body of the hand extends from -tail (behind pivot) to +length (tip).
  // Built along +Y; rotate around Z to set angle.
  return box(width, length + tail, height)
    .translate(0, (length - tail) / 2, 0);
}

// Hour hand — broadest
const hourHand = makeHand(hourHandLen, 2.4, handThick, 4)
  .translate(0, 0, handBaseZ)
  .rotateZ(-hourTimeDeg);

// Minute hand — slimmer
const minHand = makeHand(minHandLen, 1.8, handThick, 4)
  .translate(0, 0, handBaseZ + handThick + 0.05)
  .rotateZ(-minTimeDeg);

// Second hand — thin needle (separate accent color)
const secHand = makeHand(secHandLen, 0.7, handThick * 0.7, 5)
  .translate(0, 0, handBaseZ + 2 * handThick + 0.1)
  .rotateZ(-secTimeDeg);

// Center hub (covers the pivots, slight cone for elegance)
const hubBase = cylinder(handThick * 3 + 0.4, 2.6, 2.6, 48)
  .translate(0, 0, handBaseZ);
const hubCap = cylinder(0.6, 2.6, 1.6, 48)
  .translate(0, 0, handBaseZ + handThick * 3 + 0.4);
const hub = union(hubBase, hubCap);

// ──────────────────────────────────────────────────────────────
// Glass cover (clear, thin)
// ──────────────────────────────────────────────────────────────
const glassThick = glassZ - (handBaseZ + 3 * handThick + 1.0);
const glass = cylinder(Math.max(glassThick, 0.8),
                        radius - bezelWidth - 0.1,
                        radius - bezelWidth - 0.1, 96)
  .translate(0, 0, glassZ - Math.max(glassThick, 0.8));

// ──────────────────────────────────────────────────────────────
// Bezel ring (raised lip around the glass)
// ──────────────────────────────────────────────────────────────
const bezelOuter = cylinder(bezelHeight, radius, radius, 96).translate(0, 0, thickness);
const bezelInner = cylinder(bezelHeight + 0.02, radius - bezelWidth + 0.2, radius - bezelWidth + 0.2, 96)
  .translate(0, 0, thickness - 0.01);
const bezel = difference(bezelOuter, bezelInner);

// Soften the outer bezel top edge
const bezelTopEdges = selectEdges(bezel, { atZ: bezelTopZ, perpendicular: [0, 0, 1] });
const bezelFinal = bezelTopEdges.length > 0 ? chamfer(bezel, 0.3, bezelTopEdges) : bezel;

// ──────────────────────────────────────────────────────────────
// Materials & colors
// ──────────────────────────────────────────────────────────────
const matteBlack  = "#1c1c1e";
const dialBlack   = "#101012";
const markerWhite = "#e9e6dd"; // off-white markers pop on black
const handWhite   = "#efece3";
const secondAccent = "#c94f3a"; // muted vintage red second hand
const hubDark     = "#0a0a0c";
const glassColor  = "#dfe6ec";

const parts = [
  { name: "Body",     shape: body.material({ metalness: 0.05, roughness: 0.85 }),    color: matteBlack },
  { name: "Bezel",    shape: bezelFinal.material({ metalness: 0.18, roughness: 0.55 }), color: matteBlack },
  { name: "Dial",     shape: dial.material({ metalness: 0.02, roughness: 0.92 }),    color: dialBlack },
  { name: "Markers",  shape: markerUnion.material({ metalness: 0.10, roughness: 0.55 }), color: markerWhite },
  { name: "HourHand", shape: hourHand.material({ metalness: 0.20, roughness: 0.50 }), color: handWhite },
  { name: "MinuteHand", shape: minHand.material({ metalness: 0.20, roughness: 0.50 }), color: handWhite },
  { name: "Hub",      shape: hub.material({ metalness: 0.35, roughness: 0.40 }),     color: hubDark },
  { name: "Glass",    shape: glass.material({ metalness: 0.0, roughness: 0.05, opacity: 0.22, transmission: 0.9 }), color: glassColor },
];

if (showSecond) {
  parts.splice(7, 0, {
    name: "SecondHand",
    shape: secHand.material({ metalness: 0.25, roughness: 0.45 }),
    color: secondAccent,
  });
}

// ──────────────────────────────────────────────────────────────
// Scene — matte industrial hero-shot recipe
// ──────────────────────────────────────────────────────────────
scene({
  background: { top: "#c3ccd7", bottom: "#566474" },
  camera: { position: [120, -140, 90], target: [0, 0, thickness / 2], fov: 38 },
  environment: { preset: "studio", intensity: 0.22, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    { type: "directional", position: [180, -220, 280], color: "#ffe2bf", intensity: 2.8, castShadow: true },
    { type: "directional", position: [-160, 140, 160], color: "#d4e6fb", intensity: 0.85 },
    { type: "hemisphere", skyColor: "#c7d3df", groundColor: "#495463", intensity: 0.15 },
  ],
  ground: { visible: true, color: "#3a3f47", height: -1, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.94, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
});

return parts;
