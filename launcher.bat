@echo off
setlocal EnableDelayedExpansion

echo ===================================================
echo   Library Warehouse ETL - Local TS/SQLite Launcher
echo ===================================================
echo.

REM ---------------------------------------------------
REM 1. Prerequisite Checks
REM ---------------------------------------------------
echo [1/3] Checking Prerequisites...

call npm -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH.
    pause
    exit /b 1
)
echo   - Node.js: OK

REM ---------------------------------------------------
REM 2. Install Dependencies
REM ---------------------------------------------------
echo.
echo [2/3] Checking Dependencies...
if exist node_modules (
    echo   - Dependencies already installed.
) else (
    echo   - Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

REM ---------------------------------------------------
REM 3. Start Application
REM ---------------------------------------------------
echo.
echo [3/3] Starting Application (Frontend + Backend)...
echo   - Launching...
echo.
echo   Application will be available at: http://localhost:3000
echo.

call npm run dev

pause
