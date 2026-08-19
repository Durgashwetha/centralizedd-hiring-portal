@echo off
title CampusQuant AI - Master Enterprise Launcher
cls

echo =========================================================================
echo               CAMPUSQUANT AI - MASTER ENTERPRISE LAUNCHER
echo =========================================================================
echo.

echo [1/3] Cleaning up any existing background Python and Node processes...
taskkill /F /FI "IMAGENAME eq python.exe" >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Background processes cleaned cleanly!
echo.

echo [2/3] Initializing Node.js ^& Python Runtimes...
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

if exist "D:\nodejs\node-v20.11.0-win-x64" (
    set "Path=D:\nodejs\node-v20.11.0-win-x64;%Path%"
)

echo [3/3] Launching Fresh FastAPI Backend ^& Vite Frontend Servers...
start "CampusQuant Backend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && .venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
start "CampusQuant Frontend Server" cmd /k "cd /d ""%PROJECT_DIR%frontend"" && set Path=D:\nodejs\node-v20.11.0-win-x64;%%Path%% && npm run dev"

echo.
echo =========================================================================
echo  [SUCCESS] All CampusQuant AI Services Started Fresh!
echo  - Backend API:  http://127.0.0.1:8000
echo  - Frontend App: http://localhost:5173
echo.
echo  Opening web app in default browser...
echo =========================================================================
echo.

timeout /t 4 /nobreak >nul
start http://localhost:5173

pause
