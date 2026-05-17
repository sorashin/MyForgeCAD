// Mardi Mercredi store fixture unit — architectural display bench / counter.
// Inspired by CREATIVE STUDIO UNRAVEL's Mardi Mercredi store interiors:
// monolithic plastered volume on a recessed steel base channel (giving a
// floating shadow line), capped by a thin brushed-steel top slightly inset
// from the body. Minimal, sculptural, building-like at small scale.

// ------------------------------ Parameters ------------------------------

const Variant = Param.choice("Variant", "bench", ["bench", "counter", "tall-display"]);

// Body footprint
const Length = Param.number("Body Length", 1800, { min: 600, max: 2400, unit: "mm" });
const Depth  = Param.number("Body Depth",   600, { min: 300, max: 900,  unit: "mm" });

// Heights are variant-driven but exposed for tuning.
const BenchH        = Param.number("Bench Height",         400, { min: 280, max: 520, unit: "mm" });
const CounterH      = Param.number("Counter Height",       900, { min: 700, max: 1100, unit: "mm" });
const TallDisplayH  = Param.number("Tall Display Height", 1200, { min: 900, max: 1500, unit: "mm" });

// Top steel slab — thin, inset from perimeter.
const TopThickness = Param.number("Top Slab Thickness", 12, { min: 6,  max: 25, unit: "mm" });
const TopInset     = Param.number("Top Edge Inset",     10, { min: 0,  max: 40, unit: "mm" });

// Recessed steel base channel — creates the floating shadow gap.
const BaseChannelH      = Param.number("Base Channel Height", 22, { min: 8,  max: 60, unit: "mm" });
const BaseChannelInset  = Param.number("Base Channel Inset",  28, { min: 8,  max: 80, unit: "mm" });

// Body softening — a barely-there fillet on vertical corners reads "plaster".
const BodyCornerFillet  = Param.number("Body Corner Fillet", 4,  { min: 0, max: 30, unit: "mm" });
const TopEdgeChamfer    = Param.number("Top Slab Chamfer",   1.2, { min: 0, max: 4,  unit: "mm" });

// Optional companion stool from the same plaster family.
const ShowCompanionStool = Param.bool("Companion Stool", true);
const StoolSize          = Param.number("Stool Size",   380, { min: 280, max: 480, unit: "mm" });
const StoolHeight        = Param.number("Stool Height", 420, { min: 320, max: 520, unit: "mm" });
const StoolSpacing       = Param.number("Stool Spacing", 220, { min: 80,  max: 600, unit: "mm" });

// Floor plinth under the scene for a grounded studio render.
const ShowStage = Param.bool("Studio Stage", true);

// ------------------------------ Derived ------------------------------

const Height = (
  Variant === "counter"      ? CounterH :
  Variant === "tall-display" ? TallDisplayH :
                                BenchH
);

// Plaster body sits on top of the recessed steel base channel.
const bodyZ0  = BaseChannelH;
const bodyTop = bodyZ0 + Height;

// ------------------------------ Materials ------------------------------

// Off-white plaster: warm, very matte, almost no specular.
const plasterColor = "#e7e1d4";
const plasterMat   = { metalness: 0.0, roughness: 0.95 };

// Raw / hot-rolled steel: cool grey, satin, mild metalness.
const steelColor   = "#8d949c";
const steelMat     = { metalness: 0.55, roughness: 0.42 };

// Darker structural steel for the recessed base channel — creates depth.
const baseChannelColor = "#3d4148";
const baseChannelMat   = { metalness: 0.55, roughness: 0.55 };

// ------------------------------ Geometry helpers ------------------------------

function plasterBlock(w, d, h, cornerFillet) {
  let b = box(w, d, h);
  if (cornerFillet > 0) {
    b = fillet(b, cornerFillet, { parallel: [0, 0, 1] });
  }
  return b;
}

// ------------------------------ Main unit parts ------------------------------

// Recessed steel base channel — slightly smaller than the body footprint so
// the plaster overhangs it and casts the floating shadow line.
const baseChannel = box(
  Length - 2 * BaseChannelInset,
  Depth  - 2 * BaseChannelInset,
  BaseChannelH
)
  .color(baseChannelColor)
  .material(baseChannelMat);

// Plaster body — monolithic, mildly softened verticals.
const body = plasterBlock(Length, Depth, Height, BodyCornerFillet)
  .translate(0, 0, bodyZ0)
  .color(plasterColor)
  .material(plasterMat);

