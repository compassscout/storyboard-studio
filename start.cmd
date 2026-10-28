@echo off
setlocal
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
if not exist "node_modules\electron" (
  echo Electron is not installed.
  echo Run: npm install
  pause
  exit /b 1
)
call npm start
if errorlevel 1 pause
endlocal
