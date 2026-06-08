# Start both servers for development
# Run this script from the project root (D:\Hamro Karma)

Write-Host "Starting Django backend..." -ForegroundColor Green
$django = Start-Process -NoNewWindow -PassThru -FilePath "python" -ArgumentList "manage.py runserver 0.0.0.0:8000" -WorkingDirectory "D:\Hamro Karma\backend"
Start-Sleep -Seconds 2

Write-Host "Starting Vite frontend..." -ForegroundColor Green
$vite = Start-Process -NoNewWindow -PassThru -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "D:\Hamro Karma\Karma"

Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop both servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$django.Kill()
$vite.Kill()
Write-Host "Servers stopped." -ForegroundColor Red
