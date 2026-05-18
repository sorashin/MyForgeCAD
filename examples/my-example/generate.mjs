#!/usr/bin/env node
// Multi-engine batch model generator.
//
// Reads prompts.csv, for each (row × engine) pair spawns an agent (claude or codex)
// to build a ForgeCAD model under projects/{slug}/{engine}/, validates the model,
// renders canonical stills + a 180° turntable GIF, and tracks per-pair state
// in results.csv.
//
// Usage:
//   node generate.mjs                              # all rows × default engines (skip already done)
//   node generate.mjs --slug foo                   # one slug, all its engines
//   node generate.mjs --engine codex-gpt-5.5       # one engine across all rows
//   node generate.mjs --slug foo --engine claude-opus-4.7
//   node generate.mjs --force                      # re-run even if results.csv says done
//   node generate.mjs --render-only                # post-render only, no agent spawn
//   node generate.mjs --dry-run                    # parse & plan only

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, stat, rename, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const CSV_PATH = path.join(HERE, "prompts.csv");
const RESULTS_PATH = path.join(HERE, "results.csv");
const REFS_DIR = path.join(HERE, "_refs");
const PROJECTS_DIR = path.join(HERE, "projects");
const CONTEXT_PATH = path.join(HERE, "_context", "forgecad.md");
const PER_ROW_TIMEOUT_MS = 15 * 60 * 1000;

// Render configuration
const STILL_SIZE = 700;
const STILL_VIEWS = [
  { name: "hero",  az: 45, el: 25 },
  { name: "front", az: 0,  el: 0  },
  { name: "side",  az: 90, el: 0  },
  { name: "top",   az: 0,  el: 90 },
];
const TURNTABLE_FRAMES = 18;
const TURNTABLE_PITCH = 25;
const TURNTABLE_SIZE = 480;
const TURNTABLE_FPS = 12;
const TURNTABLE_PALETTE_COLORS = 128;

// ──────────────────────────────────────────────────────────────────
// Engines
// ──────────────────────────────────────────────────────────────────
const ENGINES = {
  "claude-sonnet": {
    needsContext: false,
    buildCmd: ({ prompt }) => ({
      bin: "claude",
      args: [
        "-p",
        "--dangerously-skip-permissions",
        "--no-session-persistence",
        "--model", "sonnet",
        "--add-dir", REPO_ROOT,
        "--output-format", "text",
        prompt,
      ],
      cwd: REPO_ROOT,
    }),
  },
  "claude-opus-4.7": {
    needsContext: false,
    buildCmd: ({ prompt }) => ({
      bin: "claude",
      args: [
        "-p",
        "--dangerously-skip-permissions",
        "--no-session-persistence",
        "--model", "opus",
        "--add-dir", REPO_ROOT,
        "--output-format", "text",
        prompt,
      ],
      cwd: REPO_ROOT,
    }),
  },
  "codex-gpt-5.5": {
    needsContext: true,
    buildCmd: ({ prompt, refPaths }) => ({
      bin: "codex",
      // Pass prompt via stdin (use "-") to avoid shell ARG_MAX with the huge context blob.
      args: [
        "exec",
        "--dangerously-bypass-approvals-and-sandbox",
        "--ephemeral",
        "--skip-git-repo-check",
        "-m", "gpt-5.5",
        "-C", REPO_ROOT,
        ...refPaths.flatMap((p) => ["-i", p]),
        "-",
      ],
      cwd: REPO_ROOT,
      stdin: prompt,
    }),
  },
};

const DEFAULT_ENGINES = ["claude-opus-4.7", "codex-gpt-5.5"];

// ──────────────────────────────────────────────────────────────────
// CSV (minimal: quoted fields, escaped "" inside quotes, no embedded newlines)
// ──────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseRow(line);
    return Object.fromEntries(header.map((h, j) => [h, cells[j] ?? ""]));
  });
  return { header, rows };
}

