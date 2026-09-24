@echo off
rem Tai ban moi nhat tu GitHub, khoi dong lai server, roi mo app.
rem Chi dung duoc khi thu muc nay da duoc "git clone" ve (khong dung voi ban tai .zip roi giai nen).
cd /d "%~dp0"

echo Dang kiem tra ban moi tren GitHub...
git pull
if errorlevel 1 (
  echo.
  echo KHONG cap nhat duoc. Kiem tra lai:
  echo  - May da cai Git chua? (chay: git --version)
  echo  - Thu muc nay co phai la ban "git clone" khong, hay chi la ban giai nen .zip?
  echo  - Mang co dang ket noi khong?
  pause
  exit /b 1
)

echo.
echo Dang khoi dong lai server de nap code moi...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":4400 .*LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)

cd /d "%~dp0app"
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%~dp0app' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4400"

echo.
echo Da cap nhat xong va mo lai app.
pause
