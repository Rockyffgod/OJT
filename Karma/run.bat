@echo off
cd /d "%~dp0"

if "%1"=="" goto dev
if "%1"=="dev" goto dev
if "%1"=="build" goto build
if "%1"=="preview" goto preview
if "%1"=="lint" goto lint
if "%1"=="typecheck" goto typecheck
if "%1"=="setup" goto setup
if "%1"=="help" goto help
echo Unknown command: %1
goto help

:dev
echo Starting development server...
call npm install --silent
npm run dev
goto end

:build
echo Building for production...
call npm install --silent
npm run build
goto end

:preview
echo Previewing production build...
npm run preview
goto end

:lint
echo Running linter...
npm run lint
goto end

:typecheck
echo Running TypeScript type check...
npm run typecheck
goto end

:setup
echo Installing dependencies...
npm install
goto end

:help
echo Usage: %0 [command]
echo   dev       - Start development server (default)
echo   build     - Build for production
echo   preview   - Preview production build
echo   lint      - Run linter
echo   typecheck - Run TypeScript type checking
echo   setup     - Install dependencies only
goto end

:end
pause
