@echo off
echo Starting Camera Streaming Platform...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run test:server"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Press any key to exit...
pause > nul