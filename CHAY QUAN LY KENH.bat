@echo off
rem Mo app Quan ly Kenh tai http://localhost:4400 (tu bat server neu chua chay)
cd /d "%~dp0app"
netstat -ano | findstr /R /C:":4400 .*LISTENING" >nul
if errorlevel 1 (
  powershell -NoProfile -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%~dp0app' -WindowStyle Hidden"
  timeout /t 2 /nobreak >nul
)
start "" "http://localhost:4400"
