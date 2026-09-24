@echo off
rem Mo app Quan ly Kenh tai http://localhost:4400.
rem Tu dong: cai Node.js neu may chua co, tao shortcut ngoai Desktop neu chua co, roi bat server + mo trinh duyet.
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem ---------- Buoc 1: dam bao may co Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
  ) else (
    echo May nay chua co Node.js - dang tu dong cai dat, cho chut...
    where winget >nul 2>nul
    if errorlevel 1 (
      echo.
      echo KHONG tu cai duoc vi may thieu "winget".
      echo Hay vao https://nodejs.org tai va cai ban LTS, roi chay lai file nay.
      pause
      exit /b 1
    )
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
    if exist "%ProgramFiles%\nodejs\node.exe" (
      set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else (
      echo.
      echo Cai dat chua xong ^(hoac may can khoi dong lai^). Dong cua so nay,
      echo mo lai va chay file nay them 1 lan nua.
      pause
      exit /b 1
    )
  )
)

rem ---------- Buoc 2: tao shortcut ngoai Desktop neu chua co ----------
if not exist "%USERPROFILE%\Desktop\Quan ly Kenh.lnk" (
  powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%USERPROFILE%\Desktop\Quan ly Kenh.lnk'); $sc.TargetPath = '%~dp0CHAY QUAN LY KENH.bat'; $sc.WorkingDirectory = '%~dp0'; $sc.IconLocation = '%SystemRoot%\System32\shell32.dll,13'; $sc.Save()" >nul 2>nul
)

rem ---------- Buoc 3: bat server (neu chua chay) + mo trinh duyet ----------
netstat -ano | findstr /R /C:":4400 .*LISTENING" >nul
if errorlevel 1 (
  powershell -NoProfile -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%~dp0app' -WindowStyle Hidden"
  timeout /t 2 /nobreak >nul
)
start "" "http://localhost:4400"