function parseRow(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ""; }
      else if (c === '"' && cur === "") { inQuotes = true; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function stringifyCsv(header, rows) {
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

// ──────────────────────────────────────────────────────────────────
// Results CSV (per slug × engine)
// ──────────────────────────────────────────────────────────────────
const RESULTS_HEADER = [
  "slug",
  "engine",
  "status",
  "model_path",
  "hero_path",
  "gif_path",
  "agent_seconds",
  "render_seconds",
  "error",
];

async function loadResults() {
  const map = new Map();
  if (!(await fileExists(RESULTS_PATH))) return map;
  const { rows } = parseCsv(await readFile(RESULTS_PATH, "utf-8"));
  for (const r of rows) {
    if (!r.slug || !r.engine) continue;
    map.set(`${r.slug}::${r.engine}`, r);
  }
  return map;
}

async function saveResults(map) {
  const rows = [...map.values()].sort((a, b) =>
    a.slug.localeCompare(b.slug) || a.engine.localeCompare(b.engine));
  await writeFile(RESULTS_PATH, stringifyCsv(RESULTS_HEADER, rows));
}

// ──────────────────────────────────────────────────────────────────
// File helpers
// ──────────────────────────────────────────────────────────────────
async function fileExists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function ensureRefs(slug, urlsField) {
  if (!urlsField || urlsField.trim() === "") return [];
  // Tolerate `|`, whitespace, or newline as separators (URLs don't contain whitespace).
  const urls = urlsField.split(/[\s|]+/).filter(Boolean);
  if (urls.length === 0) return [];
  const dir = path.join(REFS_DIR, slug);
  await mkdir(dir, { recursive: true });
  const localPaths = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = guessExt(url);
    const localPath = path.join(dir, `${String(i + 1).padStart(2, "0")}${ext}`);
    if (await fileExists(localPath)) {
      localPaths.push(localPath);
      continue;
    }
    console.log(`    fetching ${url} -> ${path.relative(HERE, localPath)}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(localPath, buf);
    localPaths.push(localPath);
  }
  return localPaths;
}

function guessExt(url) {
  const m = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff?)(?:\?|#|$)/i);
  return m ? `.${m[1].toLowerCase()}` : ".bin";
}

async function ensureContext() {
  if (await fileExists(CONTEXT_PATH)) return CONTEXT_PATH;
  await mkdir(path.dirname(CONTEXT_PATH), { recursive: true });
  console.log(`  generating ForgeCAD context blob (${path.relative(HERE, CONTEXT_PATH)})...`);
  const r = await runCmd("forgecad", ["skill", "one-file", CONTEXT_PATH]);
  if (r.code !== 0) throw new Error(`forgecad skill one-file failed: ${r.err || r.out}`);
  return CONTEXT_PATH;
}

// ──────────────────────────────────────────────────────────────────
// Prompts (engine-specific)
// ──────────────────────────────────────────────────────────────────
function buildClaudePrompt({ slug, engine, description, refPaths, outputPath, validationPng }) {
  const refsBlock = refPaths.length === 0
    ? "(none — work from the description alone)"
    : refPaths.map((p) => `- ${p}`).join("\n");

  return `TASK: build a parametric ForgeCAD model.

SLUG: ${slug}
ENGINE: ${engine}

DESCRIPTION:
${description}

REFERENCE IMAGES (use the Read tool on each to view):
${refsBlock}

OUTPUT FILE: ${outputPath}
VALIDATION PREVIEW: ${validationPng}

REQUIREMENTS:
1. Use the /forgecad-make-a-model skill — it knows the .forge.js conventions and validation flow. It will load /forgecad for API docs.
2. Make ALL meaningful dimensions parametric via Param.number / Param.choice / Param.bool.
3. Set up a polished scene() — prefer the matte industrial hero-shot recipe in the make-a-model skill.
4. Return named, colored parts as an array: [{ name, shape, color }]. Use realistic material-driven colors.
5. After writing the file, you MUST run:
     forgecad run ${outputPath}
   and fix any errors until it passes.
6. After validation, you MUST run:
     forgecad render 3d ${outputPath} ${validationPng} --camera 45:25 --size 700
   then Read the resulting PNG to visually confirm the geometry matches intent. If it doesn't, fix and re-render.
7. The OUTPUT FILE directory already exists. Write ONLY model.forge.js there. Do not create README/docs/tests.
8. Final response: 1-2 sentences max. Don't dump the source code.`;
}

function buildCodexPrompt({ slug, engine, description, refPaths, outputPath, validationPng, contextText }) {
  const refsBlock = refPaths.length === 0
    ? "(none — work from the description alone)"
    : refPaths.map((p) => `- ${p}`).join("\n");

  return `You are building a parametric ForgeCAD model. The ForgeCAD knowledge base is included below as reference.

═══════════════════════════════════════════════════════════════════════════════
${contextText}
═══════════════════════════════════════════════════════════════════════════════

TASK: build a parametric ForgeCAD model.

SLUG: ${slug}
ENGINE: ${engine}

DESCRIPTION:
${description}

REFERENCE IMAGES (also attached as multimodal input):
${refsBlock}

OUTPUT FILE: ${outputPath}
VALIDATION PREVIEW: ${validationPng}

REQUIREMENTS:
1. Follow the conventions in the ForgeCAD context above — especially the make-a-model workflow, file placement, and the render-verify loop.
2. Make ALL meaningful dimensions parametric via Param.number / Param.choice / Param.bool.
3. Set up a polished scene() — use the matte industrial hero-shot recipe.
4. Return named, colored parts as an array: [{ name, shape, color }]. Use realistic material-driven colors.
5. After writing the file, you MUST run:
     forgecad run ${outputPath}
   and fix any errors until it passes.
6. After validation, you MUST run:
     forgecad render 3d ${outputPath} ${validationPng} --camera 45:25 --size 700
   then visually verify the result. Fix and re-render if it doesn't match intent.
7. The OUTPUT FILE directory already exists. Write ONLY model.forge.js there. Do not create README/docs/tests.
8. Final response: 1-2 sentences max. Don't dump the source code.`;
}

function buildPromptForEngine(engineName, params) {
  if (engineName.startsWith("claude")) return buildClaudePrompt({ ...params, engine: engineName });
  if (engineName.startsWith("codex"))  return buildCodexPrompt({ ...params, engine: engineName });
  throw new Error(`Unknown engine family: ${engineName}`);
}

// ──────────────────────────────────────────────────────────────────
// Rate-limit / quota detection
// ──────────────────────────────────────────────────────────────────
const RATE_LIMIT_PATTERNS = [
  /rate[ _-]?limit/i,
  /\bquota\b/i,
  /usage.{0,30}(limit|exceeded|reached|cap)/i,
  /too many requests/i,
  /\b429\b/,
  /credit.{0,20}(limit|exceeded|exhausted|insufficient|out)/i,
  /(resource|tokens).{0,20}exhausted/i,
  /insufficient.{0,20}(credit|balance|quota|funds)/i,
  /billing.{0,30}(issue|exceeded|required)/i,
  /(your )?(claude|codex|anthropic|openai).{0,40}(limit|quota|usage)/i,
  /please (try again|wait)/i,
  /context.{0,10}length.{0,10}exceeded/i,
];

function detectRateLimit(text) {
  if (!text) return null;
  for (const p of RATE_LIMIT_PATTERNS) {
    const m = text.match(p);
    if (m) return { pattern: p.source, snippet: extractSnippet(text, m.index ?? 0) };
  }
  return null;
}

function extractSnippet(text, idx) {
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, idx + 160);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

// ──────────────────────────────────────────────────────────────────
// Subprocess helpers
// ──────────────────────────────────────────────────────────────────
function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

function runAgent({ bin, args, cwd, stdin }) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      stdio: [stdin ? "pipe" : "ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      try { child.kill("SIGTERM"); } catch {}
      setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, 5000);
    }, PER_ROW_TIMEOUT_MS);

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
    child.stdout.on("data", (d) => { stdout += d.toString(); process.stdout.write(d); });
    child.stderr.on("data", (d) => { stderr += d.toString(); process.stderr.write(d); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, killed });
    });
  });
}

