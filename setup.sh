#!/usr/bin/env bash
set -e

# Karma - One-Time Setup (Linux/Mac)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Karma - One-Time Setup (Linux/Mac)"
echo "============================================"
echo ""

# ---- Check Python ----
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] Python 3 is not installed. Install Python 3.10+ from https://python.org"
    exit 1
fi
echo "[OK] Python found: $(python3 --version)"

# ---- Create virtual environment ----
if [ ! -f "backend/venv/bin/python3" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv backend/venv
else
    echo "[OK] Virtual environment already exists"
fi
source backend/venv/bin/activate

# ---- Install Python deps ----
echo "[INFO] Installing Python packages..."
pip install -r backend/requirements.txt
echo "[OK] Python packages installed"

# ---- Run migrations ----
echo "[INFO] Running migrations..."
python3 backend/manage.py migrate
echo "[OK] Migrations complete"

# ---- Seed data ----
echo "[INFO] Seeding database..."
python3 backend/manage.py seed_providers
echo "[OK] Seed data loaded"

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
echo "  Setup complete! Run ./start.sh to launch."
echo "============================================"
