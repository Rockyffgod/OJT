@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Karma - One-Time Setup (Windows)
echo ============================================
echo.

REM ---- Check Python ----
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found

REM ---- Create virtual environment ----
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Creating virtual environment...
    python -m venv backend\venv
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
) else (
    echo [OK] Virtual environment already exists
)

REM ---- Activate and install deps ----
call backend\venv\Scripts\activate.bat
echo [INFO] Installing Python packages...
pip install -r backend\requirements.txt
if !ERRORLEVEL! neq 0 (
    echo [ERROR] pip install failed
    pause
    exit /b 1
)
echo [OK] Python packages installed

REM ---- Run migrations ----
echo [INFO] Running migrations...
python backend\manage.py migrate
echo [OK] Migrations complete

REM ---- Seed data ----
echo [INFO] Seeding database...
python backend\manage.py seed_demo
echo [OK] Seed data loaded

REM ---- Install frontend deps ----
if not exist "Karma\node_modules" (
    echo [INFO] Installing frontend packages...
    cd Karma
    npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend packages installed
) else (
    echo [OK] Frontend packages already installed
)

echo.
echo ============================================
echo   Setup complete! Run start.bat to launch.
echo ============================================
pause
