@echo off
echo Starting Camera Streaming Frontend...
cd frontend

REM Set environment variables for frontend
set REACT_APP_API_URL=http://localhost:3000/api/v1
set REACT_APP_WS_URL=ws://localhost:3000
set REACT_APP_RTMP_URL=rtmp://localhost:1935/live
set REACT_APP_HLS_URL=http://localhost:8080/hls
set GENERATE_SOURCEMAP=false

echo Environment variables set:
echo REACT_APP_API_URL=%REACT_APP_API_URL%

echo Starting React application...
npm start

pause