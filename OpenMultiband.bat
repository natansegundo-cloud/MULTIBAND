@echo off
setlocal

set "APP_DIR=%~dp0"
pushd "%APP_DIR%"

if not exist "node_modules" (
  echo Installing Multiband dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Could not install dependencies.
    pause
    popd
    exit /b 1
  )
)

start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$appDir = '%APP_DIR%'; $running = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue; if (-not $running) { Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','4173','--strictPort' -WorkingDirectory $appDir -WindowStyle Hidden; Start-Sleep -Seconds 2 }; Start-Process 'http://127.0.0.1:4173'"

popd
exit /b 0
