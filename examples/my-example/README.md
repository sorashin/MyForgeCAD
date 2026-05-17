# my-example — multi-engine batch model generation

Spreadsheet-driven ForgeCAD model generation that runs the **same prompt** against multiple agent + model combos (currently Claude Sonnet/Opus and Codex GPT) and saves each as its own project under `projects/{slug}/{engine}/`. Renders 4 canonical stills + a 180° turntable GIF per project.

## Setup

- Node 18+ (tested on 22)
- `claude` CLI on PATH, authenticated
- `codex` CLI on PATH, authenticated (default model from `~/.codex/config.toml`)
- `forgecad` CLI on PATH, authenticated
- ForgeCAD agent skills installed (`forgecad skill install` + symlinked into `~/.claude/skills/` for Claude). Codex doesn't read skill dirs, so the runner injects the full ForgeCAD context blob inline (generated once via `forgecad skill one-file` and cached at `_context/forgecad.md`).
- `ffmpeg` on PATH (for turntable GIF assembly)

## Files

| File | Purpose |
|---|---|
| `prompts.csv` | Source of truth. One row per object. Edit by hand |
| `results.csv` | Auto-generated. One row per (slug × engine) with status, timing, paths |
| `generate.mjs` | Runner. Zero npm deps |
| `_refs/{slug}/...` | Cached reference images |
| `_context/forgecad.md` | Cached ForgeCAD knowledge blob (gitignore-able) |
| `projects/{slug}/{engine}/model.forge.js` | Generated model |
| `projects/{slug}/{engine}/renders/{hero,front,side,top}.png` | Canonical stills |
| `projects/{slug}/{engine}/renders/turntable.gif` | 180° rotation around Z, 18 frames @ 12fps |

## `prompts.csv` schema

| Column | Required | Notes |
|---|---|---|
| `slug` | ✅ | kebab-case. Becomes the folder name under `projects/` |
| `prompt` | ✅ | Japanese/English ok. Describe the object, dimensions, style |
| `reference_urls` |  | `\|`-separated image URLs (jpg/png/webp). Empty = text-only |
| `engines` |  | `\|`-separated engine names. Empty = use `DEFAULT_ENGINES` in `generate.mjs` |
| `notes` |  | Free-form for your own bookkeeping |

Commas inside `prompt` must be quoted with `"`; internal `"` is escaped as `""`.

## Engines

Configured in `generate.mjs` under `ENGINES`. Currently:

| Name | Backend | Notes |
|---|---|---|
| `claude-sonnet` | `claude -p --model sonnet` | Fast & cheap baseline |
| `claude-opus-4.7` | `claude -p --model opus` | Higher quality, slower (~1.5–2x) |
| `codex-gpt-5.5` | `codex exec -m gpt-5.5` | Uses OpenAI's Codex CLI. Prompt sent via stdin (avoids ARG_MAX with the inlined context) |

Default set: `["claude-opus-4.7", "codex-gpt-5.5"]`. Override by editing `DEFAULT_ENGINES` or by setting the `engines` column per row.

## Run

```bash
# all rows × default engines (skip pairs already in results.csv as "done")
node examples/my-example/generate.mjs

# one specific slug, all its engines
node examples/my-example/generate.mjs --slug desk-clock-001

# one specific engine across all rows
node examples/my-example/generate.mjs --engine codex-gpt-5.5

# one specific (slug × engine) pair
node examples/my-example/generate.mjs --slug desk-clock-001 --engine claude-opus-4.7

# re-run even if results.csv says "done"
node examples/my-example/generate.mjs --slug foo --force

# re-render existing model.forge.js files in-place (no agent spawn — fast)
node examples/my-example/generate.mjs --render-only
node examples/my-example/generate.mjs --slug foo --render-only

# parse + plan only
node examples/my-example/generate.mjs --dry-run
```

## What happens per (slug × engine) job

1. Reference URLs (if any) are downloaded to `_refs/{slug}/` (cached).
2. The runner builds an engine-appropriate prompt:
   - **claude**: short, references the `/forgecad-make-a-model` skill (which loads `/forgecad`).
   - **codex**: prepends the full ForgeCAD context blob (~388KB), then the task. Sent via stdin.
3. The agent is spawned (`claude -p` or `codex exec`) and writes `projects/{slug}/{engine}/model.forge.js`. It also runs `forgecad run` and a validation render at `/tmp/{slug}-{engine}-validate.png` to verify before returning.
4. The runner re-runs `forgecad run` to confirm, then renders the canonical deliverables:
   - 4 stills (hero/front/side/top) via single multi-camera `forgecad render 3d` invocation.
   - 18-frame 180° turntable: multi-camera render → rename to sequential frames → `ffmpeg` palettegen + paletteuse → GIF.
5. `results.csv` is rewritten after every job.

