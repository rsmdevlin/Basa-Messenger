@echo off
chcp 65001 >nul
cd /d C:\Users\myteg\Desktop\Basa-Messenger

echo.
echo Basa Messenger v2 - Local Start
echo ========================================
echo.

echo [1/3] Installing dependencies...
call pnpm install
if errorlevel 1 (
    echo Error during installation
    pause
    exit /b 1
)

echo.
echo [2/3] Going to app folder...
cd /d C:\Users\myteg\Desktop\Basa-Messenger\artifacts\test-app

echo.
echo [3/3] Starting Expo dev server...
echo.
echo ========================================
echo After startup:
echo 1. Open Expo Go on iPhone
echo 2. Tap "Scan QR Code"
echo 3. Scan the QR code from this window
echo ========================================
echo.

call npx expo start

pause
