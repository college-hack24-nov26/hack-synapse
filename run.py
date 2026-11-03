"""
NeuroGlove React Edge-AI System — Master Local Entrypoint
Starts the multimodal Edge-AI processing pipeline connected directly to ESP32 over USB,
initializes the local SQLite database, and serves the high-performance React dashboard.

Usage:
    python run.py                           # Run React app on port 5000 with ESP32 USB data
    python run.py --port 5002               # Custom port
    python run.py --serial-port COM11       # Custom COM port
    python run.py --source simulate         # Run with simulator if glove unplugged
"""

import sys
import os
import socket
import argparse
import atexit
import logging
import subprocess
from pathlib import Path

# Add NeuroGlove-React root to sys.path
REACT_ROOT = Path(__file__).resolve().parent
if str(REACT_ROOT) not in sys.path:
    sys.path.insert(0, str(REACT_ROOT))

from flask import send_from_directory, jsonify
from web.app import app
from engine.edge_pipeline import pipeline
import config

log = logging.getLogger("NeuroGlove.React")

# 1. Mount React workspace views
workspace_view = app.view_functions['index']

@app.get('/api/react/workspace')
def react_workspace():
    """Returns the core DOM workspace markup parsed by React."""
    return workspace_view()

def react_index():
    """Serves the compiled React production index.html."""
    dist_index = REACT_ROOT / 'dist' / 'index.html'
    if not dist_index.exists():
        return (
            "<h3>React build missing.</h3><p>Run <code>npm run build</code> inside NeuroGlove-React.</p>",
            503
        )
    return send_from_directory(REACT_ROOT / 'dist', 'index.html')

app.view_functions['index'] = react_index

@app.get('/assets/<path:filename>')
def react_assets(filename):
    """Serves bundled React JS/CSS chunks."""
    return send_from_directory(REACT_ROOT / 'dist' / 'assets', filename)


def auto_detect_serial_port():
    """Scans for active CP210x, CH340, FTDI, or USB-UART bridges."""
    try:
        import serial.tools.list_ports
        for p in serial.tools.list_ports.comports():
            desc = (p.description or '').lower()
            hwid = (p.hwid or '').lower()
            if any(k in desc or k in hwid for k in ('cp210', 'ch340', 'ftdi', 'usb-to-uart', 'uart bridge', '10c4:ea60')):
                return p.device
    except Exception:
        pass
    return None


def get_local_ip():
    """Detects local LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def ensure_react_build():
    """Ensures dist/index.html is built before starting."""
    dist_index = REACT_ROOT / 'dist' / 'index.html'
    if not dist_index.exists():
        print("[*] React build not found. Running 'npm run build'...")
        res = subprocess.run(["npm", "run", "build"], cwd=str(REACT_ROOT), shell=True)
        if res.returncode != 0:
            print("[!] Warning: npm run build failed. Continuing anyway...")


def parse_args():
    parser = argparse.ArgumentParser(description="NeuroGlove React Edge-AI System")
    parser.add_argument("--source", choices=["serial", "mqtt", "simulate"], default="serial",
                        help="Data source mode: 'serial' (direct ESP32 USB), 'mqtt', or 'simulate' (default: serial)")
    parser.add_argument("--serial-port", default=getattr(config, "SERIAL_PORT", "COM11"),
                        help="Serial COM port for ESP32 (default: COM11 or auto-detect)")
    parser.add_argument("--baud", type=int, default=getattr(config, "SERIAL_BAUD", 115200),
                        help="Baud rate (default: 115200)")
    parser.add_argument("--host", default="0.0.0.0", help="Web server bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5000, help="Web server port (default: 5000)")
    return parser.parse_args()


def main():
    try:
        if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
        if hasattr(sys.stderr, "reconfigure"): sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S"
    )

    args = parse_args()
    ensure_react_build()

    port = args.serial_port
    if args.source == "serial":
        detected = auto_detect_serial_port()
        if detected:
            port = detected
            log.info("Auto-detected ESP32 USB device on %s", port)
        else:
            log.info("Using configured serial port: %s (will auto-connect when plugged in)", port)

        pipeline.serial_receiver.port = port
        pipeline.serial_receiver.baud = args.baud

    pipeline.set_source(args.source)
    pipeline.start()
    atexit.register(pipeline.stop)

    local_ip = get_local_ip()
    print("=" * 68)
    print("  NEUROGLOVE REACT - DIRECT ESP32 SENSOR DASHBOARD")
    print("=" * 68)
    print(f"  • Local Dashboard  : http://localhost:{args.port}")
    print(f"  • Network URL      : http://{local_ip}:{args.port}")
    print(f"  • Data Source      : [{args.source.upper()}] direct from ESP32")
    if args.source == "serial":
        print(f"  • Serial Port      : {port} @ {args.baud} baud")
        print("  • Note             : Ensure Arduino IDE Serial Monitor is closed")
    print("=" * 68 + "\n")

    app.run(host=args.host, port=args.port, debug=False, threaded=True, use_reloader=False)


if __name__ == '__main__':
    main()

