"""
NeuroGlove Sliding Window Feature Extractor
Extracts statistical, kinetic, and physiological features over a sliding window
for Random Forest movement classification and sensor fusion.
"""

from collections import deque
import numpy as np
from typing import Dict, Any, List, Optional
import config

FEATURE_NAMES = [
    # Flex Means
    "flex_thumb_mean", "flex_index_mean", "flex_middle_mean", "flex_ring_mean", "flex_pinky_mean",
    # Flex Standard Deviations
    "flex_thumb_std", "flex_index_std", "flex_middle_std", "flex_ring_std", "flex_pinky_std",
    # Flex Ranges (Max - Min in window)
    "flex_thumb_range", "flex_index_range", "flex_middle_range", "flex_ring_range", "flex_pinky_range",
    # Flex Delta (Velocity)
    "flex_thumb_delta", "flex_index_delta", "flex_middle_delta", "flex_ring_delta", "flex_pinky_delta",
    # Aggregate Hand Flexion
    "hand_bend_mean", "hand_bend_std", "hand_bend_delta",
    # IMU Dynamics
    "imu_acc_mag_mean", "imu_acc_mag_std", "imu_dyn_acc_mean", "imu_gyro_energy_mean", "imu_gyro_energy_max",
    # EMG Features
    "emg_env_mean", "emg_env_max", "emg_env_std", "emg_rms",
    # FSR Features
    "fsr_pressure_mean", "fsr_pressure_max", "fsr_pressure_delta"
]

class FeatureExtractor:
    def __init__(self, window_size: int = config.WINDOW_SIZE_SAMPLES):
        self.window_size = window_size
        self.buffer = deque(maxlen=window_size)

    def add_frame(self, processed_frame: Dict[str, Any]):
        """Add a processed frame to the sliding window buffer."""
        self.buffer.append(processed_frame)

    def is_ready(self) -> bool:
        """Returns True if buffer has enough frames for a full window."""
        return len(self.buffer) >= self.window_size

    def extract_features(self) -> Optional[Dict[str, float]]:
        """
        Extracts named features from the current window buffer.
        Returns dict of feature_name -> float value, or None if buffer not ready.
        """
        if not self.is_ready():
            return None

        # Unpack time series from buffer
        fingers = ["thumb", "index", "middle", "ring", "pinky"]
        flex_series = {f: [item["flex"][f] for item in self.buffer] for f in fingers}
        hand_bends = [item["mean_bend_pct"] for item in self.buffer]

        acc_mags = [item["imu"]["acc_mag"] for item in self.buffer]
        dyn_accs = [item["imu"]["dyn_acc"] for item in self.buffer]
        gyro_energies = [item["imu"]["gyro_energy"] for item in self.buffer]

        emg_envs = [(item["emg"]["envelope"] or 0) for item in self.buffer]
        fsr_pressures = [item["fsr"]["pressure_pct"] for item in self.buffer]

        features: Dict[str, float] = {}

        # 1. Flex Features
        for f in fingers:
            arr = np.array(flex_series[f])
            features[f"flex_{f}_mean"] = float(np.mean(arr))
            features[f"flex_{f}_std"] = float(np.std(arr))
            features[f"flex_{f}_range"] = float(np.ptp(arr))  # max - min
            features[f"flex_{f}_delta"] = float(arr[-1] - arr[0])

        features["hand_bend_mean"] = float(np.mean(hand_bends))
        features["hand_bend_std"] = float(np.std(hand_bends))
        features["hand_bend_delta"] = float(hand_bends[-1] - hand_bends[0])

        # 2. IMU Features
        features["imu_acc_mag_mean"] = float(np.mean(acc_mags))
        features["imu_acc_mag_std"] = float(np.std(acc_mags))
        features["imu_dyn_acc_mean"] = float(np.mean(dyn_accs))
        features["imu_gyro_energy_mean"] = float(np.mean(gyro_energies))
        features["imu_gyro_energy_max"] = float(np.max(gyro_energies))

        # 3. EMG Features
        emg_arr = np.array(emg_envs)
        features["emg_env_mean"] = float(np.mean(emg_arr))
        features["emg_env_max"] = float(np.max(emg_arr))
        features["emg_env_std"] = float(np.std(emg_arr))
        features["emg_rms"] = float(np.sqrt(np.mean(emg_arr ** 2)))

        # 4. FSR Features
        fsr_arr = np.array(fsr_pressures)
        features["fsr_pressure_mean"] = float(np.mean(fsr_arr))
        features["fsr_pressure_max"] = float(np.max(fsr_arr))
        features["fsr_pressure_delta"] = float(fsr_arr[-1] - fsr_arr[0])

        return features

    def get_feature_vector(self, features: Dict[str, float]) -> List[float]:
        """Converts dict of features into ordered list matching FEATURE_NAMES."""
        return [features.get(name, 0.0) for name in FEATURE_NAMES]
