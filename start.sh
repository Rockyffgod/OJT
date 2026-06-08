#!/usr/bin/env bash
set -e

# Karma - Development Startup Script (Linux/Mac)
# Auto-creates venv, installs deps, checks for Node.js, starts both servers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Karma - Starting Development Environment"
echo "============================================"
echo ""

# ---- Check Python ----
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] Python 3 is not installed. Please install Python 3.10+ from https://python.org"
    exit 1
fi
echo "[OK] Python found: $(python3 --version)"

# ---- Backend venv ----
if [ ! -f "backend/venv/bin/python3" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv backend/venv
fi
source backend/venv/bin/activate
echo "[OK] Virtual environment ready"

# ---- Install Python deps ----
if [ ! -f "backend/venv/bin/django-admin" ]; then
    echo "[INFO] Installing Python packages..."
    pip install -r backend/requirements.txt
    echo "[OK] Python packages installed"
else
    echo "[OK] Python packages already installed"
fi

# ---- Run Django migrations ----
echo "[INFO] Running migrations..."
python3 backend/manage.py migrate --run-syncdb 2>/dev/null || true
echo "[OK] Migrations up to date"

# ---- Check Node.js / npm ----
if ! command -v node &>/dev/null; then
    echo "[INFO] Node.js not found. Installing via nvm..."
    if command -v brew &>/dev/null; then
        brew install node
    elif command -v apt-get &>/dev/null; then
        sudo apt-get update && sudo apt-get install -y nodejs npm
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y nodejs npm
    else
        echo "[ERROR] Please install Node.js manually from https://nodejs.org"
        exit 1
    fi
    echo "[OK] Node.js installed"
else
    echo "[OK] Node.js found: $(node --version)"
fi

# ---- Install frontend deps ----
if [ ! -d "Karma/node_modules" ]; then
    echo "[INFO] Installing frontend packages..."
    cd Karma
    npm install
    cd ..
    echo "[OK] Frontend packages installed"
else
    echo "[OK] Frontend packages already installed"
fi

echo ""
echo "============================================"
echo "  Starting servers..."
echo "============================================"
echo ""

# ---- Start Django backend ----
echo "[INFO] Starting Django backend on http://localhost:8000"
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