// Thin steel top slab, inset from the perimeter on all four sides.
let topSlab = box(Length - 2 * TopInset, Depth - 2 * TopInset, TopThickness);
if (TopEdgeChamfer > 0) {
  topSlab = chamfer(topSlab, TopEdgeChamfer, { atZ: TopThickness, convex: true });
}
topSlab = topSlab
  .translate(0, 0, bodyTop)
  .color(steelColor)
  .material(steelMat);

// ------------------------------ Companion stool ------------------------------

// Same plaster + thin steel top language, scaled down. Two stools placed off
// the long side so the hero shot reads as a fixture family.
function buildStool() {
  const stoolBaseH       = 14;
  const stoolBodyH       = StoolHeight - stoolBaseH - 6;
  const stoolTopH        = 6;
  const stoolBaseInset   = 18;
  const stoolTopInset    = 6;

  const sBase = box(
    StoolSize - 2 * stoolBaseInset,
    StoolSize - 2 * stoolBaseInset,
    stoolBaseH
  )
    .color(baseChannelColor)
    .material(baseChannelMat);

  let sBody = box(StoolSize, StoolSize, stoolBodyH);
  if (BodyCornerFillet > 0) {
    sBody = fillet(sBody, Math.min(BodyCornerFillet, 6), { parallel: [0, 0, 1] });
  }
  sBody = sBody
    .translate(0, 0, stoolBaseH)
    .color(plasterColor)
    .material(plasterMat);

  let sTop = box(
    StoolSize - 2 * stoolTopInset,
    StoolSize - 2 * stoolTopInset,
    stoolTopH
  );
  sTop = chamfer(sTop, 0.8, { atZ: stoolTopH, convex: true });
  sTop = sTop
    .translate(0, 0, stoolBaseH + stoolBodyH)
    .color(steelColor)
    .material(steelMat);

  return { sBase, sBody, sTop };
}

const parts = [
  { name: "Recessed Base Channel", shape: baseChannel, color: baseChannelColor },
  { name: "Plaster Body",          shape: body,        color: plasterColor },
  { name: "Steel Top Slab",        shape: topSlab,     color: steelColor },
];

if (ShowCompanionStool) {
  const stoolY = -(Depth / 2 + StoolSpacing + StoolSize / 2);
  const stoolXs = [-(StoolSize * 0.65), StoolSize * 0.65];

  stoolXs.forEach((x, i) => {
    const { sBase, sBody, sTop } = buildStool();
    parts.push(
      { name: `Stool ${i + 1} Base`, shape: sBase.translate(x, stoolY, 0),                              color: baseChannelColor },
      { name: `Stool ${i + 1} Body`, shape: sBody.translate(x, stoolY, 0),                              color: plasterColor },
      { name: `Stool ${i + 1} Top`,  shape: sTop.translate(x, stoolY, 0),                               color: steelColor },
    );
  });
}

// ------------------------------ Studio stage ------------------------------

if (ShowStage) {
  const stage = box(Length * 2.0, Depth * 4.0, 18)
    .translate(0, -Depth * 0.6, -18)
    .color("#bcbfc3")
    .material({ metalness: 0.02, roughness: 0.9 });

  mock(stage, "StudioFloor");
}

// ------------------------------ Scene ------------------------------

scene({
  background: { top: "#cfd5dc", bottom: "#5e6772" },
  camera: {
    position: [Length * 1.05, -Depth * 3.2, Height * 1.7 + 350],
    target:   [0, -Depth * 0.2, Height * 0.55],
    fov: 36,
  },
  environment: { preset: "studio", intensity: 0.2, background: false },
  lights: [
    { type: "ambient", color: "#efe7dc", intensity: 0.16 },
    {
      type: "directional",
      position: [Length * 0.6, -Length * 0.9, Height * 3 + 800],
      target:   [0, 0, Height * 0.5],
      color: "#ffe2bf",
      intensity: 2.9,
      castShadow: true,
    },
    {
      type: "directional",
      position: [-Length * 0.6, Length * 0.4, Height * 2 + 400],
      target:   [0, 0, Height * 0.5],
      color: "#d4e6fb",
      intensity: 0.85,
    },
    {
      type: "hemisphere",
      skyColor: "#c7d3df",
      groundColor: "#495463",
      intensity: 0.15,
    },
  ],
  ground: { visible: true, color: "#b8bcc0", height: -20, receiveShadow: true },
  postProcessing: {
    bloom: { intensity: 0.04, threshold: 0.93, radius: 0.28 },
    vignette: { darkness: 0.4, offset: 0.32 },
    toneMappingExposure: 1.12,
  },
});

return parts;
