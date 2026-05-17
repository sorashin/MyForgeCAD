#!/bin/bash
# Wrapper invoked by launchd for the daily ForgeCAD multi-engine generation job.
# Runs `node generate.mjs` in pending-only mode, captures all output to _logs/run.log
# with a timestamped fence so successive runs are easy to scan.
#
# Manually trigger:    bash scheduled-run.sh
# launchctl trigger:   launchctl kickstart -k gui/$(id -u)/com.shintaro.forgecad-pipeline

set -u

REPO_ROOT="/Users/shintaro/dev/ForgeCAD"
RUNNER="$REPO_ROOT/examples/my-example/generate.mjs"
LOG_DIR="$REPO_ROOT/examples/my-example/_logs"
LOG_FILE="$LOG_DIR/run.log"
LOCK_FILE="$LOG_DIR/run.lock"

mkdir -p "$LOG_DIR"

# Single-instance guard: skip if a prior run is still in progress.
if [[ -f "$LOCK_FILE" ]]; then
  PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') skip: previous run (pid $PID) still active" >> "$LOG_FILE"
    exit 0
  fi
fi
echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Load the user's full login environment so nodenv shims, CLI auth, and PATH resolve.
exec /bin/zsh -lc "
  cd '$REPO_ROOT' && {
    printf '\n=== %s ===\n' \"\$(date '+%Y-%m-%d %H:%M:%S')\"
    node '$RUNNER'
    EXIT=\$?
    printf '=== finished %s (exit %d) ===\n' \"\$(date '+%Y-%m-%d %H:%M:%S')\" \"\$EXIT\"
    exit \$EXIT
  } >> '$LOG_FILE' 2>&1
"