function verifyForgecadRun(filePath) {
  return runCmd("forgecad", ["run", filePath]);
}

// ──────────────────────────────────────────────────────────────────
// Post-render: 4 stills + 180° turntable GIF
// ──────────────────────────────────────────────────────────────────
async function renderStills(filePath, outDir) {
  await mkdir(outDir, { recursive: true });
  const cameraArgs = STILL_VIEWS.flatMap((v) => ["--camera", `${v.az}:${v.el}`]);
  const stagingPath = path.join(outDir, "stills.png");
  const res = await runCmd("forgecad", [
    "render", "3d", filePath, stagingPath,
    "--size", String(STILL_SIZE),
    ...cameraArgs,
  ]);
  if (res.code !== 0) {
    return { ok: false, error: oneLine(res.err || res.out).slice(0, 240) };
  }
  for (const v of STILL_VIEWS) {
    const from = path.join(outDir, `stills_az${v.az}_el${v.el}.png`);
    const to   = path.join(outDir, `${v.name}.png`);
    try { await rename(from, to); }
    catch (e) { return { ok: false, error: `rename ${from} -> ${to}: ${e.message}` }; }
  }
  return { ok: true };
}

async function renderTurntable(filePath, outDir) {
  await mkdir(outDir, { recursive: true });
  const framesDir = path.join(outDir, "_frames");
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const azimuths = Array.from(
    { length: TURNTABLE_FRAMES },
    (_, i) => Math.round((i * 180) / TURNTABLE_FRAMES),
  );
  const cameraArgs = azimuths.flatMap((az) => ["--camera", `${az}:${TURNTABLE_PITCH}`]);
  const stagingPath = path.join(framesDir, "turn.png");

  const r1 = await runCmd("forgecad", [
    "render", "3d", filePath, stagingPath,
    "--size", String(TURNTABLE_SIZE),
    ...cameraArgs,
  ]);
  if (r1.code !== 0) {
    return { ok: false, error: `render frames: ${oneLine(r1.err || r1.out).slice(0, 240)}` };
  }

  for (let i = 0; i < azimuths.length; i++) {
    const from = path.join(framesDir, `turn_az${azimuths[i]}_el${TURNTABLE_PITCH}.png`);
    const to   = path.join(framesDir, `frame_${String(i).padStart(3, "0")}.png`);
    try { await rename(from, to); }
    catch (e) { return { ok: false, error: `rename frame ${i}: ${e.message}` }; }
  }

  const gifPath = path.join(outDir, "turntable.gif");
  const r2 = await runCmd("ffmpeg", [
    "-y",
    "-framerate", String(TURNTABLE_FPS),
    "-i", path.join(framesDir, "frame_%03d.png"),
    "-vf", `split[s0][s1];[s0]palettegen=max_colors=${TURNTABLE_PALETTE_COLORS}[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0",
    gifPath,
  ]);
  if (r2.code !== 0) {
    return { ok: false, error: `ffmpeg: ${oneLine(r2.err).slice(0, 240)}` };
  }
  return { ok: true, gif: gifPath };
}

async function postRender(filePath, outDir) {
  const t0 = Date.now();
  console.log(`    rendering 4 stills (${STILL_SIZE}px)...`);
  const stills = await renderStills(filePath, outDir);
  if (!stills.ok) return { ok: false, error: `stills: ${stills.error}` };
  console.log(`    rendering ${TURNTABLE_FRAMES}-frame turntable (180°, ${TURNTABLE_SIZE}px)...`);
  const gif = await renderTurntable(filePath, outDir);
  if (!gif.ok) return { ok: false, error: `turntable: ${gif.error}` };
  return { ok: true, elapsed: ((Date.now() - t0) / 1000).toFixed(1) };
}

// ──────────────────────────────────────────────────────────────────
// Comparison: spawn claude-sonnet to write COMPARISON.md per slug
// ──────────────────────────────────────────────────────────────────
function buildComparisonPrompt({ slug, description, refPaths, engineEntries, outPath }) {
  const refsBlock = refPaths.length === 0
    ? "(none — only the text description was given)"
    : refPaths.map((p) => `- ${p}`).join("\n");

  const enginesBlock = engineEntries.map((e) => {
    const meta = [`agent ${e.agent_seconds || "?"}s`, `parts ${e.partsCount}`,
                  `params ${e.paramCount}`, `model ${(e.modelBytes / 1024).toFixed(1)}KB`].join(", ");
    return `### ${e.engine}\n- hero.png: ${e.hero_path}\n- model.forge.js: ${e.model_path}\n- meta: ${meta}`;
  }).join("\n\n");

  return `You are reviewing how ${engineEntries.length} different AI coding agents built the same parametric ForgeCAD model.

ORIGINAL PROMPT:
${description}

REFERENCE IMAGES (the real product the model should resemble — use the Read tool on each):
${refsBlock}

ENGINE OUTPUTS (Read the hero.png of each; optionally skim the .forge.js for structure):
${enginesBlock}

YOUR TASK:
Write a comparison review to: ${outPath}
Use the Write tool. The file must be valid Markdown. Cover, in order:

1. **Overall verdict** — which engine got closest to the reference, in one sentence.
2. **Per-engine notes** — short bullet list per engine: what each got right, what each got wrong vs the reference. Be specific (proportions, missing/extra parts, color, materials, layout).
3. **Common failures** — what both/all engines got wrong.
4. **Recommendation** — if a user wanted the best result for this slug, which engine should they use, and why.

Be concise (250-400 words total). No preamble, no filler, no "I think". Start the file with "# ${slug}" as the H1.
Don't dump engine source code. Don't restate the prompt.
Do not create any other files. Final assistant response: 1 sentence max.`;
}

