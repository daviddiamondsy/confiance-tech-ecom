#!/bin/bash

# Confiance Tech E-commerce Startup Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$REPO_DIR")"
PID_FILE="$REPO_DIR/confiance.pid"
LOG_FILE="$PROJECT_ROOT/logs/confiance.log"
mkdir -p "$PROJECT_ROOT/logs"

echo -e "${BLUE}=== Starting Confiance Tech E-commerce ===${NC}"

# Check if package.json exists
if [ ! -f "$REPO_DIR/package.json" ]; then
    echo -e "${YELLOW}No package.json found, skipping confiance-tech-ecom${NC}"
    exit 0
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    cd "$REPO_DIR"
    npm install
fi

# Kill any existing process on port 3002
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Killing process on port 3002...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start Next.js dev server
echo -e "${YELLOW}Starting Next.js on port 3002...${NC}"
cd "$REPO_DIR"
PORT=3002 npm run dev > "$LOG_FILE" 2>&1 &
CONFIA_PID=$!
echo $CONFIA_PID > "$PID_FILE"

echo -e "${GREEN}Confiance Tech E-commerce started on port 3002 (PID: $CONFIA_PID)${NC}"
echo -e "${YELLOW}Log: $LOG_FILE${NC}"
echo -e "${YELLOW}View logs with: tail -f $LOG_FILE${NC}"
