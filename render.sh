#!/usr/bin/env bash
# render.sh — Carousel Studio orchestrator
# Usage: ./render.sh <config.json>
# Steps: generate HTML slides → QA prompt → render MP4s

set -euo pipefail

CONFIG="${1:-carousel.config.json}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════╗"
echo "║      CAROUSEL STUDIO  v1.0       ║"
echo "╚══════════════════════════════════╝"
echo ""
echo "  Config : $CONFIG"
echo "  Root   : $ROOT"
echo ""

# ── Step 1: generate HTML slides ─────────────────────────────────────────────
echo "[ 1/3 ]  Generating HTML slides..."
node "$ROOT/gen.js" "$CONFIG"

# ── Step 2: QA prompt ────────────────────────────────────────────────────────
echo ""
echo "[ 2/3 ]  QA check"
echo "  Slides written to: $ROOT/slides/"
echo ""
echo "  Open any slide in a browser for a static preview:"
echo "    open $ROOT/slides/slide-01.html"
echo ""

if [ "${2:-}" != "--skip-qa" ]; then
  read -rp "  Looks good? Press Enter to start rendering, or Ctrl-C to abort. " _
fi

# ── Step 3: render to MP4 ────────────────────────────────────────────────────
echo ""
echo "[ 3/3 ]  Rendering to MP4..."
node "$ROOT/render.js" "$CONFIG"

echo ""
echo "  Output files:"
ls -lh "$ROOT/output/"*.mp4 2>/dev/null || echo "  (no MP4s found)"
echo ""
echo "  Done."
