// Parametric minimal analog wall clock — 80mm diameter, 25mm thick, matte black

const diameter      = Param.number("Diameter", 80, { min: 40, max: 150, unit: "mm" });
const thickness     = Param.number("Thickness", 25, { min: 10, max: 50, unit: "mm" });
const dialInset     = Param.number("Dial Inset", 1.5, { min: 0.5, max: 4, unit: "mm" });
const markerW       = Param.number("Marker Width", 2, { min: 1, max: 4, unit: "mm" });
const markerH       = Param.number("Marker Height", 5, { min: 2, max: 10, unit: "mm" });
const markerDepth   = Param.number("Marker Depth", 0.8, { min: 0.3, max: 2, unit: "mm" });
const hourHandW     = Param.number("Hour Hand Width", 4, { min: 2, max: 8, unit: "mm" });
const hourHandLen   = Param.number("Hour Hand Length", 22, { min: 12, max: 35, unit: "mm" });
const minHandW      = Param.number("Minute Hand Width", 2.5, { min: 1, max: 5, unit: "mm" });
const minHandLen    = Param.number("Minute Hand Length", 32, { min: 20, max: 45, unit: "mm" });
const secHandW      = Param.number("Second Hand Width", 1, { min: 0.5, max: 2, unit: "mm" });
const secHandLen    = Param.number("Second Hand Length", 34, { min: 20, max: 45, unit: "mm" });
const secTailLen    = Param.number("Second Hand Tail", 10, { min: 4, max: 18, unit: "mm" });
const hubRadius     = Param.number("Hub Radius", 4, { min: 2, max: 8, unit: "mm" });
const hourAngle     = Param.number("Hour Angle", 60, { min: 0, max: 360, unit: "°" });
const minAngle      = Param.number("Minute Angle", 180, { min: 0, max: 360, unit: "°" });
const secAngle      = Param.number("Second Angle", 270, { min: 0, max: 360, unit: "°" });

const radius = diameter / 2;
const faceZ  = thickness;           // top face of housing
const handZ  = faceZ + 1;          // hands sit just above the dial
const hubH   = 3;                   // hub cap height

// ── Body ────────────────────────────────────────────────────────────────────
const body = cylinder(thickness, radius, radius, 120)
  .color('#1a1a1a')
  .material({ metalness: 0.05, roughness: 0.88 });

// ── Dial (slightly recessed disc sitting on top of body) ────────────────────
const dialRadius = radius - dialInset;
const dialH      = 1.2;
const dial = cylinder(dialH, dialRadius, dialRadius, 120)
  .translate(0, 0, faceZ)
  .color('#1f1f1f')
  .material({ metalness: 0.03, roughness: 0.92 });

// ── Markers (12 rectangular tick marks, rotated around face) ─────────────────
// Each marker is a flat box placed near the edge of the dial, pointing inward.
// markerH = length radially, markerW = tangential width, markerDepth = z height
const markerRadius = dialRadius - markerH / 2 - 1.5; // center of marker radially

const markerParts = [];
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const mx = markerRadius * Math.sin(angleRad);
  const my = markerRadius * Math.cos(angleRad);

  // A slim box: W=tangential, H=radial length, D=depth
  const marker = box(markerW, markerH, markerDepth)
    .placeReference('center', [0, 0, 0])
    .rotateZ(-angleDeg)
    .translate(mx, my, faceZ + dialH)
    .color('#d8d8d0')
    .material({ metalness: 0.0, roughness: 0.6 });

  markerParts.push({ name: `Marker_${i + 1}`, shape: marker });
}

// ── Hands ────────────────────────────────────────────────────────────────────
// Each hand: a flat tapered-ish box, pivoted at origin, then rotated, then lifted.

function makeHand(len, width, depth, tailLen) {
  // Body: origin at pivot (bottom), extending upward (along +Y)
  const handBody = box(width, len, depth)
    .placeReference('center', [0, len / 2, depth / 2]);
  if (tailLen > 0) {
    const tail = box(width * 1.2, tailLen, depth)
      .placeReference('center', [0, -tailLen / 2, depth / 2]);
    return union(handBody, tail);
  }
  return handBody;
}

const handDepth = 1.2;
const handLift  = faceZ + dialH + markerDepth + 0.5;

// Hour hand — rotated clockwise from 12 o'clock
// ForgeCAD Z-up: 12 o'clock = +Y axis. Clockwise rotation = negative Z rotation.
const hourHand = makeHand(hourHandLen, hourHandW, handDepth, 0)
  .rotateZ(-hourAngle)
  .translate(0, 0, handLift)
  .color('#1a1a1a')
  .material({ metalness: 0.1, roughness: 0.8 });

// Minute hand — thinner, longer
const minHand = makeHand(minHandLen, minHandW, handDepth, 0)
  .rotateZ(-minAngle)
  .translate(0, 0, handLift + handDepth + 0.3)
  .color('#1a1a1a')
  .material({ metalness: 0.1, roughness: 0.8 });

// Second hand — very thin with tail, dark red accent
const secHand = makeHand(secHandLen, secHandW, handDepth * 0.7, secTailLen)
  .rotateZ(-secAngle)
  .translate(0, 0, handLift + handDepth * 2 + 0.6)
  .color('#b01020')
  .material({ metalness: 0.15, roughness: 0.6 });

// ── Center hub cap ────────────────────────────────────────────────────────────
const centerCap = cylinder(hubH, hubRadius, hubRadius, 32)
  .translate(0, 0, handLift + handDepth * 2 + 0.6)
  .color('#2a2a2a')
  .material({ metalness: 0.2, roughness: 0.7 });

// ── Scene ─────────────────────────────────────────────────────────────────────
scene({
  background: { top: '#c3ccd7', bottom: '#566474' },
  camera: { position: [120, -140, 100], target: [0, 0, thickness / 2], fov: 40 },
  environment: { preset: 'studio', intensity: 0.18, background: false },
  lights: [
    { type: 'ambient', color: '#efe7dc', intensity: 0.15 },
    { type: 'directional', position: [200, -300, 400], target: [0, 0, 0], color: '#ffe2bf', intensity: 3.0, castShadow: true },
    { type: 'directional', position: [-200, 180, 200], target: [0, 0, 0], color: '#d4e6fb', intensity: 0.85 },
    { type: 'hemisphere', skyColor: '#c7d3df', groundColor: '#495463', intensity: 0.15 },
  ],
  ground: { visible: true, color: '#111118', height: -2, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.93, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.1,
  },
});

// ── Return named parts ────────────────────────────────────────────────────────
return [
  { name: 'Body',        shape: body },
  { name: 'Dial',        shape: dial },
  ...markerParts,
  { name: 'Hour_Hand',   shape: hourHand },
  { name: 'Minute_Hand', shape: minHand },
  { name: 'Second_Hand', shape: secHand },
  { name: 'Center_Cap',  shape: centerCap },
];
