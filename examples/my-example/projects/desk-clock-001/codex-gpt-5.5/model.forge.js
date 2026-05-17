// Minimal matte-black wall clock: 80 mm diameter, 25 mm body thickness.
// The face is vertical in the X/Z plane; body thickness runs along Y.

const diameter = Param.number("Diameter", 80, { min: 50, max: 140, unit: "mm" });
const bodyThickness = Param.number("Body Thickness", 25, { min: 12, max: 45, unit: "mm" });
const faceRecess = Param.number("Face Recess", 3.5, { min: 1.0, max: 7.0, step: 0.1, unit: "mm" });
const bezelWidth = Param.number("Bezel Width", 4.2, { min: 1.5, max: 9.0, step: 0.1, unit: "mm" });
const dialThickness = Param.number("Dial Thickness", 0.7, { min: 0.3, max: 2.0, step: 0.1, unit: "mm" });

const markerLength = Param.number("Marker Length", 5.5, { min: 2.5, max: 11.0, step: 0.1, unit: "mm" });
const quarterMarkerLength = Param.number("Quarter Marker Length", 7.0, { min: 3.0, max: 13.0, step: 0.1, unit: "mm" });
const markerWidth = Param.number("Marker Width", 1.3, { min: 0.5, max: 3.0, step: 0.1, unit: "mm" });
const markerRelief = Param.number("Marker Relief", 0.45, { min: 0.15, max: 1.4, step: 0.05, unit: "mm" });
const markerInset = Param.number("Marker Inset", 2.2, { min: 0.5, max: 7.0, step: 0.1, unit: "mm" });

const hourHandLength = Param.number("Hour Hand Length", 20, { min: 10, max: 32, step: 0.5, unit: "mm" });
const minuteHandLength = Param.number("Minute Hand Length", 30, { min: 16, max: 38, step: 0.5, unit: "mm" });
const secondHandLength = Param.number("Second Hand Length", 33, { min: 18, max: 39, step: 0.5, unit: "mm" });
const handThickness = Param.number("Hand Thickness", 0.42, { min: 0.2, max: 1.2, step: 0.05, unit: "mm" });
const hourHandWidth = Param.number("Hour Hand Width", 2.8, { min: 1.2, max: 5.5, step: 0.1, unit: "mm" });
const minuteHandWidth = Param.number("Minute Hand Width", 1.9, { min: 0.8, max: 4.0, step: 0.1, unit: "mm" });
const secondHandWidth = Param.number("Second Hand Width", 0.65, { min: 0.3, max: 1.5, step: 0.05, unit: "mm" });
const secondTailLength = Param.number("Second Tail Length", 7, { min: 2, max: 14, step: 0.5, unit: "mm" });
const hubRadius = Param.number("Hub Radius", 2.6, { min: 1.2, max: 5.0, step: 0.1, unit: "mm" });
const hubDepth = Param.number("Hub Depth", 0.45, { min: 0.2, max: 1.2, step: 0.05, unit: "mm" });

const hourAngle = Param.number("Hour Hand Angle", 305, { min: 0, max: 360, unit: "deg" });
const minuteAngle = Param.number("Minute Hand Angle", 65, { min: 0, max: 360, unit: "deg" });
const secondAngle = Param.number("Second Hand Angle", 190, { min: 0, max: 360, unit: "deg" });

const markerStyle = Param.choice("Marker Style", "quarter-emphasis", ["quarter-emphasis", "uniform"]);
const showSecondHand = Param.bool("Show Second Hand", true);
const showSmokedGlass = Param.bool("Show Smoked Glass", false);

const wallSlotWidth = Param.number("Rear Slot Width", 2.6, { min: 1.2, max: 5.0, step: 0.1, unit: "mm" });
const wallSlotLength = Param.number("Rear Slot Length", 12, { min: 5, max: 22, step: 0.5, unit: "mm" });
const wallKeyholeRadius = Param.number("Rear Keyhole Radius", 3.6, { min: 2, max: 6, step: 0.1, unit: "mm" });
const wallMountDepth = Param.number("Rear Mount Recess", 2.8, { min: 1.0, max: 6.0, step: 0.1, unit: "mm" });

const radius = diameter / 2;
const centerZ = radius;
const frontY = bodyThickness / 2;
const backY = -bodyThickness / 2;
const dialRadius = radius - bezelWidth - 0.35;
const dialStartY = frontY - faceRecess;
const dialFaceY = dialStartY + dialThickness;
const handGap = 0.08;

function yCylinder(depth, r, segments) {
  return cylinder(depth, r, r, segments).pointAlong([0, 1, 0]);
}

function makeRadialBox(width, depth, length, radialCenter, angleDeg, yCenter, zCenter) {
  return box(width, depth, length)
    .placeReference("center", [0, 0, 0])
    .translate(0, 0, radialCenter)
    .rotateY(angleDeg)
    .translate(0, yCenter, zCenter);
}

function makeHand(length, width, depth, tailLength, angleDeg, yCenter, zCenter) {
  const forward = box(width, depth, length)
    .translate(0, 0, 0);
  const tail = tailLength > 0
    ? box(width * 0.85, depth, tailLength).translate(0, 0, -tailLength)
    : null;
  const raw = tail ? union(forward, tail) : forward;
  return raw
    .rotateY(angleDeg)
    .translate(0, yCenter, zCenter);
}

