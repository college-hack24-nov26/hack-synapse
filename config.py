"""
NeuroGlove Edge-AI Configuration
Centralized configuration parameters for data acquisition, preprocessing,
feature extraction, machine learning, repetition counting, and dashboard display.
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "ml" / "models"
REPORTS_DIR = BASE_DIR / "reports"
DB_PATH = DATA_DIR / "neuroglove.db"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Operational Mode: "simulate" or "mqtt"
DEFAULT_DATA_SOURCE = os.getenv("NEUROGLOVE_DATA_SOURCE", "simulate")
ESTIMATE_MISSING_EMG = os.getenv("NEUROGLOVE_ESTIMATE_EMG", "1") == "1"

SERIAL_PORT = os.getenv("NEUROGLOVE_SERIAL_PORT", "COM11")
SERIAL_BAUD = int(os.getenv("NEUROGLOVE_SERIAL_BAUD", "115200"))
# MPU6050 mounting on this glove exchanges wrist pitch and roll.
SERIAL_SWAP_IMU_AXES = os.getenv("NEUROGLOVE_SWAP_IMU_AXES", "1") == "1"

# Sampling & Windowing
SAMPLING_RATE_HZ = 50          # 50 Hz (1 sample every 20ms)
SAMPLE_INTERVAL_SEC = 1.0 / SAMPLING_RATE_HZ
WINDOW_SIZE_SAMPLES = 25       # 500ms sliding window
WINDOW_STEP_SAMPLES = 5        # 100ms step (10 updates per second)

# MQTT Broker Settings
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_SENSOR_DATA = "neuroglove/sensors/data"
MQTT_TOPIC_STATUS = "neuroglove/control/status"
MQTT_TOPIC_CALIBRATION = "neuroglove/control/calibration"
MQTT_CLIENT_ID = "neuroglove_rpi_edge"
MQTT_KEEPALIVE_SEC = 60
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")

# Model Settings
MODEL_PATH = MODELS_DIR / "random_forest_movement.joblib"
MODEL_CLASSES = ["REST", "OPEN", "CLOSE", "GRASP"]

# Baseline Calibration Defaults (Raw 12-bit ADC: 0 - 4095)
DEFAULT_CALIBRATION = {
    "flex": {
        "thumb":  {"min_adc": 1500, "max_adc": 2900},
        "index":  {"min_adc": 1400, "max_adc": 3100},
        "middle": {"min_adc": 1450, "max_adc": 3150},
        "ring":   {"min_adc": 1400, "max_adc": 3050},
        "pinky":  {"min_adc": 1350, "max_adc": 2950}
    },
    "emg": {
        "baseline_envelope": 20.0,
        "active_threshold": 45.0,    # Envelope above this signals muscle activation
        "high_effort_threshold": 90.0
    },
    "fsr": {
        "baseline_raw": 100,
        "contact_threshold": 350,     # Contact detected above this
        "firm_grasp_threshold": 1200
    },
    "imu": {
        "motion_energy_threshold": 0.25 # Acceleration variance / gyro energy
    }
}

# Repetition Counting State Thresholds
REP_THRESHOLDS = {
    "open_close": {
        "start_bend_pct": 25.0,     # Start flexion when bend crosses 25%
        "peak_bend_pct": 65.0,      # Qualifies as full flexion rep
        "return_bend_pct": 20.0,    # Return to extension
        "min_duration_sec": 0.6,    # Avoid rapid noise triggering
        "max_duration_sec": 6.0     # Rep timeout
    },
    "grasp": {
        "start_fsr": 300,
        "peak_fsr": 800,
        "return_fsr": 250,
        "min_duration_sec": 0.8,
        "max_duration_sec": 7.0
    }
}

# Web Server Settings
WEB_HOST = os.getenv("NEUROGLOVE_WEB_HOST", "0.0.0.0")
WEB_PORT = int(os.getenv("NEUROGLOVE_WEB_PORT", "5000"))
DEBUG = os.getenv("NEUROGLOVE_DEBUG", "False").lower() in ("true", "1")
