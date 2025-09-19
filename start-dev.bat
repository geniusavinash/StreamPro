@echo off
echo ========================================
echo   StreamPro Development Environment
echo ========================================
echo.

echo Installing frontend dependencies...
cd frontend
npm install --legacy-peer-deps
cd ..

echo Installing backend dependencies...
cd backend
npm install
cd ..

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run start:dev"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Development servers are starting...
echo ========================================
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:3000 (React dev server)
echo ========================================
echo.
echo Demo Login Credentials:
echo   Admin:    admin / admin123
echo   Operator: operator / operator123
echo   Viewer:   viewer / viewer123
echo.
echo Press any key to close this window...
pause > nul