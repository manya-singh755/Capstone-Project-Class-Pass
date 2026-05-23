# CLASS-PASS Camera Detector v3.0

Real-time classroom occupancy detection using DroidCam + OpenCV.

## Complete Pipeline

```
DroidCam (Phone) → OpenCV (Python) → HOG Detect People → POST /api/camera/update → WebSocket → Dashboard
```

---

## Quick Start (3 Steps)

### Step 1: Install Python dependencies
```bash
cd camera
pip install -r requirements.txt
```

### Step 2: Find your camera
```bash
python find_camera.py
```
This scans camera indices 0–9 and tells you which one is DroidCam.

### Step 3: Run the detector
```bash
# Use the camera index from Step 2 (usually 0 or 1)
python detector.py --room 34-401 --camera 1 --preview
```

---

## DroidCam Setup

### Option A: DroidCam as System Webcam (RECOMMENDED)
1. Install DroidCam on your phone (Play Store / App Store)
2. Install DroidCam Client on your PC (https://droidcam.app)
3. Connect phone to PC via USB or WiFi
4. DroidCam appears as a system webcam (camera index 1 usually)
5. Run: `python detector.py --room 34-401 --camera 1 --preview`

### Option B: DroidCam via WiFi IP
1. Open DroidCam on phone → note the IP address
2. Ensure phone and PC are on the same WiFi
3. Run: `python detector.py --room 34-401 --url http://<PHONE_IP>:4747/video --preview`

---

## All Commands

### Find Camera
```bash
python find_camera.py                                  # Scan all cameras
python find_camera.py --test-url http://192.168.1.5:4747/video  # Test DroidCam URL
```

### Run Detector
```bash
# With visual debug window (demo mode)
python detector.py --room 34-401 --camera 1 --preview

# Headless mode (production)
python detector.py --room 34-401 --camera 1

# DroidCam WiFi mode
python detector.py --room 34-401 --url http://192.168.1.5:4747/video --preview

# Custom settings
python detector.py --room 34-401 --camera 1 --preview --interval 3 --sensitivity 1.03
```

### Using the Batch Launcher (Windows)
```bash
start-detector.bat
```

---

## CLI Options

| Flag              | Description                                  | Default              |
|-------------------|----------------------------------------------|----------------------|
| `--room`          | Room number (required)                       | —                    |
| `--camera`        | Webcam/DroidCam index                        | —                    |
| `--url`           | DroidCam video URL                           | —                    |
| `--api`           | Backend URL                                  | http://localhost:5000 |
| `--interval`      | Seconds between detections                   | 3                    |
| `--preview`       | Show visual debug window                     | off                  |
| `--sensitivity`   | HOG scale factor (lower = more sensitive)    | 1.05                 |

---

## Keyboard Shortcuts (Preview Mode)

| Key | Action                          |
|-----|---------------------------------|
| `Q` | Quit detector                   |
| `S` | Show runtime statistics         |
| `D` | Toggle detection box overlay    |
| `P` | Pause/resume detection          |

---

## How It Works

### Detection Methods
1. **HOG+SVM (Primary):** OpenCV's built-in human body detector. Fast, reliable, no GPU needed.
2. **Motion Detection (Fallback):** Background subtraction catches seated people that HOG might miss.

### Decision Logic
```
IF people_present == True  →  status = "Student Use"
IF people_present == False →  status = "Available"
```

### Debouncing
Requires 2 consecutive identical readings before changing status. Prevents flicker from momentary detection glitches.

### Backend Integration
Every N seconds, POSTs to `POST /api/camera/update`:
```json
{
  "room": "34-401",
  "peopleDetected": true,
  "count": 3
}
```
The backend:
1. Stores reading in `cameraReadings`
2. Recomputes room status via `computeStatus()`  
3. Broadcasts via WebSocket to all dashboards

---

## Troubleshooting

| Problem                      | Solution                                          |
|------------------------------|---------------------------------------------------|
| "Camera not found"           | Run `python find_camera.py` to scan               |
| DroidCam not detected        | Install DroidCam Client on PC, reconnect          |
| "Backend unreachable"        | Start server first: `npm run dev`                 |
| Low detection accuracy       | Try `--sensitivity 1.03` (more sensitive)          |
| High CPU usage               | Increase `--interval 5` (less frequent detection) |
| Preview window frozen        | Press any key in the window to unfreeze            |
