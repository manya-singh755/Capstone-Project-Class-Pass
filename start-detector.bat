@echo off
title CLASS-PASS DroidCam Detector
echo.
echo   =============================================
echo     CLASS-PASS Camera Detector v3.0
echo     Smart Classroom Occupancy Detection
echo   =============================================
echo.

REM Check if Python is available
where python >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Python not found! Install Python 3.8+ and add to PATH.
    pause
    exit /b 1
)

REM Check if dependencies installed
python -c "import cv2; import requests" >nul 2>&1
if errorlevel 1 (
    echo   [INFO] Installing Python dependencies...
    pip install -r camera\requirements.txt
    echo.
)

echo   Choose input method:
echo     1. DroidCam as system webcam (camera index)
echo     2. DroidCam via WiFi URL
echo     3. Find my camera first
echo.

set /p choice="  Enter choice (1/2/3): "

if "%choice%"=="3" (
    echo.
    echo   Scanning for cameras...
    echo.
    python camera\find_camera.py
    pause
    exit /b 0
)

set /p room="  Enter Room Number (e.g. 34-401): "

if "%choice%"=="1" (
    set /p camidx="  Enter Camera Index (0 or 1, run option 3 to find): "
    echo.
    echo   Starting detector for Room %room% on camera %camidx%...
    echo.
    python camera\detector.py --room %room% --camera %camidx% --preview
) else (
    set /p url="  Enter DroidCam URL (e.g. http://192.168.1.5:4747/video): "
    echo.
    echo   Starting detector for Room %room% at %url%...
    echo.
    python camera\detector.py --room %room% --url %url% --preview
)

pause
