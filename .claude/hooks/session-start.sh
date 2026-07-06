#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Ensure the official Claude Code plugin marketplace is registered.
if ! claude plugin marketplace list 2>/dev/null | grep -q "claude-code-plugins"; then
  claude plugin marketplace add anthropics/claude-code
fi

# Install the ralph-wiggum plugin (provides the /ralph-loop command) if not already present.
if ! claude plugin list 2>/dev/null | grep -q "ralph-wiggum@claude-code-plugins"; then
  claude plugin install ralph-wiggum@claude-code-plugins
fi

# Install the Playwright CLI globally so browser automation tools are available.
npm install -g @playwright/cli@latest
