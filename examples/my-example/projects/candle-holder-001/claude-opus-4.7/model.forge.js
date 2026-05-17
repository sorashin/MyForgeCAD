// Tapered candle holder — brass-finished single-piece turning
// Base φ70mm, height 40mm, central candle socket φ22mm
//
// Body built as a single revolve so the profile bakes in foot flare,
// taper, top collar, decorative grooves, and the candle socket.

const baseDia = param("Base diameter", 70, { min: 50, max: 120, unit: "mm" });
const topDia = param("Top diameter", 56, { min: 30, max: 110, unit: "mm" });
const totalHeight = param("Overall height", 40, { min: 20, max: 80, unit: "mm" });
const socketDia = param("Candle socket diameter", 22, { min: 10, max: 30, unit: "mm" });
const socketDepth = param("Socket depth", 28, { min: 10, max: 38, unit: "mm" });
const wickRecess = param("Wick relief diameter", 6, { min: 2, max: 12, unit: "mm" });

const footHeight = param("Foot band height", 4, { min: 1, max: 10, unit: "mm" });
const footFlare = param("Foot flare", 2.5, { min: 0, max: 6, unit: "mm" });
const collarHeight = param("Top collar height", 3, { min: 1, max: 8, unit: "mm" });
const collarFlare = param("Top collar flare", 2.0, { min: 0, max: 6, unit: "mm" });

const grooveCount = param("Decorative grooves", 3, { min: 0, max: 6, step: 1 });
const grooveDepth = param("Groove depth", 0.6, { min: 0.2, max: 2.0, unit: "mm" });
const grooveWidth = param("Groove width", 1.2, { min: 0.4, max: 3.0, unit: "mm" });
const grooveSpacing = param("Groove spacing", 3.0, { min: 1.5, max: 8.0, unit: "mm" });
const grooveTopOffset = param("Grooves below rim", 2.5, { min: 1.0, max: 10.0, unit: "mm" });

const radialSegments = 128;

// --- Build the revolution profile in profile-XY (X = radius, Y = height) ---
// All radii are positive; profile is a closed loop that goes:
//   bottom-center axis → out along base → up outer silhouette (with grooves)
//   → in across top rim → down socket bore → back to center axis bottom

const bodyHeight = totalHeight - footHeight - collarHeight;
const footR0 = baseDia / 2;                     // bottom of foot
const footR1 = baseDia / 2 - footFlare;         // top of foot / base of body
const bodyR1 = topDia / 2 - collarFlare;        // top of taper
const rimR = topDia / 2;                        // outer rim
const socketR = socketDia / 2;
const wickR = wickRecess / 2;

// Key Z heights
const zFoot = footHeight;                       // top of foot
const zBodyTop = footHeight + bodyHeight;       // body / collar junction
const zRim = totalHeight;                       // top face
const zSocketBottom = totalHeight - socketDepth;
const zWickBottom = zSocketBottom - 2;          // wick relief sinks 2mm below socket floor

// Linear interpolation along the body taper between zFoot and zBodyTop
function radiusAtZ(z) {
  if (z <= zFoot) return footR1;
  if (z >= zBodyTop) return bodyR1;
  const t = (z - zFoot) / (zBodyTop - zFoot);
  return footR1 + (bodyR1 - footR1) * t;
}

const profile = path().moveTo(0, 0);
profile.lineTo(footR0, 0);                      // bottom outer corner of foot
profile.lineTo(footR1, zFoot);                  // up the slight foot flare

// Walk up the outer silhouette, inserting V-grooves along the way
// Grooves are placed below the rim, descending toward the foot
const grooveZs = [];
for (let i = 0; i < grooveCount; i++) {
  grooveZs.push(zRim - grooveTopOffset - i * grooveSpacing);
}
// Filter grooves that fall on the tapered body region
const validGrooves = grooveZs
  .filter((z) => z > zFoot + grooveWidth && z < zRim - 0.5)
  .sort((a, b) => a - b); // ascending so we walk upward

for (const gz of validGrooves) {
  const zLo = gz - grooveWidth / 2;
  const zHi = gz + grooveWidth / 2;
  const rLo = radiusAtZ(zLo);
  const rHi = radiusAtZ(zHi);
  const rCenter = radiusAtZ(gz) - grooveDepth;
  profile.lineTo(rLo, zLo);                     // approach groove
  profile.lineTo(rCenter, gz);                  // dive in (V-shape)
  profile.lineTo(rHi, zHi);                     // climb back out
}

// Up to top of body taper, then out to rim
profile.lineTo(bodyR1, zBodyTop);
profile.lineTo(rimR, zRim);                     // outward flare to rim

// Across the top rim toward the socket opening
profile.lineTo(socketR, zRim);

// Down the inside of the candle socket
profile.lineTo(socketR, zSocketBottom);

// Wick relief well: step in to smaller diameter, drop down, return
profile.lineTo(wickR, zSocketBottom);
profile.lineTo(wickR, zWickBottom);
profile.lineTo(0, zWickBottom);                 // close across the axis (bottom of well)

// Close the loop down the central axis back to origin
const turnedProfile = profile.close();

const holder = turnedProfile.revolve(360, radialSegments);

// --- Scene: matte industrial hero shot tuned for warm metal ---------------

scene({
  background: { top: "#cdb7a0", bottom: "#4a3a2c" },
  camera: { position: [180, -220, 130], target: [0, 0, 18], fov: 36 },
  environment: { preset: "studio", intensity: 0.35, background: false },
  lights: [
    { type: "ambient", color: "#f4e8d6", intensity: 0.18 },
    {
      type: "directional",
      position: [160, -180, 220],
      target: [0, 0, 20],
      color: "#ffd9a8",
      intensity: 2.8,
      castShadow: true,
    },
    {
      type: "directional",
      position: [-140, 80, 100],
      target: [0, 0, 20],
      color: "#c9d8ee",
      intensity: 0.8,
    },
    {
      type: "hemisphere",
      skyColor: "#d3b896",
      groundColor: "#3a2d20",
      intensity: 0.18,
    },
  ],
  ground: { visible: true, color: "#221a14", height: 0, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.12, threshold: 0.88, radius: 0.3 },
    vignette: { darkness: 0.4, offset: 0.35 },
    toneMappingExposure: 1.12,
  },
});

return [
  {
    name: "Candle Holder",
    shape: holder
      .color("#c8a14a")
      .material({ metalness: 0.92, roughness: 0.32, clearcoat: 0.15, clearcoatRoughness: 0.4 }),
  },
];
