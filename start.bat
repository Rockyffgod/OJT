@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Karma - Starting Development Environment
echo ============================================
echo.

REM ---- Check Python ----
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found

REM ---- Backend venv ----
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Creating virtual environment...
    python -m venv backend\venv
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
)
call backend\venv\Scripts\activate.bat
echo [OK] Virtual environment ready

REM ---- Install Python deps ----
if not exist "backend\venv\Lib\site-packages\django" (
    echo [INFO] Installing Python packages...
    pip install -r backend\requirements.txt
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] pip install failed
        pause
        exit /b 1
    )
    echo [OK] Python packages installed
) else (
    echo [OK] Python packages already installed
)

REM ---- Run Django migrations ----
echo [INFO] Running migrations...
python backend\manage.py migrate --run-syncdb >nul 2>&1
echo [OK] Migrations up to date

REM ---- Check Node.js / npm ----
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Node.js not found. Downloading...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'; Start-Process msiexec.exe -ArgumentList '/i \"%TEMP%\node-installer.msi\" /qn' -Wait}"
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to install Node.js. Please install manually from https://nodejs.org
        pause
        exit /b 1
    )
    echo [OK] Node.js installed
) else (
    echo [OK] Node.js found
)

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
echo   Starting servers...
echo ============================================
echo.

REM ---- Start Django backend ----
echo [INFO] Starting Django backend on http://localhost:8000
start "Karma-Django" cmd /c "call backend\venv\Scripts\activate.bat && python backend\manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul

REM ---- Start Vite frontend ----
echo [INFO] Starting Vite frontend on http://localhost:5173
start "Karma-Vite" cmd /c "cd Karma && npm run dev"

echo.
echo ============================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo ============================================
echo.
echo Press any key to stop servers...
pause

REM ---- Kill server processes ----
echo [INFO] Stopping servers...
taskkill /f /fi "WINDOWTITLE eq Karma-Django" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Karma-Vite" >nul 2>&1
echo [OK] Servers stopped