let caseBody = yCylinder(bodyThickness, radius, 128).translate(0, backY, centerZ);

const faceCavity = yCylinder(faceRecess + 1.0, dialRadius + 0.35, 128)
  .translate(0, dialStartY - 0.02, centerZ);

const keyholeTop = yCylinder(wallMountDepth + 0.8, wallKeyholeRadius, 48)
  .translate(0, backY - 0.4, centerZ + 9.0);
const keyholeSlot = box(wallSlotWidth, wallMountDepth + 0.8, wallSlotLength)
  .placeReference("center", [0, backY + wallMountDepth / 2, centerZ + 2.0]);
caseBody = difference(caseBody, faceCavity, keyholeTop, keyholeSlot);

const dial = yCylinder(dialThickness, dialRadius, 128)
  .translate(0, dialStartY + 0.01, centerZ);

const markerR = dialRadius - markerInset - quarterMarkerLength / 2;
const markerParts = [];
for (let i = 0; i < 12; i++) {
  const isQuarter = i % 3 === 0;
  const length = markerStyle === "quarter-emphasis" && isQuarter ? quarterMarkerLength : markerLength;
  const yCenter = dialFaceY + markerRelief / 2 + 0.02;
  const radialCenter = markerR + (quarterMarkerLength - length) / 2;
  markerParts.push(makeRadialBox(markerWidth, markerRelief, length, radialCenter, i * 30, yCenter, centerZ));
}
const markers = union(...markerParts);

const hourY = dialFaceY + markerRelief + handGap + handThickness / 2;
const minuteY = hourY + handThickness + handGap;
const secondDepth = handThickness * 0.65;
const secondY = minuteY + handThickness / 2 + handGap + secondDepth / 2;
const hubYStart = secondY + secondDepth / 2 + handGap;

const hourHand = makeHand(hourHandLength, hourHandWidth, handThickness, 3.5, hourAngle, hourY, centerZ);
const minuteHand = makeHand(minuteHandLength, minuteHandWidth, handThickness, 4.0, minuteAngle, minuteY, centerZ);
const secondHand = makeHand(secondHandLength, secondHandWidth, secondDepth, secondTailLength, secondAngle, secondY, centerZ);

const hub = yCylinder(hubDepth, hubRadius, 64)
  .translate(0, hubYStart, centerZ);

const glassThickness = Param.number("Glass Thickness", 0.28, { min: 0.15, max: 0.8, step: 0.05, unit: "mm" });
const glassInset = Param.number("Glass Front Inset", 0.28, { min: 0.1, max: 1.0, step: 0.05, unit: "mm" });
const glass = yCylinder(glassThickness, dialRadius - 0.15, 128)
  .translate(0, frontY - glassInset - glassThickness, centerZ);

const matteCase = "#111113";
const deepDial = "#050506";
const graphite = "#2b2d2f";
const handBlack = "#18191b";
const secondBlack = "#35373a";
const smokedGlass = "#9aa3ad";

scene({
  background: { top: "#ced5dc", bottom: "#59636e" },
  camera: { position: [115, 135, 92], target: [0, 0, centerZ], fov: 36 },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient", color: "#f2e9de", intensity: 0.13 },
    { type: "directional", position: [160, 210, 260], target: [0, 0, centerZ], color: "#ffe0bd", intensity: 3.1, castShadow: true },
    { type: "directional", position: [-220, -80, 130], target: [0, 0, centerZ], color: "#d8e8ff", intensity: 0.9 },
    { type: "hemisphere", skyColor: "#c9d5df", groundColor: "#343941", intensity: 0.16 },
  ],
  ground: { visible: true, color: "#30343a", offset: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.025, threshold: 0.95, radius: 0.22 },
    vignette: { darkness: 0.42, offset: 0.28 },
    toneMappingExposure: 1.05,
  },
  capture: { size: 900, fps: 24, framesPerTurn: 96, background: "#59636e" },
});

const parts = [
  { name: "Matte Black Case", shape: caseBody.material({ metalness: 0.02, roughness: 0.92 }), color: matteCase },
  { name: "Recessed Dial", shape: dial.material({ metalness: 0.01, roughness: 0.96 }), color: deepDial },
  { name: "Twelve Raised Markers", shape: markers.material({ metalness: 0.03, roughness: 0.78 }), color: graphite },
  { name: "Hour Hand", shape: hourHand.material({ metalness: 0.08, roughness: 0.72 }), color: handBlack },
  { name: "Minute Hand", shape: minuteHand.material({ metalness: 0.08, roughness: 0.7 }), color: handBlack },
  { name: "Center Hub", shape: hub.material({ metalness: 0.12, roughness: 0.62 }), color: graphite },
];

if (showSecondHand) {
  parts.splice(5, 0, {
    name: "Second Hand",
    shape: secondHand.material({ metalness: 0.05, roughness: 0.74 }),
    color: secondBlack,
  });
}

if (showSmokedGlass) {
  parts.push({
    name: "Smoked Acrylic Lens",
    shape: glass.material({ metalness: 0, roughness: 0.18, opacity: 0.24, transmission: 0.35 }),
    color: smokedGlass,
  });
}

return parts.map((part) => ({
  name: part.name,
  shape: part.shape.rotateZ(180),
  color: part.color,
}));
