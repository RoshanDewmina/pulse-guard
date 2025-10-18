#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking for processes on common development ports...${NC}"

# Common development ports
PORTS=(3000 3001 5173 8080 8000 4200 5000 5001)

# Kill processes on each port
for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}⚠️  Found process on port $PORT (PID: $PID)${NC}"
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Killed process on port $PORT${NC}"
        else
            echo -e "${RED}❌ Failed to kill process on port $PORT${NC}"
        fi
    fi
done

# Also kill any bun dev processes
echo -e "${YELLOW}🔍 Checking for bun dev processes...${NC}"
BDEV_PIDS=$(pgrep -f "bun.*dev" 2>/dev/null)
if [ ! -z "$BDEV_PIDS" ]; then
    echo -e "${YELLOW}⚠️  Found bun dev processes: $BDEV_PIDS${NC}"
    pkill -9 -f "bun.*dev" 2>/dev/null
    echo -e "${GREEN}✅ Killed bun dev processes${NC}"
fi

# Kill any Next.js processes
echo -e "${YELLOW}🔍 Checking for Next.js processes...${NC}"
NEXT_PIDS=$(pgrep -f "next.*start-server" 2>/dev/null)
if [ ! -z "$NEXT_PIDS" ]; then
    echo -e "${YELLOW}⚠️  Found Next.js processes: $NEXT_PIDS${NC}"
    pkill -9 -f "next.*start-server" 2>/dev/null
    echo -e "${GREEN}✅ Killed Next.js processes${NC}"
fi

# Wait a moment for ports to free up
echo -e "${YELLOW}⏳ Waiting for ports to free up...${NC}"
sleep 2

# Start the development server
echo -e "${GREEN}🚀 Starting development server...${NC}"
make dev

