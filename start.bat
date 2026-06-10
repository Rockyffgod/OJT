@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Karma - Starting Development Servers
echo ============================================
echo.

REM ---- Verify setup has been run ----
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Setup not complete. Run setup.bat first.
    pause
    exit /b 1
)
if not exist "backend\venv\Lib\site-packages\django" (
    echo [ERROR] Python packages not installed. Run setup.bat first.
    pause
    exit /b 1
)
if not exist "Karma\node_modules" (
    echo [ERROR] Frontend packages not installed. Run setup.bat first.
    pause
    exit /b 1
)

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
echo Press any key to stop servers...
pause

REM ---- Kill server processes ----
echo [INFO] Stopping servers...
taskkill /f /fi "WINDOWTITLE eq Karma-Django" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Karma-Vite" >nul 2>&1
echo [OK] Servers stopped
