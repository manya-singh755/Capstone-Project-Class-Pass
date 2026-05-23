"""
CLASS-PASS — Camera Occupancy Detector (v3.0)
==================================================
Complete DroidCam → OpenCV → Detection → Backend → WebApp pipeline.

FEATURES:
  - DroidCam / USB webcam support with auto-reconnection
  - HOG+SVM person detection (lightweight, no GPU needed)
  - Background subtraction for motion-based fallback detection
  - Beautiful demo-ready visual debug window (HUD overlay)
  - Smart debouncing to avoid status flickering
  - Full error handling (camera, network, frame errors)
  - CPU-optimized: frame resizing, interval-based detection
  - Real-time status POSTing to CLASS-PASS backend

PIPELINE:
  DroidCam (phone) → OpenCV capture → HOG detect people
  → Decision logic → POST /api/camera/update → WebSocket broadcast
  → Web app dashboard updates live

USAGE:
  # Step 1: Find your camera index
  python find_camera.py

  # Step 2: Run with DroidCam as system webcam
  python detector.py --room 34-401 --camera 1 --preview

  # Step 3: Or use DroidCam IP (WiFi mode)
  python detector.py --room 34-401 --url http://192.168.1.5:4747/video --preview

  # Headless mode (no window, for production)
  python detector.py --room 34-401 --camera 1

REQUIREMENTS:
  pip install opencv-python requests numpy

KEYBOARD SHORTCUTS (preview mode):
  Q - Quit detector
  S - Show runtime statistics
  D - Toggle detection visualization
  P - Pause/resume detection
"""

import cv2
import requests
import argparse
import time
import sys
import threading
import numpy as np
from datetime import datetime


# ─────────────────────────────────────────────────────
#  CONFIGURATION DEFAULTS
# ─────────────────────────────────────────────────────
DEFAULT_API_URL = "http://localhost:5000"
DEFAULT_INTERVAL = 3          # seconds between detections
DEFAULT_SENSITIVITY = 1.05    # HOG scale factor (lower = more sensitive)
PROCESS_WIDTH = 400           # resize frames to this width for speed
DEBOUNCE_COUNT = 2            # require N consecutive same-status readings
RECONNECT_MAX_DELAY = 30      # max seconds between reconnection attempts
CAMERA_STALE_TIMEOUT = 30     # seconds before camera data considered stale
API_TIMEOUT = 5               # seconds for HTTP requests


