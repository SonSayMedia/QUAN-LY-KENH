@echo off
rem Tao 1 shortcut "Quan ly Kenh" ngoai man hinh Desktop, tro toi CHAY QUAN LY KENH.bat trong thu muc nay.
rem Chi can chay file nay 1 LAN DUY NHAT sau khi tai (clone) xong.
setlocal
set "TARGET=%~dp0CHAY QUAN LY KENH.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Quan ly Kenh.lnk"

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT%'); $sc.TargetPath = '%TARGET%'; $sc.WorkingDirectory = '%~dp0'; $sc.IconLocation = '%~dp0app\public\icons\app-icon.ico'; $sc.Save()"

echo.
echo Da tao xong shortcut "Quan ly Kenh" ngoai man hinh Desktop.
echo Tu gio chi can bam vao icon do de mo app, khong can vao lai thu muc nay.
pause
