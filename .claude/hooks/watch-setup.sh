#!/bin/bash
# Gets the /watch plugin (watch@claude-video) ready in fresh cloud sessions:
# installs yt-dlp, points it at Node for YouTube, and runs the plugin's setup.
set -u

# Local machines keep their own install; only cloud containers start empty.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

export PATH="$HOME/.local/bin:$PATH"

if ! command -v yt-dlp >/dev/null 2>&1; then
  uv tool install "yt-dlp[default,curl-cffi]" >/dev/null 2>&1 \
    || pip install --quiet "yt-dlp[default,curl-cffi]" >/dev/null 2>&1
fi

# Deno isn't reachable from the sandbox; Node works as yt-dlp's JS runtime.
mkdir -p "$HOME/.config/yt-dlp"
[ -f "$HOME/.config/yt-dlp/config" ] || echo "--js-runtimes node" > "$HOME/.config/yt-dlp/config"

# Default to the no-key setup (local frames + captions). Skipped once configured.
setup=$(ls "$HOME"/.claude/plugins/cache/claude-video/watch/*/skills/watch/scripts/setup.py 2>/dev/null | tail -1)
if [ -n "$setup" ] && ! grep -Eq '^SETUP_COMPLETE="?true"?$' "$HOME/.config/watch/.env" 2>/dev/null; then
  python3 "$setup" --engine local >/dev/null 2>&1
  python3 "$setup" --backend none --detail balanced >/dev/null 2>&1
fi

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$HOME/.local/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
exit 0
