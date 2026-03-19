@echo off
cd /d "%~dp0backend"
echo Killing any process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do taskkill /F /PID %%a 2>nul
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed!
    pause
    exit /b 1
)
echo Starting backend...
npm run dev
pause