class SmartDetector:
    """
    Complete pipeline: Camera → Detection → Decision → Backend → WebApp.
    
    Combines HOG+SVM person detection with motion detection fallback.
    Sends occupancy data to CLASS-PASS backend via REST API.
    """

    def __init__(self, room, source, api_url, interval, preview, sensitivity):
        # ── Configuration ──
        self.room = room
        self.source = source
        self.api_url = api_url.rstrip('/')
        self.interval = interval
        self.preview = preview
        self.sensitivity = sensitivity

        # ── OpenCV objects ──
        self.cap = None
        self.hog = None
        self.bg_subtractor = None

        # ── State tracking ──
        self.running = False
        self.paused = False
        self.connected = False
        self.show_detections = True
        self.last_send_time = 0
        self.reconnect_attempts = 0
        self.consecutive_api_failures = 0

        # ── Debouncing (prevents flicker) ──
        self.status_buffer = []        # recent detection results
        self.current_status = None     # debounced status
        self.current_count = 0

        # ── Runtime stats ──
        self.start_time = None
        self.stats = {
            'frames_processed': 0,
            'hog_detections': 0,
            'motion_detections': 0,
            'api_calls': 0,
            'api_successes': 0,
            'api_failures': 0,
            'reconnections': 0,
        }

    # ══════════════════════════════════════════════════
    #  PART 1: CAMERA CONNECTION (DroidCam / Webcam)
    # ══════════════════════════════════════════════════

    def connect_camera(self):
        """
        Open a video stream from DroidCam or local webcam.
        DroidCam can appear as:
          - A system webcam (camera index 0, 1, etc.)
          - An IP stream (http://PHONE_IP:4747/video)
        """
        if self.cap:
            self.cap.release()
            self.cap = None

        self._log(f"Connecting to: {self.source}", "WAIT")

        # Open camera with DirectShow backend on Windows for reliability
        if isinstance(self.source, int):
            self.cap = cv2.VideoCapture(self.source, cv2.CAP_DSHOW)
        else:
            self.cap = cv2.VideoCapture(self.source)

        if not self.cap or not self.cap.isOpened():
            self.connected = False
            self._log(f"FAILED to open camera: {self.source}", "ERROR")
            self._send_connection_status("disconnected")
            return False

        # Try to actually read a frame to confirm it works
        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.connected = False
            self._log(f"Camera opened but cannot read frames", "ERROR")
            self.cap.release()
            self.cap = None
            self._send_connection_status("disconnected")
            return False

        # Success — read camera properties
        w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(self.cap.get(cv2.CAP_PROP_FPS)) or 30

        self.connected = True
        self.reconnect_attempts = 0
        self._log(f"Camera CONNECTED ✅ ({w}×{h} @ {fps}fps)", "OK")
        self._send_connection_status("connected")
        return True

    def reconnect(self):
        """Auto-reconnect with exponential backoff."""
        self.reconnect_attempts += 1
        self.stats['reconnections'] += 1
        delay = min(2 ** self.reconnect_attempts, RECONNECT_MAX_DELAY)
        self._log(f"Reconnecting in {delay}s (attempt #{self.reconnect_attempts})...", "WARN")
        self._send_connection_status("reconnecting")
        time.sleep(delay)
        return self.connect_camera()

    # ══════════════════════════════════════════════════
    #  PART 2: PEOPLE DETECTION (HOG+SVM + Motion)
    # ══════════════════════════════════════════════════

    def init_detector(self):
        """
        Initialize the detection system.
        
        Primary: HOG+SVM person detector
          - OpenCV built-in, no external model files needed
          - Lightweight, runs on CPU at 5-10fps easily
          - Detects full-body standing/walking people
        
        Fallback: Background subtraction for motion detection
          - Catches seated people that HOG might miss
          - Uses MOG2 adaptive background model
        """
        # HOG (Histogram of Oriented Gradients) person detector
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self._log("HOG+SVM person detector loaded", "OK")

        # Background subtractor for motion detection fallback
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500,
            varThreshold=50,
            detectShadows=False
        )
        self._log("Motion detector (MOG2) loaded", "OK")

    def detect_people(self, frame):
        """
        Detect if people are present using two methods:
        
        1. HOG+SVM: Detects human body shapes
        2. Motion fallback: Detects significant movement
        
        Returns: (people_present: bool, count: int, rects: list, method: str)
        """
        # === RESIZE for performance ===
        height, width = frame.shape[:2]
        scale = PROCESS_WIDTH / width if width > PROCESS_WIDTH else 1.0
        small = cv2.resize(frame, None, fx=scale, fy=scale) if scale < 1.0 else frame

        # === METHOD 1: HOG Person Detection ===
        rects, weights = self.hog.detectMultiScale(
            small,
            winStride=(8, 8),
            padding=(4, 4),
            scale=self.sensitivity
        )

        # Filter by confidence weight
        confident_rects = []
        for i, (x, y, w, h) in enumerate(rects):
            if i < len(weights) and weights[i] > 0.3:
                # Scale back to original frame coordinates
                x1 = int(x / scale)
                y1 = int(y / scale)
                w1 = int(w / scale)
                h1 = int(h / scale)
                confident_rects.append((x1, y1, w1, h1))

        hog_count = len(confident_rects)

        if hog_count > 0:
            self.stats['hog_detections'] += 1
            return True, hog_count, confident_rects, "HOG"

        # === METHOD 2: Motion Detection Fallback ===
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        fg_mask = self.bg_subtractor.apply(gray)

        # Threshold and clean up the mask
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

        # Find contours of moving regions
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter small contours (noise) — only keep significant motion
        min_area = (small.shape[0] * small.shape[1]) * 0.005  # 0.5% of frame
        significant_contours = [c for c in contours if cv2.contourArea(c) > min_area]

        motion_detected = len(significant_contours) >= 2  # Multiple moving regions = people

        if motion_detected:
            self.stats['motion_detections'] += 1
            # Convert contours to rects for visualization
            motion_rects = []
            for c in significant_contours[:5]:  # limit to 5
                mx, my, mw, mh = cv2.boundingRect(c)
                mx1 = int(mx / scale)
                my1 = int(my / scale)
                mw1 = int(mw / scale)
                mh1 = int(mh / scale)
                motion_rects.append((mx1, my1, mw1, mh1))
            return True, len(significant_contours), motion_rects, "Motion"

        return False, 0, [], "None"

    # ══════════════════════════════════════════════════
    #  PART 3: DECISION LOGIC (with Debouncing)
    # ══════════════════════════════════════════════════

    def decide_status(self, people_present, count):
        """
        Determine classroom status with debouncing to prevent flicker.
        
        Logic:
          IF people_present == True  →  status = "Student Use"
          IF people_present == False →  status = "Available"
        
        Debouncing:
          Requires DEBOUNCE_COUNT consecutive same readings before changing.
          This prevents a momentary camera glitch from flipping the status.
        """
        self.status_buffer.append(people_present)

        # Keep only last N readings
        if len(self.status_buffer) > DEBOUNCE_COUNT * 2:
            self.status_buffer = self.status_buffer[-DEBOUNCE_COUNT * 2:]

        # Check if last N readings are consistent
        recent = self.status_buffer[-DEBOUNCE_COUNT:]
        if len(recent) >= DEBOUNCE_COUNT:
            if all(recent):
                self.current_status = "Student Use"
                self.current_count = count
            elif not any(recent):
                self.current_status = "Available"
                self.current_count = 0
            # else: mixed readings → keep previous status

        # First-time initialization
        if self.current_status is None:
            self.current_status = "Student Use" if people_present else "Available"
            self.current_count = count

        return self.current_status, self.current_count

    # ══════════════════════════════════════════════════
    #  PART 4: SEND DATA TO BACKEND
    # ══════════════════════════════════════════════════

    def send_update(self, people_present, count):
        """
        POST occupancy data to CLASS-PASS backend.
        
        Endpoint: POST /api/camera/update
        Payload:  { room, peopleDetected, count }
        
        The backend then:
          1. Updates cameraReadings in statusEngine.js
          2. Recomputes classroom status via computeStatus()
          3. Broadcasts via WebSocket to all connected dashboards
        """
        try:
            payload = {
                "room": self.room,
                "peopleDetected": people_present,
                "count": count
            }
            resp = requests.post(
                f"{self.api_url}/api/camera/update",
                json=payload,
                timeout=API_TIMEOUT
            )
            self.stats['api_calls'] += 1

            if resp.status_code == 200:
                self.stats['api_successes'] += 1
                self.consecutive_api_failures = 0
                return True
            else:
                self._log(f"API returned HTTP {resp.status_code}", "WARN")
                self.stats['api_failures'] += 1
                return False

        except requests.exceptions.ConnectionError:
            self.consecutive_api_failures += 1
            self.stats['api_failures'] += 1
            if self.consecutive_api_failures <= 3:
                self._log(f"Backend unreachable at {self.api_url}", "WARN")
            elif self.consecutive_api_failures == 4:
                self._log("Backend still unreachable — retrying silently...", "WARN")
            return False

        except requests.exceptions.Timeout:
            self.consecutive_api_failures += 1
            self.stats['api_failures'] += 1
            self._log("API request timed out", "WARN")
            return False

        except Exception as e:
            self.consecutive_api_failures += 1
            self.stats['api_failures'] += 1
            self._log(f"API error: {e}", "ERROR")
            return False

    def _send_connection_status(self, status):
        """Send camera connection status to backend (non-blocking)."""
        def _send():
            try:
                requests.post(
                    f"{self.api_url}/api/camera/status-update",
                    json={
                        "room": self.room,
                        "status": status,
                        "source": str(self.source),
                    },
                    timeout=3
                )
            except Exception:
                pass  # Connection status updates are non-critical

        threading.Thread(target=_send, daemon=True).start()

    # ══════════════════════════════════════════════════
    #  PART 5 & 6: MAIN LOOP + VISUAL DEBUG WINDOW
    # ══════════════════════════════════════════════════

    def run(self):
        """
        Main detection loop:
          1. Capture frame from DroidCam/webcam
          2. Detect people (HOG + motion fallback)
          3. Decide status with debouncing
          4. Send result to backend API
          5. Draw visual debug HUD (if preview mode)
          6. Repeat every N seconds
        """
        self.running = True
        self.start_time = time.time()
        self._print_banner()
        self.init_detector()

        # ── Initial camera connection ──
        if not self.connect_camera():
            self._print_connection_help()
            while self.running and not self.connected:
                if self.reconnect_attempts >= 15:
                    self._log("Too many failed attempts. Exiting.", "ERROR")
                    return
                self.reconnect()

        self._log(f"Detecting every {self.interval}s → POST to {self.api_url}", "RUN")
        print()

        try:
            while self.running:
                # ── Handle disconnection ──
                if not self.connected or not self.cap or not self.cap.isOpened():
                    if not self.reconnect():
                        continue

                # ── Capture frame ──
                ret, frame = self.cap.read()
                if not ret or frame is None:
                    self._log("Frame capture failed", "WARN")
                    self.connected = False
                    self._send_connection_status("frame_error")
                    self.reconnect()
                    continue

                self.stats['frames_processed'] += 1
                current_time = time.time()

                # ── Run detection at interval ──
                if current_time - self.last_send_time >= self.interval:
                    if not self.paused:
                        # DETECT
                        people_present, count, rects, method = self.detect_people(frame)

                        # DECIDE (with debouncing)
                        status, debounced_count = self.decide_status(people_present, count)

                        # SEND TO BACKEND
                        api_ok = self.send_update(
                            people_present=(status == "Student Use"),
                            count=debounced_count
                        )

                        # LOG TO CONSOLE
                        self._log_detection(status, debounced_count, method, api_ok)

                        # DRAW HUD ON FRAME (preview mode)
                        if self.preview and self.show_detections:
                            self._draw_detection_boxes(frame, rects, method)

                    self.last_send_time = current_time

                # ── Preview window ──
                if self.preview:
                    self._draw_hud(frame)
                    cv2.imshow(f"CLASS-PASS Detector — Room {self.room}", frame)

                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        self._log("Quit requested", "INFO")
                        break
                    elif key == ord('s'):
                        self._print_stats()
                    elif key == ord('d'):
                        self.show_detections = not self.show_detections
                        self._log(f"Detection overlay: {'ON' if self.show_detections else 'OFF'}", "INFO")
                    elif key == ord('p'):
                        self.paused = not self.paused
                        self._log(f"Detection: {'PAUSED ⏸' if self.paused else 'RESUMED ▶'}", "INFO")
                else:
                    # Headless mode — small sleep to avoid CPU hogging
                    time.sleep(0.05)

        except KeyboardInterrupt:
            print("\n")
            self._log("Stopped by user (Ctrl+C)", "INFO")
        finally:
            self.cleanup()

    # ══════════════════════════════════════════════════
    #  PART 6: VISUAL DEBUG WINDOW (HUD OVERLAY)
    # ══════════════════════════════════════════════════

    def _draw_hud(self, frame):
        """
        Draw a demo-ready heads-up display overlay on the video feed.
        Shows: room, status, people count, detection method,
               API status, FPS, and keyboard shortcuts.
        """
        h, w = frame.shape[:2]

        # ── Top bar: dark overlay ──
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 90), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)

        # ── Bottom bar: dark overlay ──
        cv2.rectangle(overlay, (0, h - 40), (w, h), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)

        # ── Room label (top-left) ──
        cv2.putText(frame, f"Room {self.room}",
                    (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

        # ── Status indicator (top-left, second line) ──
        if self.paused:
            status_text = "PAUSED"
            status_color = (0, 165, 255)  # orange
        elif self.current_status == "Student Use":
            status_text = f"OCCUPIED — {self.current_count} detected"
            status_color = (0, 255, 0)  # green
        else:
            status_text = "EMPTY CLASSROOM"
            status_color = (128, 128, 128)  # gray

        cv2.putText(frame, status_text,
                    (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 2)

        # ── Large status indicator dot (top-right) ──
        dot_x = w - 35
        dot_color = (0, 255, 0) if self.current_status == "Student Use" else (100, 100, 100)
        if self.current_status == "Student Use":
            # Pulsing glow effect
            pulse = abs(int(time.time() * 3) % 20 - 10)
            cv2.circle(frame, (dot_x, 30), 14 + pulse, (*dot_color, 50), -1)
        cv2.circle(frame, (dot_x, 30), 12, dot_color, -1)

        # ── API status (top-right area) ──
        api_label = "API: OK" if self.consecutive_api_failures == 0 else f"API: FAIL ({self.consecutive_api_failures})"
        api_color = (0, 255, 0) if self.consecutive_api_failures == 0 else (0, 0, 255)
        cv2.putText(frame, api_label,
                    (w - 180, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.45, api_color, 1)

        # ── Timestamp ──
        timestamp = datetime.now().strftime("%H:%M:%S")
        cv2.putText(frame, timestamp,
                    (15, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (180, 180, 180), 1)

        # ── Bottom footer ──
        cv2.putText(frame, "CLASS-PASS v3.0 | Q=Quit  S=Stats  D=Toggle  P=Pause",
                    (10, h - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (140, 140, 140), 1)

    def _draw_detection_boxes(self, frame, rects, method):
        """Draw bounding boxes around detected people."""
        color = (0, 255, 0) if method == "HOG" else (255, 200, 0)
        label = "Person" if method == "HOG" else "Motion"

        for (x, y, w, h) in rects:
            # Draw box
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            # Draw label background
            cv2.rectangle(frame, (x, y - 22), (x + len(label) * 11 + 10, y), color, -1)
            cv2.putText(frame, label, (x + 5, y - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

    # ══════════════════════════════════════════════════
    #  PART 7: ERROR HANDLING & CLEANUP
    # ══════════════════════════════════════════════════

    def cleanup(self):
        """Graceful cleanup: release camera, close windows, send final update."""
        self.running = False
        self._log("Cleaning up...", "INFO")

        # Send final "empty" update so dashboard doesn't show stale data
        try:
            self.send_update(False, 0)
            self._send_connection_status("disconnected")
        except Exception:
            pass

        # Release OpenCV resources
        if self.cap:
            self.cap.release()
        if self.preview:
            cv2.destroyAllWindows()

        self._print_stats()
        self._log("Cleanup complete. Goodbye!", "OK")

    def _print_connection_help(self):
        """Show helpful troubleshooting messages."""
        self._log("Camera connection failed. Tips:", "HINT")
        if isinstance(self.source, str):
            print("    → Make sure DroidCam app is running on your phone")
            print("    → Verify the IP address and port (default 4747)")
            print("    → Ensure phone and PC are on the same WiFi network")
            print(f"    → Try opening {self.source} in your browser")
        else:
            print("    → Run 'python find_camera.py' to scan for cameras")
            print(f"    → Try a different index: --camera 0 or --camera 1")
            print("    → If using DroidCam, make sure the DroidCam client is installed")
            print("    → Check if your webcam app can see the camera")
        print()

    # ══════════════════════════════════════════════════
    #  LOGGING & DISPLAY
    # ══════════════════════════════════════════════════

    def _log(self, message, level="INFO"):
        """Formatted console logging."""
        icons = {
            "OK": "✅", "ERROR": "❌", "WARN": "⚠️ ",
            "INFO": "ℹ️ ", "RUN": "▶️ ", "HINT": "💡",
            "WAIT": "⏳",
        }
        icon = icons.get(level, "•")
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"  [{ts}] {icon}  {message}")

    def _log_detection(self, status, count, method, api_ok):
        """Print a compact detection result line."""
        ts = datetime.now().strftime("%H:%M:%S")
        api_sym = "✓" if api_ok else "✗"

        if status == "Student Use":
            print(f"  [{ts}] 🟢 {count} detected ({method}) → Student Use  [{api_sym}]")
        else:
            print(f"  [{ts}] ⚪ Empty classroom ({method}) → Available    [{api_sym}]")

    def _print_banner(self):
        """Print startup banner."""
        print()
        print("  ╔══════════════════════════════════════════════╗")
        print("  ║     CLASS-PASS Camera Detector v3.0          ║")
        print("  ║     Smart Classroom Occupancy Detection       ║")
        print("  ╠══════════════════════════════════════════════╣")
        print(f"  ║  Room:        {self.room:<32}║")
        print(f"  ║  Source:      {str(self.source)[:32]:<32}║")
        print(f"  ║  Backend:     {self.api_url:<32}║")
        print(f"  ║  Interval:    {self.interval}s{' ' * 30}║")
        print(f"  ║  Sensitivity: {self.sensitivity:<32}║")
        print(f"  ║  Preview:     {'Yes (visual debug)' if self.preview else 'No (headless)':<32}║")
        print("  ╠══════════════════════════════════════════════╣")
        print("  ║  Detection:   HOG+SVM + Motion Fallback      ║")
        print("  ║  Debounce:    2 consistent readings           ║")
        print("  ╚══════════════════════════════════════════════╝")
        print()

    def _print_stats(self):
        """Print detailed runtime statistics."""
        elapsed = time.time() - self.start_time if self.start_time else 0
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)

        api_rate = (
            f"{self.stats['api_successes']}/{self.stats['api_calls']} "
            f"({self.stats['api_successes'] / max(self.stats['api_calls'], 1) * 100:.0f}%)"
        )

        print()
        print("  ┌─── Runtime Statistics ─────────────────────────┐")
        print(f"  │  Uptime:           {mins}m {secs}s{' ' * 25}│")
        print(f"  │  Frames Processed: {self.stats['frames_processed']:<29}│")
        print(f"  │  HOG Detections:   {self.stats['hog_detections']:<29}│")
        print(f"  │  Motion Detects:   {self.stats['motion_detections']:<29}│")
        print(f"  │  API Success Rate: {api_rate:<29}│")
        print(f"  │  API Failures:     {self.stats['api_failures']:<29}│")
        print(f"  │  Reconnections:    {self.stats['reconnections']:<29}│")
        print(f"  │  Camera:           {'Connected ✅' if self.connected else 'Disconnected ❌':<29}│")
        print(f"  │  Current Status:   {self.current_status or 'N/A':<29}│")
        print("  └─────────────────────────────────────────────────┘")
        print()


# ══════════════════════════════════════════════════════
#  CLI ENTRY POINT
# ══════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="CLASS-PASS Camera Detector v3.0 — Smart Classroom Occupancy Detection",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --room 34-401 --camera 0 --preview
  %(prog)s --room 34-401 --camera 1 --preview --interval 3
  %(prog)s --room 34-401 --url http://192.168.1.5:4747/video --preview
  %(prog)s --room 34-401 --camera 0  (headless, no window)

First time? Run 'python find_camera.py' to find your camera index.
        """
    )

    parser.add_argument("--room", required=True,
                        help="Room number to update (e.g. 34-401)")
    parser.add_argument("--url", default=None,
                        help="DroidCam video URL (e.g. http://192.168.1.5:4747/video)")
    parser.add_argument("--camera", type=int, default=None,
                        help="Camera index (0=default webcam, 1=DroidCam usually)")
    parser.add_argument("--api", default=DEFAULT_API_URL,
                        help=f"Backend URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL,
                        help=f"Detection interval in seconds (default: {DEFAULT_INTERVAL})")
    parser.add_argument("--preview", action="store_true",
                        help="Show visual debug window (RECOMMENDED for demo)")
    parser.add_argument("--sensitivity", type=float, default=DEFAULT_SENSITIVITY,
                        help=f"HOG scale factor, lower=more sensitive (default: {DEFAULT_SENSITIVITY})")

    args = parser.parse_args()

    # Validate: need either --url or --camera
    if args.url is None and args.camera is None:
        print()
        print("  ❌ Error: You must specify either --url or --camera")
        print()
        print("  Quick start:")
        print("    python find_camera.py                          # Find your camera")
        print("    python detector.py --room 34-401 --camera 0 --preview  # Use webcam")
        print("    python detector.py --room 34-401 --camera 1 --preview  # DroidCam (usually)")
        print("    python detector.py --room 34-401 --url http://PHONE_IP:4747/video --preview")
        print()
        sys.exit(1)

    source = args.url if args.url else args.camera

    detector = SmartDetector(
        room=args.room,
        source=source,
        api_url=args.api,
        interval=args.interval,
        preview=args.preview,
        sensitivity=args.sensitivity,
    )
    detector.run()


if __name__ == "__main__":
    main()