## Tuning

Render settings live as constants near the top of `generate.mjs`:

| Constant | Default | Effect |
|---|---|---|
| `STILL_SIZE` | 700 | Pixel size of the 4 still PNGs |
| `STILL_VIEWS` | hero/front/side/top | Add/remove canonical angles |
| `TURNTABLE_FRAMES` | 18 | Frames over the 180° sweep |
| `TURNTABLE_PITCH` | 25 | Camera elevation for the GIF |
| `TURNTABLE_SIZE` | 480 | Pixel size of GIF frames |
| `TURNTABLE_FPS` | 12 | Playback rate |
| `TURNTABLE_PALETTE_COLORS` | 128 | ffmpeg palettegen — lower = smaller GIF |
| `PER_ROW_TIMEOUT_MS` | 15 min | Per-job timeout (agent only — render is separate) |

To add a new engine, append to `ENGINES` and (optionally) to `DEFAULT_ENGINES`.

## results.csv columns

| Column | Notes |
|---|---|
| `slug`, `engine` | Composite key |
| `status` | `done` / `done-no-renders` / `failed` / `pending` |
| `model_path`, `hero_path`, `gif_path` | Repo-relative paths to artifacts |
| `agent_seconds` | Time spent in the agent subprocess |
| `render_seconds` | Time spent in `forgecad render 3d` + ffmpeg |
| `error` | Failure detail if status ≠ `done` |

## Comparison logs

After all engines for a slug complete (and on every subsequent run when a new engine result appears), the runner spawns **claude-sonnet** with the prompt + reference images + every engine's `hero.png` and writes `projects/{slug}/COMPARISON.md`. The file starts with an auto-generated metrics header (agent time, render time, model file size, parts count, param count per engine), then the LLM-written review covering: overall verdict, per-engine right/wrong, common failures, recommendation. ~$0.10 per slug, ~45s.

Trigger manually for an existing slug with both engines done:
```bash
node examples/my-example/generate.mjs --slug analogue-pocket-aluminum
# planner reports "0 agent job(s), 1 comparison(s)" and runs only the comparison
```

## Scheduling (macOS launchd)

A daily 09:00 run is set up via `com.shintaro.forgecad-pipeline.plist`. It processes only `pending` (slug × engine) pairs that aren't in `results.csv` as `done`, then generates / refreshes COMPARISON.md for any slug whose review is missing or stale.

**Install** (one time):
```bash
cp examples/my-example/com.shintaro.forgecad-pipeline.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.shintaro.forgecad-pipeline.plist
launchctl print gui/$(id -u)/com.shintaro.forgecad-pipeline | head -20    # verify loaded
```

**Manually fire it right now** (without waiting for 09:00):
```bash
launchctl kickstart -k gui/$(id -u)/com.shintaro.forgecad-pipeline
tail -f examples/my-example/_logs/run.log
```

**Or run the wrapper directly** (no launchd involved):
```bash
bash examples/my-example/scheduled-run.sh
```

**Disable / uninstall**:
```bash
launchctl bootout gui/$(id -u)/com.shintaro.forgecad-pipeline
rm ~/Library/LaunchAgents/com.shintaro.forgecad-pipeline.plist
```

**Change the time**: edit `Hour` / `Minute` in the plist, then `bootout` + `bootstrap` again to reload (launchd does not hot-reload changes).

**Logs**: `_logs/run.log` (timestamped per-invocation), `_logs/launchd.out.log` / `_logs/launchd.err.log` (anything launchd captures before the wrapper takes over).

**Single-instance guard**: `scheduled-run.sh` writes a `run.lock` PID file and skips if the previous day's run is still in progress.

**Cost ceiling**: pending-only mode = no work if no new prompts. If you add 1 new slug per day with the default 2 engines, expect ~$2–4/day (opus + codex + sonnet-compare).

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `forgecad run exited N: ...` | Generated code has a runtime error the agent didn't catch | Inspect `projects/{slug}/{engine}/model.forge.js`. Re-run with `--force` and a tighter prompt, or hand-fix |
| `{bin} exited 0 but model.forge.js not found` | Agent skipped writing the file | Strengthen the prompt; re-run with `--force` |
| `timeout after Ns` | Agent exceeded `PER_ROW_TIMEOUT_MS` | Increase the constant or simplify the prompt |
| `fetch ... failed: 403` | Reference URL needs auth or is hot-link protected | Save the image manually into `_refs/{slug}/01.png` and re-run (cache is honored) |
| status = `done-no-renders` | `forgecad run` passed but stills/GIF failed | Read `error`. Re-run with `--render-only --slug X` after fixing the underlying issue |
| Codex prompt too large | Inlined context blob + huge prompt + image attachments | Reduce context — generate a slimmer `_context/forgecad.md` by hand and avoid re-generating it |
