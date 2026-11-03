"""
NeuroGlove Sensor Preprocessor
Performs calibration normalization, outlier filtering, sensor dropout checks,
and signal smoothing for multimodal glove data.
"""

import math
from collections import deque
from statistics import median
import numpy as np
from typing import Dict, Any, Tuple, Optional
import config
from engine.emg_estimator import EMGEstimator

class SensorPreprocessor:
    def __init__(self, calibration_profile: Optional[Dict[str, Any]] = None):
        self.calib = calibration_profile or config.DEFAULT_CALIBRATION
        
        # EMA filter state (alpha: smoothing factor, 0.0 - 1.0)
        self.alpha_flex = 0.35
        self.alpha_imu = 0.40
        self.alpha_emg = 0.30
        self.alpha_fsr = 0.40
        
        # Smoothed historical states
        self.smoothed_flex = {f: 0.0 for f in ["thumb", "index", "middle", "ring", "pinky"]}
        self.flex_samples = {f: deque(maxlen=3) for f in self.smoothed_flex}
        self.stable_flex = {f: 0.0 for f in self.smoothed_flex}
        self.smoothed_imu = {"acc_x": 0.0, "acc_y": 0.0, "acc_z": 1.0, "gyro_x": 0.0, "gyro_y": 0.0, "gyro_z": 0.0}
        self.smoothed_emg_env = 20.0
        self.smoothed_fsr = 0.0
        self.emg_estimator = EMGEstimator()
        
        # Anomaly tracking
        self.last_timestamp = None
        self.dropout_counters = {f: 0 for f in ["thumb", "index", "middle", "ring", "pinky"]}

    def update_calibration(self, new_calibration: Dict[str, Any]):
        """Dynamically update calibration baselines."""
        self.calib = new_calibration
        self.emg_estimator = EMGEstimator()
        self.smoothed_fsr = 0.0
        for f,samples in self.flex_samples.items():
            samples.clear()
            self.smoothed_flex[f]=self.stable_flex[f]=0.0

    def process_frame(self, raw_frame: Dict[str, Any]) -> Tuple[Dict[str, Any], list]:
        """
        Processes a raw sensor payload from ESP32 or Simulator.
        Returns:
            processed_data: dict of calibrated & filtered values
            anomalies: list of warning strings if sensor faults are detected
        """
        sensors = raw_frame.get("sensors", {})
        raw_flex = sensors.get("flex", {})
        raw_imu = sensors.get("imu", {})
        raw_emg = sensors.get("emg", {})
        raw_fsr = sensors.get("fsr", {})
        ts = raw_frame.get("timestamp", 0.0)
        # Hardware already samples at 10 Hz. A slow EMA here followed by the
        # renderer's interpolation compounds into several hundred ms of lag.
        live_hardware = raw_frame.get('_source') in ('serial', 'mqtt')
        flex_alpha = 0.65 if live_hardware else self.alpha_flex
        imu_alpha = 0.65 if live_hardware else self.alpha_imu
        fsr_alpha = 0.65 if live_hardware else self.alpha_fsr

        anomalies = []

        # 1. Check data gap / timing jitter
        if self.last_timestamp is not None:
            dt = ts - self.last_timestamp
            if dt > 0.15: # > 150ms gap
                anomalies.append(f"DATA_GAP: {round(dt * 1000)}ms latency")
        self.last_timestamp = ts

        # 2. Process Flex Sensors -> [0.0 - 100.0%] bend
        calibrated_flex = {}
        flex_calib = self.calib.get("flex", config.DEFAULT_CALIBRATION["flex"])
        
        for finger in ["thumb", "index", "middle", "ring", "pinky"]:
            adc = raw_flex.get(finger, 2000)
            
            # Check for physical disconnect / saturation
            finger_calib=flex_calib.get(finger,{})
            lowest_endpoint=min(finger_calib.get("min_adc",1400),finger_calib.get("max_adc",3100))
            if adc <= 50 and lowest_endpoint>50:
                anomalies.append(f"DROPOUT: {finger} flex sensor disconnected (ADC ~ 0)")
            elif adc >= 4080:
                anomalies.append(f"SATURATION: {finger} flex sensor saturated (ADC ~ 4095)")

            # Min-Max Normalization
            min_adc = flex_calib.get(finger, {}).get("min_adc", 1400)
            max_adc = flex_calib.get(finger, {}).get("max_adc", 3100)
            span = max_adc - min_adc
            if abs(span)<1:span=1
            
            # 0% = full extension, 100% = full flexion
            pct = ((adc - min_adc) / span) * 100.0
            pct_clipped = float(np.clip(pct, 0.0, 100.0))
            
            if live_hardware:
                samples = self.flex_samples[finger]
                samples.append(pct_clipped)
                # Reject isolated ADC spikes. Sustained movement passes after
                # one extra sensor sample rather than a long smoothing window.
                target = median(samples) if len(samples) == 3 else pct_clipped
                rest_adc = flex_calib.get(finger, {}).get('rest_adc')
                if isinstance(rest_adc, (int, float)) and math.isfinite(rest_adc):
                    rest_pct = max(0.0, min(100.0, (rest_adc-min_adc)/span*100))
                    # Anchor only tiny fluctuations around the measured resting
                    # pose. Keep the actual open/closed range and bend direction.
                    if abs(target-rest_pct) <= 1.5:target = rest_pct
                delta = abs(target - self.smoothed_flex[finger])
                alpha = .18 if delta < 5 else .4 if delta < 10 else .75
                self.smoothed_flex[finger] += alpha * (target - self.smoothed_flex[finger])
                # A stationary joint holds its last target inside a small band;
                # accumulated slow movements still cross it and remain visible.
                if abs(self.smoothed_flex[finger] - self.stable_flex[finger]) >= 1.5:
                    self.stable_flex[finger] = self.smoothed_flex[finger]
                calibrated_flex[finger] = round(self.stable_flex[finger], 1)
            else:
                self.smoothed_flex[finger] = (flex_alpha * pct_clipped) + ((1.0 - flex_alpha) * self.smoothed_flex[finger])
                calibrated_flex[finger] = round(self.smoothed_flex[finger], 1)

        # Average hand flexion
        mean_hand_bend = round(float(np.mean(list(calibrated_flex.values()))), 1)

        # 3. Process IMU -> Acceleration magnitude & Gyro energy
        acc_x = raw_imu.get("acc_x", 0.0)
        acc_y = raw_imu.get("acc_y", 0.0)
        acc_z = raw_imu.get("acc_z", 1.0)
        gyro_x = raw_imu.get("gyro_x", 0.0)
        gyro_y = raw_imu.get("gyro_y", 0.0)
        gyro_z = raw_imu.get("gyro_z", 0.0)

        # Update smoothed IMU
        for k, v in [("acc_x", acc_x), ("acc_y", acc_y), ("acc_z", acc_z),
                     ("gyro_x", gyro_x), ("gyro_y", gyro_y), ("gyro_z", gyro_z)]:
            self.smoothed_imu[k] = (imu_alpha * v) + ((1.0 - imu_alpha) * self.smoothed_imu[k])

        acc_mag = math.sqrt(self.smoothed_imu["acc_x"]**2 + self.smoothed_imu["acc_y"]**2 + self.smoothed_imu["acc_z"]**2)
        # Dynamic acceleration (subtracting ~1g static gravity)
        dyn_acc = abs(acc_mag - 1.0)
        gyro_energy = math.sqrt(self.smoothed_imu["gyro_x"]**2 + self.smoothed_imu["gyro_y"]**2 + self.smoothed_imu["gyro_z"]**2)

        # 4. Process EMG Envelope
        emg_available=raw_emg.get("available",True) is not False
        raw_env = raw_emg.get("envelope", 20.0) if emg_available else 0.0
        self.smoothed_emg_env = (self.alpha_emg * raw_env) + ((1.0 - self.alpha_emg) * self.smoothed_emg_env)
        emg_env = round(self.smoothed_emg_env, 1)

        # 5. Process FSR Pressure (0 - 100%)
        fsr_raw = raw_fsr.get("pressure", 0)
        fsr_base = self.calib.get("fsr_baseline", 100)
        fsr_active = max(0, fsr_raw - fsr_base)
        # Normalize: 0 to 1000 ADC difference mapped to 0-100%
        fsr_pct = float(np.clip((fsr_active / max(1,self.calib.get("fsr_max_raw",1300)-fsr_base)) * 100.0, 0.0, 100.0))
        self.smoothed_fsr = (fsr_alpha * fsr_pct) + ((1.0 - fsr_alpha) * self.smoothed_fsr)
        fsr_smooth_pct = round(self.smoothed_fsr, 1)

        processed = {
            "timestamp": ts,
            "seq": raw_frame.get("seq", 0),
            "flex": calibrated_flex,
            "mean_bend_pct": mean_hand_bend,
            "imu": {
                "acc_x": round(self.smoothed_imu["acc_x"], 3),
                "acc_y": round(self.smoothed_imu["acc_y"], 3),
                "acc_z": round(self.smoothed_imu["acc_z"], 3),
                "acc_mag": round(acc_mag, 3),
                "dyn_acc": round(dyn_acc, 3),
                "gyro_x": round(self.smoothed_imu["gyro_x"], 2),
                "gyro_y": round(self.smoothed_imu["gyro_y"], 2),
                "gyro_z": round(self.smoothed_imu["gyro_z"], 2),
                "gyro_energy": round(gyro_energy, 2)
            },
            "emg": {
                "raw": raw_emg.get("raw", 1900) if emg_available else None,
                "envelope": emg_env if emg_available else None,
                "available":emg_available
            },
            "fsr": {
                "raw": fsr_raw,
                "pressure_instant_pct": round(fsr_pct,1),
                "pressure_pct": fsr_smooth_pct
            }
        }

        if raw_frame.get('_source') in ('serial','mqtt'):
            x,y,z=(self.smoothed_imu[key] for key in ('acc_x','acc_y','acc_z'))
            # Pitch is a bounded tilt; roll must keep the sign of Z to distinguish
            # palm-up from palm-down across the full forearm rotation.
            if config.SERIAL_SWAP_IMU_AXES:
                pitch=math.degrees(math.atan2(x,math.hypot(y,z)))
                roll=math.degrees(math.atan2(y,z))
            else:
                pitch=math.degrees(math.atan2(y,math.hypot(x,z)))
                roll=math.degrees(math.atan2(x,z))
            processed['imu'].update(pitch=round(pitch,2),roll=round(roll,2),orientation_mapping='pitch_roll_swapped' if config.SERIAL_SWAP_IMU_AXES else 'native')
        if live_hardware and not emg_available and config.ESTIMATE_MISSING_EMG:
            processed['emg']=self.emg_estimator.update(processed)
        return processed, anomalies
