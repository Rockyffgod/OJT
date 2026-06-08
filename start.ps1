# Karma - Development Startup Script (PowerShell / Windows)
# Auto-creates venv, installs deps, checks for Node.js, starts both servers

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Karma - Starting Development Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- Check Python ----
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Host "[ERROR] Python is not installed. Please install Python 3.10+ from https://python.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Python found" -ForegroundColor Green

# ---- Backend venv ----
if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
}
& backend\venv\Scripts\Activate.ps1
Write-Host "[OK] Virtual environment ready" -ForegroundColor Green

# ---- Install Python deps ----
if (-not (Test-Path "backend\venv\Lib\site-packages\django")) {
    Write-Host "[INFO] Installing Python packages..." -ForegroundColor Yellow
    pip install -r backend\requirements.txt
    Write-Host "[OK] Python packages installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Python packages already installed" -ForegroundColor Green
}

# ---- Run Django migrations ----
Write-Host "[INFO] Running migrations..." -ForegroundColor Yellow
python backend\manage.py migrate --run-syncdb 2>$null
Write-Host "[OK] Migrations up to date" -ForegroundColor Green

# ---- Check Node.js / npm ----
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[INFO] Node.js not found. Downloading installer..." -ForegroundColor Yellow
    $installer = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile $installer
    Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /qn" -Wait
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] Node.js installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Node.js found" -ForegroundColor Green
}

# ---- Install frontend deps ----
if (-not (Test-Path "Karma\node_modules")) {
    Write-Host "[INFO] Installing frontend packages..." -ForegroundColor Yellow
    Set-Location Karma
    npm install
    Set-Location $ScriptDir
    Write-Host "[OK] Frontend packages installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Frontend packages already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting servers..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- Start Django backend ----
Write-Host "[INFO] Starting Django backend on http://localhost:8000" -ForegroundColor Yellow
$djangoJob = Start-Job -Name KarmaDjango -ScriptBlock {
    Set-Location $using:ScriptDir\backend
    & $using:ScriptDir\backend\venv\Scripts\Activate.ps1
    python manage.py runserver 0.0.0.0:8000
}
Start-Sleep -Seconds 3

# ---- Start Vite frontend ----
Write-Host "[INFO] Starting Vite frontend on http://localhost:5173" -ForegroundColor Yellow
$viteJob = Start-Job -Name KarmaVite -ScriptBlock {
    Set-Location $using:ScriptDir\Karma
    npm run dev
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to stop servers..."

# Cleanup
Write-Host "[INFO] Stopping servers..." -ForegroundColor Yellow
$djangoJob | Stop-Job -PassThru | Remove-Job
$viteJob | Stop-Job -PassThru | Remove-Job
Write-Host "[OK] Servers stopped" -ForegroundColor Green
