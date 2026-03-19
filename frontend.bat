@echo off
echo Killing any process on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do taskkill /F /PID %%a 2>nul
cd /d "%~dp0frontend"
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed!
    pause
    exit /b 1
)
echo Starting frontend...
npm run dev
pause
