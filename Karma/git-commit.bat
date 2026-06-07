@echo off
cd /d "%~dp0"

if "%*"=="" (
    echo Usage: %0 "commit message"
    exit /b 1
)

echo === Git: Adding all changes ===
git add .

echo === Git: Committing ===
git commit -m "%*"

echo === Git: Pushing to origin ===
git push

echo === Done ===
pause
