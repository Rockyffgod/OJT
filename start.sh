#!/usr/bin/env bash
set -e

# Karma - Development Startup Script (Linux/Mac)
# Assumes setup.sh has been run once.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Karma - Starting Development Servers"
echo "============================================"
echo ""

# ---- Verify setup has been run ----
if [ ! -f "backend/venv/bin/python3" ]; then
    echo "[ERROR] Setup not complete. Run setup.sh first."
    exit 1
fi
if [ ! -d "Karma/node_modules" ]; then
    echo "[ERROR] Frontend packages not installed. Run setup.sh first."
    exit 1
fi

# ---- Start Django backend ----
echo "[INFO] Starting Django backend on http://localhost:8000"
source backend/venv/bin/activate
python3 backend/manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
sleep 2

# ---- Start Vite frontend ----
echo "[INFO] Starting Vite frontend on http://localhost:5173"
cd Karma
npx vite &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "============================================"
echo ""

# Trap Ctrl+C to stop both servers
trap "echo '[INFO] Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '[OK] Servers stopped'; exit 0" SIGINT SIGTERM

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
