"""
CLASS-PASS — Camera Finder Utility
Scans all camera indices to find your DroidCam or webcam.

Usage:
  python find_camera.py
  python find_camera.py --test-url http://192.168.1.5:4747/video

This will try camera indices 0 through 9 and report which ones work.
"""

import cv2
import sys
import argparse


def scan_cameras(max_index=10):
    """Scan camera indices 0..max_index and report which ones work."""
    print()
    print("  ╔═══════════════════════════════════════════╗")
    print("  ║    CLASS-PASS — Camera Finder Utility      ║")
    print("  ╚═══════════════════════════════════════════╝")
    print()
    print("  Scanning camera indices 0 to", max_index - 1, "...")
    print()

    found = []
    for i in range(max_index):
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)  # DirectShow on Windows
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = int(cap.get(cv2.CAP_PROP_FPS)) or "?"
                backend = cap.getBackendName()
                print(f"  ✅ Camera Index {i}: WORKING ({w}x{h} @ {fps}fps) [{backend}]")
                found.append(i)
            else:
                print(f"  ⚠️  Camera Index {i}: Opens but cannot read frames")
            cap.release()
        else:
            print(f"  ❌ Camera Index {i}: Not available")

    print()
    if found:
        print(f"  ✅ Found {len(found)} working camera(s): {found}")
        print()
        print("  To use in detector:")
        for idx in found:
            print(f"    python detector.py --room 34-401 --camera {idx} --preview")
        print()

        # Preview the first found camera
        preview_camera(found[0])
    else:
        print("  ❌ No cameras found!")
        print()
        print("  Troubleshooting:")
        print("    1. Make sure DroidCam is running on your phone")
        print("    2. Install the DroidCam client on your PC")
        print("    3. Connect your phone via USB or WiFi")
        print("    4. If using WiFi, try --test-url http://<PHONE_IP>:4747/video")
        print()

    return found


def test_url(url):
    """Test a specific camera URL (e.g. DroidCam HTTP stream)."""
    print()
    print(f"  Testing URL: {url}")
    print()

    cap = cv2.VideoCapture(url)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret and frame is not None:
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            print(f"  ✅ URL is WORKING! ({w}x{h})")
            print()
            print(f"  To use in detector:")
            print(f"    python detector.py --room 34-401 --url {url} --preview")
            print()
            cap.release()
            preview_url(url)
        else:
            print("  ⚠️  URL opens but cannot read frames")
            cap.release()
    else:
        print("  ❌ Cannot open URL")
        print()
        print("  Troubleshooting:")
        print("    - Make sure DroidCam is running on your phone")
        print("    - Check the IP address and port (default 4747)")
        print("    - Ensure phone and PC are on the same WiFi network")
        print()


def preview_camera(index):
    """Show a quick preview from a camera index."""
    print(f"  Opening preview for Camera {index} (press Q to close)...")
    print()

    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("  ❌ Could not open camera for preview")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]

        # Draw info overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 50), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        cv2.putText(frame, f"Camera Index: {index} | {w}x{h} | Press Q to close",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        cv2.imshow("CLASS-PASS Camera Finder — Preview", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


def preview_url(url):
    """Show a quick preview from a URL."""
    print(f"  Opening preview for URL (press Q to close)...")
    print()

    cap = cv2.VideoCapture(url)
    if not cap.isOpened():
        print("  ❌ Could not open URL for preview")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 50), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        cv2.putText(frame, f"DroidCam Stream | {w}x{h} | Press Q to close",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        cv2.imshow("CLASS-PASS Camera Finder — DroidCam Preview", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Find available cameras for CLASS-PASS")
    parser.add_argument("--test-url", default=None, help="Test a specific camera URL")
    args = parser.parse_args()

    if args.test_url:
        test_url(args.test_url)
    else:
        scan_cameras()
