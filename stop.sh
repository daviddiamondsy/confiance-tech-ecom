#!/bin/bash
# Stop Confiance Next.js dev server on port 3002

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$REPO_DIR/confiance.pid"

if [ -f "$PID_FILE" ]; then
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  rm -f "$PID_FILE"
fi

if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
  lsof -ti:3002 | xargs kill -9 2>/dev/null || true
fi

echo "Stopped Confiance (port 3002)"
