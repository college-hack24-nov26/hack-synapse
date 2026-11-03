"""
NeuroGlove Exercise Repetition Counter & State Machine
Tracks exercise repetitions, phase transitions (INITIATING -> PEAK -> RETURNING -> COMPLETED),
measures movement duration, finger Range of Motion (ROM), and within-session consistency.
"""

import time
import numpy as np
from typing import Dict, Any, List, Optional
import config

class RepetitionCounter:
    def __init__(self, exercise_name: str = "Hand Flexion/Extension"):
        self.exercise_name = exercise_name
        self.reset()

    def reset(self):
        """Resets the repetition counter for a new session."""
        self.state = "IDLE"  # IDLE, INITIATING, PEAK, RETURNING
        self.rep_count = 0
        self.rep_start_time = None
        self.rep_peak_time = None
        
        # Current rep tracking
        self.current_peak_rom = 0.0
        self.current_finger_peaks = {f: 0.0 for f in ["thumb", "index", "middle", "ring", "pinky"]}
        self.current_peak_fsr = 0.0
        self.current_attempt_status = "REST"
        
        # Session history for consistency comparison
        self.completed_reps: List[Dict[str, Any]] = []

    def set_exercise(self, exercise_name: str):
        self.exercise_name = exercise_name
        self.reset()

    def update(self, processed_frame: Dict[str, Any], attempt_info: Dict[str, Any], predicted_class: str) -> Optional[Dict[str, Any]]:
        """
        Feeds a processed frame into the exercise state machine.
        Returns:
            dict with completed repetition details if a repetition just finished, otherwise None.
        """
        now = processed_frame["timestamp"]
        hand_bend = processed_frame["mean_bend_pct"]
        finger_bends = processed_frame["flex"]
        fsr_pressure = processed_frame["fsr"]["pressure_pct"]
        
        # Tracking variable depending on exercise
        is_grasp_ex = "Grasp" in self.exercise_name
        signal_val = fsr_pressure if is_grasp_ex else hand_bend
        
        thresholds = config.REP_THRESHOLDS["grasp" if is_grasp_ex else "open_close"]
        start_thresh = thresholds["start_fsr"] if is_grasp_ex else thresholds["start_bend_pct"]
        peak_thresh = thresholds["peak_fsr"] if is_grasp_ex else thresholds["peak_bend_pct"]
        return_thresh = thresholds["return_fsr"] if is_grasp_ex else thresholds["return_bend_pct"]
        min_dur = thresholds["min_duration_sec"]
        max_dur = thresholds["max_duration_sec"]

        # Track attempt status during movement
        if attempt_info["status"] != "REST":
            self.current_attempt_status = attempt_info["status"]

        # State 1: IDLE -> INITIATING
        if self.state == "IDLE":
            if signal_val >= start_thresh:
                self.state = "INITIATING"
                self.rep_start_time = now
                self.current_peak_rom = signal_val
                self.current_finger_peaks = dict(finger_bends)
                self.current_attempt_status = attempt_info["status"]

        # State 2: INITIATING -> PEAK
        elif self.state == "INITIATING":
            if signal_val > self.current_peak_rom:
                self.current_peak_rom = signal_val
                for f in finger_bends:
                    if finger_bends[f] > self.current_finger_peaks[f]:
                        self.current_finger_peaks[f] = finger_bends[f]

            # Reached qualified peak threshold
            if signal_val >= peak_thresh:
                self.state = "PEAK"
                self.rep_peak_time = now
            
            # Check timeout / aborted rep
            elif (now - self.rep_start_time) > max_dur:
                self.state = "IDLE"  # timed out without reaching peak

        # State 3: PEAK -> RETURNING
        elif self.state == "PEAK":
            if signal_val > self.current_peak_rom:
                self.current_peak_rom = signal_val

            # Began returning to extension
            if signal_val <= (self.current_peak_rom - 15.0):
                self.state = "RETURNING"

        # State 4: RETURNING -> COMPLETED
        elif self.state == "RETURNING":
            if signal_val <= return_thresh:
                duration = now - self.rep_start_time
                self.state = "IDLE"

                # Check duration validity
                if duration >= min_dur and duration <= max_dur:
                    self.rep_count += 1
                    
                    # Compute consistency against prior repetitions
                    consistency = self._calculate_consistency(self.current_peak_rom, duration)
                    
                    completed_rep = {
                        "rep_number": self.rep_count,
                        "exercise": self.exercise_name,
                        "duration_sec": round(duration, 2),
                        "peak_rom": round(self.current_peak_rom, 1),
                        "finger_peaks": {f: round(self.current_finger_peaks[f], 1) for f in self.current_finger_peaks},
                        "movement_class": predicted_class,
                        "attempt_status": self.current_attempt_status,
                        "consistency_score": round(consistency, 1),
                        "timestamp": now
                    }
                    self.completed_reps.append(completed_rep)
                    return completed_rep
                else:
                    # Invalid duration (too fast jerk or timeout)
                    pass

        return None

    def _calculate_consistency(self, peak_rom: float, duration: float) -> float:
        """Calculates repetition consistency relative to previous completed repetitions in the session."""
        if len(self.completed_reps) == 0:
            return 100.0

        prev_roms = [r["peak_rom"] for r in self.completed_reps]
        prev_durs = [r["duration_sec"] for r in self.completed_reps]
        
        mean_rom = np.mean(prev_roms)
        mean_dur = np.mean(prev_durs)

        rom_err = abs(peak_rom - mean_rom) / max(1.0, mean_rom)
        dur_err = abs(duration - mean_dur) / max(0.5, mean_dur)

        # Combined penalty
        combined_err = (rom_err * 0.6) + (dur_err * 0.4)
        consistency = max(20.0, min(100.0, (1.0 - combined_err) * 100.0))
        return consistency

    def get_summary_metrics(self) -> Dict[str, Any]:
        """Calculates aggregate session statistics across all completed repetitions."""
        if not self.completed_reps:
            return {
                "total_reps": 0,
                "avg_duration": 0.0,
                "avg_rom": 0.0,
                "avg_consistency": 0.0,
                "active_attempts": 0,
                "passive_movements": 0,
                "attempt_no_motion": 0,
                "uncertain": 0
            }

        durs = [r["duration_sec"] for r in self.completed_reps]
        roms = [r["peak_rom"] for r in self.completed_reps]
        cons = [r["consistency_score"] for r in self.completed_reps]
        
        active = sum(1 for r in self.completed_reps if r["attempt_status"] == "ACTIVE_ATTEMPT")
        passive = sum(1 for r in self.completed_reps if r["attempt_status"] == "MOVEMENT_WITHOUT_ACTIVATION")
        no_motion = sum(1 for r in self.completed_reps if r["attempt_status"] == "ATTEMPT_WITHOUT_MOVEMENT")
        uncertain = sum(1 for r in self.completed_reps if r["attempt_status"] == "UNCERTAIN")

        return {
            "total_reps": len(self.completed_reps),
            "avg_duration": round(float(np.mean(durs)), 2),
            "avg_rom": round(float(np.mean(roms)), 1),
            "avg_consistency": round(float(np.mean(cons)), 1),
            "active_attempts": active,
            "passive_movements": passive,
            "attempt_no_motion": no_motion,
            "uncertain": uncertain
        }
