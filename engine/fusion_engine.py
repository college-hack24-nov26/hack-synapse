"""
NeuroGlove Sensor Fusion & Attempt Engine
Combines kinematic motion (Flex + IMU) and neuro-muscular signals (EMG)
to differentiate active attempts, passive movements, and isometric attempts
while maintaining a cautious UNCERTAIN state.
"""

from typing import Dict, Any
import config

class SensorFusionEngine:
    def __init__(self, calibration_profile: Dict[str, Any] = None):
        self.calib = calibration_profile or config.DEFAULT_CALIBRATION
        
        # Thresholds
        self.emg_active_thresh = self.calib.get("emg", {}).get("active_threshold", 45.0)
        self.emg_baseline = self.calib.get("emg", {}).get("baseline_envelope", 20.0)
        self.motion_bend_delta_thresh = 15.0 # Flex change in window
        self.imu_motion_thresh = 0.15        # Dynamic acc or gyro energy

    def update_thresholds(self, emg_baseline: float, emg_active: float):
        self.emg_baseline = emg_baseline
        self.emg_active_thresh = emg_active

    def evaluate_attempt(self, feature_dict: Dict[str, float], predicted_class: str) -> Dict[str, Any]:
        """
        Evaluates neuromuscular activation alongside movement kinematics.
        Returns:
            dict containing status, label, explanation, and confidence flag.
        """
        emg_env = feature_dict.get("emg_env_mean", 20.0)
        emg_peak = feature_dict.get("emg_env_max", 20.0)
        bend_range = feature_dict.get("hand_bend_std", 0.0) * 2.0  # approximate range
        bend_mean = feature_dict.get("hand_bend_mean", 0.0)
        imu_energy = feature_dict.get("imu_gyro_energy_mean", 0.0)
        dyn_acc = feature_dict.get("imu_dyn_acc_mean", 0.0)

        # Detect whether physical movement occurred
        movement_detected = (bend_range > 6.0) or (imu_energy > 8.0) or (dyn_acc > 0.08) or (predicted_class in ("OPEN", "CLOSE", "GRASP") and bend_mean > 35.0)

        # Detect whether muscle activation was recorded
        activation_detected = (emg_env >= self.emg_active_thresh) or (emg_peak >= self.emg_active_thresh * 1.25)
        activation_borderline = abs(emg_env - self.emg_active_thresh) < 5.0

        # Borderline / Insufficient Evidence Condition
        if activation_borderline:
            status = "UNCERTAIN"
            code = "UNCERTAIN_SIGNAL"
            explanation = "EMG signal is borderline around the active threshold; insufficient evidence to classify attempt."
            is_active = False

        elif movement_detected and activation_detected:
            status = "ACTIVE_ATTEMPT"
            code = "ACTIVE"
            explanation = "Detectable muscle activity accompanied by physical movement."
            is_active = True

        elif movement_detected and not activation_detected:
            status = "MOVEMENT_WITHOUT_ACTIVATION"
            code = "PASSIVE_OR_ASSISTED"
            explanation = "Physical movement observed without detectable surface muscle activation (assisted or passive motion)."
            is_active = False

        elif not movement_detected and activation_detected:
            status = "ATTEMPT_WITHOUT_MOVEMENT"
            code = "ISOMETRIC_ATTEMPT"
            explanation = "Measurable muscle activity detected without significant joint displacement (paretic attempt or isometric hold)."
            is_active = True

        else:
            status = "REST"
            code = "REST_STATE"
            explanation = "Baseline muscle activity with no significant hand kinematics."
            is_active = False

        return {
            "status": status,
            "code": code,
            "is_active_attempt": is_active,
            "explanation": explanation,
            "metrics": {
                "emg_envelope": round(emg_env, 1),
                "active_threshold": round(self.emg_active_thresh, 1),
                "movement_detected": movement_detected,
                "activation_detected": activation_detected
            }
        }
