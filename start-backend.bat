@echo off
echo Starting Camera Streaming Backend...
cd backend

REM Set environment variables
set DATABASE_TYPE=sqlite
set DATABASE_DATABASE=./camera_streaming.db
set DATABASE_SYNCHRONIZE=true
set NODE_ENV=development
set PORT=3000
set JWT_SECRET=your-super-secret-jwt-key-change-in-production
set CORS_ORIGIN=http://localhost:3001
set FRONTEND_URL=http://localhost:3001

echo Environment variables set:
echo DATABASE_TYPE=%DATABASE_TYPE%
echo PORT=%PORT%
echo CORS_ORIGIN=%CORS_ORIGIN%

echo Starting NestJS application...
npm start

pause
