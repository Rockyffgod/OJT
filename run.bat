@echo off
cd /d "%~dp0"

if "%1"=="" goto dev
if "%1"=="dev" goto dev
if "%1"=="frontend" goto frontend
if "%1"=="backend" goto backend
if "%1"=="build" goto build
if "%1"=="migrate" goto migrate
if "%1"=="setup" goto setup
if "%1"=="help" goto help
echo Unknown command: %1
goto help

:dev
echo Starting frontend...
start "Frontend" cmd /c "cd /d "%~dp0Karma" && npm run dev"
echo Starting backend...
start "Backend" cmd /c "cd /d "%~dp0backend" && ..\venv\Scripts\python manage.py runserver 0.0.0.0:8000"
echo Both servers started. Close windows to stop.
goto end

:frontend
cd /d "%~dp0Karma"
npm run dev
goto end

:backend
cd /d "%~dp0backend"
..\venv\Scripts\python manage.py runserver 0.0.0.0:8000
goto end

:build
cd /d "%~dp0Karma"
npm run build
goto end

:migrate
cd /d "%~dp0backend"
..\venv\Scripts\python manage.py migrate
goto end

:setup
echo Installing frontend dependencies...
cd /d "%~dp0Karma"
call npm install
echo Running backend migrations...
cd /d "%~dp0backend"
..\venv\Scripts\python manage.py migrate
goto end

:help
echo Usage: %0 [command]
echo   dev         - Start both frontend and backend
echo   frontend    - Start frontend dev server only
echo   backend     - Start backend dev server only
echo   build       - Build frontend for production
echo   migrate     - Run Django database migrations
echo   setup       - Install dependencies for both
goto end

:end
if "%1"=="" pause