function countOccurrences(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

async function gatherEngineStats(slug, results) {
  const engineEntries = [];
  for (const [key, r] of results) {
    if (!key.startsWith(`${slug}::`)) continue;
    if (r.status !== "done") continue;
    const modelPath = path.join(REPO_ROOT, r.model_path);
    const heroPath  = path.join(REPO_ROOT, r.hero_path);
    if (!(await fileExists(modelPath)) || !(await fileExists(heroPath))) continue;
    const modelText = await readFile(modelPath, "utf-8");
    const modelBytes = (await stat(modelPath)).size;
    const partsCount = countOccurrences(modelText, /name\s*:/g);
    const paramCount = countOccurrences(modelText, /Param\.(number|bool|choice|string|list)\s*\(/g);
    engineEntries.push({
      engine: r.engine,
      hero_path: r.hero_path,
      model_path: r.model_path,
      agent_seconds: r.agent_seconds,
      render_seconds: r.render_seconds,
      modelBytes,
      partsCount,
      paramCount,
    });
  }
  engineEntries.sort((a, b) => a.engine.localeCompare(b.engine));
  return engineEntries;
}

function metricsHeader(slug, prompt, refPaths, engineEntries, elapsedSec) {
  const rows = engineEntries.map((e) =>
    `| ${e.engine} | ${e.agent_seconds || "-"}s | ${e.render_seconds || "-"}s | ${(e.modelBytes / 1024).toFixed(1)}KB | ${e.partsCount} | ${e.paramCount} |`,
  ).join("\n");
  const refsLine = refPaths.length === 0 ? "(none)" : `${refPaths.length} image(s)`;
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  return `<!--
Auto-generated by generate.mjs on ${ts}
prompt: ${prompt.replace(/\n/g, " ").slice(0, 220)}
refs: ${refsLine}
comparison generated in ${elapsedSec}s by claude-sonnet
-->

## metrics

| engine | agent | render | source | parts | params |
|---|---|---|---|---|---|
${rows}

---

`;
}

async function generateComparison(slug, row, results) {
  const engineEntries = await gatherEngineStats(slug, results);
  if (engineEntries.length < 2) {
    return { skip: `only ${engineEntries.length} engine(s) done — need ≥2` };
  }
  const slugDir = path.join(PROJECTS_DIR, slug);
  const outPath = path.join(slugDir, "COMPARISON.md");

  const refPaths = await ensureRefs(slug, row.reference_urls);
  const prompt = buildComparisonPrompt({
    slug,
    description: row.prompt,
    refPaths,
    engineEntries,
    outPath,
  });

  const t0 = Date.now();
  const { code, killed } = await runAgent({
    bin: "claude",
    args: [
      "-p",
      "--dangerously-skip-permissions",
      "--no-session-persistence",
      "--model", "sonnet",
      "--add-dir", REPO_ROOT,
      "--output-format", "text",
      prompt,
    ],
    cwd: REPO_ROOT,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (killed) return { error: `comparison timeout after ${elapsed}s` };
  if (code !== 0) return { error: `comparison agent exited ${code} after ${elapsed}s` };
  if (!(await fileExists(outPath))) return { error: `comparison agent exited 0 but ${path.relative(REPO_ROOT, outPath)} not found` };

  // Prepend metrics header.
  const body = await readFile(outPath, "utf-8");
  const header = metricsHeader(slug, row.prompt, refPaths, engineEntries, elapsed);
  // If the body already starts with "# slug", insert header right after the H1.
  const h1Match = body.match(/^# [^\n]*\n/);
  let final;
  if (h1Match) {
    final = body.slice(0, h1Match[0].length) + "\n" + header + body.slice(h1Match[0].length).trimStart();
  } else {
    final = `# ${slug}\n\n${header}${body}`;
  }
  await writeFile(outPath, final);
  return { ok: true, elapsed, outPath };
}

async function comparisonNeeded(slug, results) {
  const slugDir = path.join(PROJECTS_DIR, slug);
  const outPath = path.join(slugDir, "COMPARISON.md");
  const engineEntries = await gatherEngineStats(slug, results);
  if (engineEntries.length < 2) return false;
  if (!(await fileExists(outPath))) return true;
  const cmpStat = await stat(outPath);
  for (const e of engineEntries) {
    const heroAbs = path.join(REPO_ROOT, e.hero_path);
    if (!(await fileExists(heroAbs))) continue;
    const heroStat = await stat(heroAbs);
    if (heroStat.mtimeMs > cmpStat.mtimeMs) return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────
// One (slug × engine) job
// ──────────────────────────────────────────────────────────────────
async function runJob({ row, engine, contextText, force }) {
  const slug = row.slug;
  const engineDir = path.join(PROJECTS_DIR, slug, engine);
  const rendersDir = path.join(engineDir, "renders");
  const outputPath = path.join(engineDir, "model.forge.js");
  const heroPath = path.join(rendersDir, "hero.png");
  const gifPath = path.join(rendersDir, "turntable.gif");
  const validationPng = path.join("/tmp", `${slug}-${engine}-validate.png`);

  await mkdir(engineDir, { recursive: true });

  const result = {
    slug,
    engine,
    status: "pending",
    model_path: path.relative(REPO_ROOT, outputPath),
    hero_path: path.relative(REPO_ROOT, heroPath),
    gif_path: path.relative(REPO_ROOT, gifPath),
    agent_seconds: "",
    render_seconds: "",
    error: "",
  };

  try {
    const refPaths = await ensureRefs(slug, row.reference_urls);
    const prompt = buildPromptForEngine(engine, {
      slug,
      description: row.prompt,
      refPaths,
      outputPath,
      validationPng,
      contextText,
    });
    const cmd = ENGINES[engine].buildCmd({ prompt, refPaths, engineDir });

    console.log(`    spawning ${cmd.bin} (${engine}, prompt ${(prompt.length / 1024).toFixed(0)}KB${cmd.stdin ? " via stdin" : ""})...`);
    const t0 = Date.now();
    const { code, killed, stdout, stderr } = await runAgent(cmd);
    const agentSec = ((Date.now() - t0) / 1000).toFixed(1);
    result.agent_seconds = agentSec;

    // Scan agent output for rate-limit / quota signals before declaring success or failure.
    const rl = detectRateLimit(stdout + "\n" + stderr);
    if (rl) {
      result.status = "rate-limited";
      result.error = `rate-limit signal "${rl.pattern}" in agent output: …${rl.snippet}…`;
      result.rateLimited = true;
      return result;
    }

    if (killed) {
      result.status = "failed";
      result.error = `timeout after ${agentSec}s`;
      return result;
    }
    if (code !== 0) {
      result.status = "failed";
      result.error = `${cmd.bin} exited ${code} after ${agentSec}s`;
      return result;
    }
    if (!(await fileExists(outputPath))) {
      result.status = "failed";
      result.error = `${cmd.bin} exited 0 but ${result.model_path} not found`;
      return result;
    }

    const verify = await verifyForgecadRun(outputPath);
    if (verify.code !== 0) {
      result.status = "failed";
      result.error = `forgecad run exited ${verify.code}: ${oneLine(verify.err || verify.out).slice(0, 240)}`;
      return result;
    }

    const post = await postRender(outputPath, rendersDir);
    if (!post.ok) {
      result.status = "done-no-renders";
      result.error = post.error;
      return result;
    }
    result.render_seconds = post.elapsed;
    result.status = "done";
    return result;
  } catch (e) {
    result.status = "failed";
    result.error = `runner error: ${oneLine(String(e?.message || e)).slice(0, 240)}`;
    return result;
  }
}

// ──────────────────────────────────────────────────────────────────
// Render-only re-render of existing project artifacts
// ──────────────────────────────────────────────────────────────────
async function renderOnlyJob(row, engine) {
  const slug = row.slug;
  const engineDir = path.join(PROJECTS_DIR, slug, engine);
  const rendersDir = path.join(engineDir, "renders");
  const outputPath = path.join(engineDir, "model.forge.js");
  if (!(await fileExists(outputPath))) return { skip: `${path.relative(REPO_ROOT, outputPath)} not found` };
  const verify = await verifyForgecadRun(outputPath);
  if (verify.code !== 0) return { skip: `forgecad run failed: ${oneLine(verify.err || verify.out).slice(0, 200)}` };
  const post = await postRender(outputPath, rendersDir);
  if (!post.ok) return { error: post.error };
  return { ok: true, elapsed: post.elapsed };
}

// ──────────────────────────────────────────────────────────────────
// Results gallery (README.md auto-section)
// ──────────────────────────────────────────────────────────────────
const GALLERY_START = "<!-- RESULTS_GALLERY_START -->";
const GALLERY_END   = "<!-- RESULTS_GALLERY_END -->";

function escapeCell(text) {
  return (text || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function truncate(text, n) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

async function pickRefImage(slug) {
  const dir = path.join(REFS_DIR, slug);
  if (!(await fileExists(dir))) return null;
  const files = (await readdir(dir))
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort();
  return files[0] ? `_refs/${slug}/${files[0]}` : null;
}

async function renderResultsGallery() {
  const { rows: promptRows } = parseCsv(await readFile(CSV_PATH, "utf-8"));
  const promptBySlug = new Map(promptRows.map((r) => [r.slug, r]));
  const results = await loadResults();

  const sorted = [...results.values()]
    .filter((r) => r.status === "done")
    .sort((a, b) => a.slug.localeCompare(b.slug) || a.engine.localeCompare(b.engine));

  const lines = [
    "| prompt | reference | model | outcome (turntable) |",
    "|---|---|---|---|",
  ];

  for (const r of sorted) {
    const promptRow = promptBySlug.get(r.slug);
    const promptText = promptRow ? promptRow.prompt : "";
    const promptCell = `**${r.slug}**<br>${escapeCell(truncate(promptText, 220))}`;

    const refRel = await pickRefImage(r.slug);
    const refCell = refRel ? `<img src="${refRel}" width="200">` : "—";

    let outcomeCell = "—";
    const gifAbs = r.gif_path ? path.join(REPO_ROOT, r.gif_path) : null;
    const heroAbs = r.hero_path ? path.join(REPO_ROOT, r.hero_path) : null;
    if (gifAbs && await fileExists(gifAbs)) {
      outcomeCell = `<img src="${path.relative(HERE, gifAbs)}" width="240">`;
    } else if (heroAbs && await fileExists(heroAbs)) {
      outcomeCell = `<img src="${path.relative(HERE, heroAbs)}" width="240">`;
    }

    lines.push(`| ${promptCell} | ${refCell} | \`${r.engine}\` | ${outcomeCell} |`);
  }

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const block = `${GALLERY_START}\n<!-- auto-generated by generate.mjs on ${ts} — ${sorted.length} result(s). DO NOT EDIT BY HAND between these markers. -->\n\n${lines.join("\n")}\n\n${GALLERY_END}`;

  const readmePath = path.join(HERE, "README.md");
  let readme = await readFile(readmePath, "utf-8");
  const s = readme.indexOf(GALLERY_START);
  const e = readme.indexOf(GALLERY_END);
  if (s >= 0 && e > s) {
    readme = readme.slice(0, s) + block + readme.slice(e + GALLERY_END.length);
  } else {
    // First-time install: append a new section.
    readme = readme.trimEnd() + `\n\n## Results gallery\n\n${block}\n`;
  }
  await writeFile(readmePath, readme);
  console.log(`  gallery: ${sorted.length} row(s) → README.md`);
}

// ──────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const slugFilter = pickArg(args, "--slug");
  const slugsArg = pickArg(args, "--slugs");
  const slugsAllowlist = slugsArg
    ? new Set(slugsArg.split(",").map((s) => s.trim()).filter(Boolean))
    : null;
  const engineFilter = pickArg(args, "--engine");
  const renderOnly = args.includes("--render-only");
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  if (engineFilter && !ENGINES[engineFilter]) {
    console.error(`Unknown engine: ${engineFilter}. Known: ${Object.keys(ENGINES).join(", ")}`);
    process.exit(2);
  }

  const csvText = await readFile(CSV_PATH, "utf-8");
  const { rows: promptRows } = parseCsv(csvText);

  await mkdir(REFS_DIR, { recursive: true });
  await mkdir(PROJECTS_DIR, { recursive: true });

  // Resolve engines per row.
  for (const row of promptRows) {
    const declared = (row.engines || "").trim();
    row._engines = declared
      ? declared.split("|").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_ENGINES;
    for (const e of row._engines) {
      if (!ENGINES[e]) {
        throw new Error(`Row ${row.slug}: unknown engine "${e}" (known: ${Object.keys(ENGINES).join(", ")})`);
      }
    }
  }

  const results = await loadResults();

  // Build job list. If --engine is set, it OVERRIDES the row's engines column,
  // letting you run any (slug × engine) combination without editing the CSV.
  const jobs = [];
  for (const row of promptRows) {
    if (slugFilter && row.slug !== slugFilter) continue;
    if (slugsAllowlist && !slugsAllowlist.has(row.slug)) continue;
    const engines = engineFilter ? [engineFilter] : row._engines;
    for (const engine of engines) {
      const key = `${row.slug}::${engine}`;
      const existing = results.get(key);
      if (!renderOnly && !force && existing && existing.status === "done") continue;
      jobs.push({ row, engine, key });
    }
  }

  // Also consider slugs that need a fresh COMPARISON.md (e.g. completed in a previous run).
  // Respect both --slug and --slugs filters so the user can scope this loop too.
  const allCandidateSlugs = [...new Set(promptRows
    .filter((r) => !slugFilter || r.slug === slugFilter)
    .filter((r) => !slugsAllowlist || slugsAllowlist.has(r.slug))
    .map((r) => r.slug))];
  const compareCandidates = [];
  for (const slug of allCandidateSlugs) {
    if (await comparisonNeeded(slug, results)) compareCandidates.push(slug);
  }

  if (jobs.length === 0 && compareCandidates.length === 0) {
    console.log("No jobs to run (use --force to re-run already-done pairs).");
    // Still refresh the gallery so manual CSV edits / external renders show up.
    await renderResultsGallery();
    return;
  }

  console.log(`Plan: ${jobs.length} agent job(s)${renderOnly ? " [render-only]" : ""}, ${compareCandidates.length} comparison(s):`);
  for (const j of jobs) console.log(`  - ${j.row.slug} × ${j.engine}`);
  for (const s of compareCandidates) console.log(`  - ${s} × comparison`);
  if (dryRun) { console.log("\n(dry run, exiting)"); return; }

  // Pre-generate codex context if needed.
  const needsContext = jobs.some((j) => ENGINES[j.engine].needsContext);
  const contextText = needsContext && !renderOnly ? await readFile(await ensureContext(), "utf-8") : "";

  for (const job of jobs) {
    console.log(`\n══════ ${job.row.slug} × ${job.engine} ══════`);
    if (renderOnly) {
      const r = await renderOnlyJob(job.row, job.engine);
      if (r.skip) { console.log(`  → skip: ${r.skip}`); continue; }
      const existing = results.get(job.key) || {
        slug: job.row.slug, engine: job.engine, status: "done",
        model_path: path.relative(REPO_ROOT, path.join(PROJECTS_DIR, job.row.slug, job.engine, "model.forge.js")),
        hero_path: path.relative(REPO_ROOT, path.join(PROJECTS_DIR, job.row.slug, job.engine, "renders", "hero.png")),
        gif_path: path.relative(REPO_ROOT, path.join(PROJECTS_DIR, job.row.slug, job.engine, "renders", "turntable.gif")),
        agent_seconds: "",
        render_seconds: "",
        error: "",
      };
      if (r.ok) {
        existing.status = "done";
        existing.render_seconds = r.elapsed;
        existing.error = "";
        console.log(`  → re-rendered in ${r.elapsed}s`);
      } else {
        existing.status = "done-no-renders";
        existing.error = r.error;
        console.log(`  → render failed: ${r.error}`);
      }
      results.set(job.key, existing);
      await saveResults(results);
      continue;
    }

    const out = await runJob({ row: job.row, engine: job.engine, contextText, force });
    // Don't persist the transient flag.
    const rateLimited = out.rateLimited;
    delete out.rateLimited;
    results.set(job.key, out);
    await saveResults(results);
    const tail = out.status === "done"
      ? `agent ${out.agent_seconds}s, renders ${out.render_seconds}s`
      : (out.error || "(no detail)");
    console.log(`  → ${out.status}: ${tail}`);
    if (rateLimited) {
      console.error(`\n⛔ rate-limit / quota signal detected on ${job.row.slug} × ${job.engine}.`);
      console.error(`   Aborting remaining ${jobs.length - jobs.indexOf(job) - 1} job(s). Resume later with the same command.`);
      process.exit(3);
    }
  }

  // Generate / refresh COMPARISON.md per touched slug, plus any pre-existing slug whose comparison is stale or missing.
  const comparisonSlugs = [...new Set([
    ...jobs.map((j) => j.row.slug),
    ...compareCandidates,
  ])];
  for (const slug of comparisonSlugs) {
    if (!(await comparisonNeeded(slug, results))) continue;
    const row = promptRows.find((r) => r.slug === slug);
    if (!row) continue;
    console.log(`\n══════ ${slug} × comparison ══════`);
    const r = await generateComparison(slug, row, results);
    if (r.skip) { console.log(`  → skip: ${r.skip}`); continue; }
    if (r.error) { console.log(`  → failed: ${r.error}`); continue; }
    console.log(`  → ok in ${r.elapsed}s: ${path.relative(REPO_ROOT, r.outPath)}`);
  }

  // Always refresh the README gallery as the final step.
  await renderResultsGallery();
}

function pickArg(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function oneLine(s) { return s.replace(/\s+/g, " ").trim(); }

main().catch((e) => { console.error(e); process.exit(1); });
