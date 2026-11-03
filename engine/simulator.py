"""
NeuroGlove Sensor Simulator
Simulates multimodal hand sensor streams matching the ESP32 MQTT JSON payload.
Generates biomechanically realistic signals for REST, OPEN, CLOSE, and GRASP,
as well as stroke-specific edge cases (active attempts, passive movements, isometric attempts).
"""

import time
import math
import random
from typing import Dict, Any, Generator

class SensorSimulator:
    def __init__(self, sample_rate_hz: int = 50):
        self.sample_rate = sample_rate_hz
        self.dt = 1.0 / sample_rate_hz
        self.seq = 0
        self.start_time = time.time()
        
        # State machine for auto-simulation
        self.current_state = "REST"
        self.state_time = 0.0
        self.state_duration = 3.0  # seconds per state cycle
        
        # AUTO_CYCLE is a free sensor stream; exercise choreography is explicit opt-in.
        self.mode = "AUTO_CYCLE"
        self.manual_state = "REST"
        self.exercise = "Hand Flexion/Extension"
        
        # Finger calibration baselines (min_adc = open/relaxed, max_adc = closed)
        self.calib_min = {"thumb": 1500, "index": 1400, "middle": 1450, "ring": 1400, "pinky": 1350}
        self.calib_max = {"thumb": 2800, "index": 3100, "middle": 3150, "ring": 3050, "pinky": 2950}

    def set_mode(self, mode: str, manual_state: str = "REST"):
        self.mode = mode
        self.manual_state = manual_state
        self.state_time = 0.0

    def set_exercise(self, exercise_name: str):
        self.exercise = exercise_name
        if self.mode == "EXERCISE_CYCLE":
            self.start_time = time.time()

    def _get_target_state(self) -> str:
        if self.mode != "AUTO_CYCLE":
            return self.manual_state
            
        # Cycle: REST (2.5s) -> OPEN (2.0s) -> CLOSE (2.5s) -> GRASP (2.5s) -> REST
        cycle = [
            ("REST", 2.5),
            ("OPEN", 2.0),
            ("CLOSE", 2.5),
            ("GRASP", 2.5)
        ]
        total_cycle_time = sum(d for _, d in cycle)
        t_mod = (time.time() - self.start_time) % total_cycle_time
        
        accum = 0.0
        for state, duration in cycle:
            accum += duration
            if t_mod <= accum:
                return state
        return "REST"

    def generate_sample(self) -> Dict[str, Any]:
        """Generates a single timestamped sensor frame matching the ESP32 contract."""
        self.seq += 1
        now = time.time()
        
        # State profiles for biomechanically realistic signals
        STATE_PROFILES = {
            "REST": {
                "bends": {"thumb": 0.15, "index": 0.18, "middle": 0.18, "ring": 0.15, "pinky": 0.12},
                "emg": 18.0,
                "fsr": 90,
                "motion": 0.02
            },
            "OPEN": {
                "bends": {"thumb": 0.02, "index": 0.02, "middle": 0.02, "ring": 0.02, "pinky": 0.02},
                "emg": 55.0,
                "fsr": 95,
                "motion": 0.35
            },
            "CLOSE": {
                "bends": {"thumb": 0.88, "index": 0.92, "middle": 0.95, "ring": 0.90, "pinky": 0.84},
                "emg": 85.0,
                "fsr": 120,
                "motion": 0.45
            },
            "GRASP": {
                "bends": {"thumb": 0.72, "index": 0.78, "middle": 0.80, "ring": 0.75, "pinky": 0.70},
                "emg": 110.0,
                "fsr": 950,
                "motion": 0.15
            }
        }

        wrist_pitch = 0.0
        if self.mode in ("AUTO_CYCLE", "FREE_MOVEMENT"):
            # Independent mock hardware channels, unrelated to videos, exercise
            # selection, target poses, or repetition counters.
            t = now - self.start_time
            channels = [("thumb", .61, .8), ("index", .83, 2.1),
                        ("middle", .71, 3.4), ("ring", .53, 4.6), ("pinky", .94, 5.7)]
            bend_target = {finger: .05 + .78 * ((1 + math.sin(t * frequency + phase)) / 2) ** 1.4
                           for finger, frequency, phase in channels}
            wrist_pitch = .48 * math.sin(t * .37 + .4)
            fsr_target = 90 + 1150 * max(0.0, math.sin(t * .43 - 1.3)) ** 3
            emg_target = 18 + 65 * sum(bend_target.values()) / 5
            motion_energy = .12 + .13 * abs(math.cos(t * .37))
            target_state = "FREE_MOVEMENT"
        elif self.mode == "EXERCISE_CYCLE":
            if "Wrist" in self.exercise or "wrist" in self.exercise.lower():
                # 1. Wrist Flexion and Extension: Upward extension (+0.65g acc_y) and downward flexion (-0.65g acc_y)
                cycle_stages = [
                    ("REST",       1.5, {"thumb": 0.12, "index": 0.14, "middle": 0.14, "ring": 0.12, "pinky": 0.10}, 20.0, 90,  0.05,  0.00),
                    ("EXTENSION",  2.5, {"thumb": 0.08, "index": 0.10, "middle": 0.10, "ring": 0.08, "pinky": 0.08}, 55.0, 95,  0.40,  0.65),
                    ("REST",       1.2, {"thumb": 0.12, "index": 0.14, "middle": 0.14, "ring": 0.12, "pinky": 0.10}, 20.0, 90,  0.05,  0.00),
                    ("FLEXION",    2.5, {"thumb": 0.15, "index": 0.18, "middle": 0.18, "ring": 0.15, "pinky": 0.12}, 60.0, 95,  0.40, -0.65)
                ]
            elif "Finger" in self.exercise or "ROM" in self.exercise:
                # 2. Individual Finger Movement (ROM): Sequential isolated finger movements
                cycle_stages = [
                    ("REST",       1.2, {"thumb": 0.05, "index": 0.05, "middle": 0.05, "ring": 0.05, "pinky": 0.05}, 20.0, 90,  0.05, 0.0),
                    ("THUMB_ROM",  1.8, {"thumb": 0.88, "index": 0.05, "middle": 0.05, "ring": 0.05, "pinky": 0.05}, 65.0, 95,  0.20, 0.0),
                    ("INDEX_ROM",  1.8, {"thumb": 0.05, "index": 0.92, "middle": 0.05, "ring": 0.05, "pinky": 0.05}, 60.0, 95,  0.22, 0.0),
                    ("MIDDLE_ROM", 1.8, {"thumb": 0.05, "index": 0.05, "middle": 0.94, "ring": 0.05, "pinky": 0.05}, 60.0, 95,  0.22, 0.0),
                    ("RING_ROM",   1.8, {"thumb": 0.05, "index": 0.05, "middle": 0.05, "ring": 0.90, "pinky": 0.05}, 55.0, 95,  0.20, 0.0),
                    ("PINKY_ROM",  1.8, {"thumb": 0.05, "index": 0.05, "middle": 0.05, "ring": 0.05, "pinky": 0.86}, 50.0, 95,  0.18, 0.0),
                    ("OPEN",       1.6, {"thumb": 0.02, "index": 0.02, "middle": 0.02, "ring": 0.02, "pinky": 0.02}, 45.0, 90,  0.15, 0.0)
                ]
            elif "Grasp" in self.exercise:
                # 3. Grasp and Release: Reach open, firm grasp hold with high contact pressure, release
                cycle_stages = [
                    ("REST",  1.5, {"thumb": 0.15, "index": 0.18, "middle": 0.18, "ring": 0.15, "pinky": 0.12}, 18.0, 90,  0.02, 0.0),
                    ("OPEN",  1.8, {"thumb": 0.02, "index": 0.02, "middle": 0.02, "ring": 0.02, "pinky": 0.02}, 45.0, 95,  0.25, 0.0),
                    ("GRASP", 3.8, {"thumb": 0.78, "index": 0.84, "middle": 0.86, "ring": 0.82, "pinky": 0.76}, 115.0, 980, 0.10, 0.0),
                    ("OPEN",  1.8, {"thumb": 0.03, "index": 0.03, "middle": 0.03, "ring": 0.03, "pinky": 0.03}, 40.0, 110, 0.20, 0.0)
                ]
            else:
                # 4. Hand Flexion/Extension: Full synchronous open & close
                cycle_stages = [
                    ("REST",  1.8, {"thumb": 0.15, "index": 0.18, "middle": 0.18, "ring": 0.15, "pinky": 0.12}, 18.0, 90,  0.02, 0.0),
                    ("OPEN",  2.2, {"thumb": 0.02, "index": 0.02, "middle": 0.02, "ring": 0.02, "pinky": 0.02}, 55.0, 95,  0.35, 0.0),
                    ("CLOSE", 2.5, {"thumb": 0.90, "index": 0.94, "middle": 0.96, "ring": 0.92, "pinky": 0.86}, 88.0, 120, 0.45, 0.0)
                ]

            total_cycle_time = sum(s[1] for s in cycle_stages)
            t_mod = (now - self.start_time) % total_cycle_time

            accum = 0.0
            target_stage = cycle_stages[0]
            prev_stage = cycle_stages[-1]
            progress = 0.0

            for i, stage in enumerate(cycle_stages):
                accum += stage[1]
                if t_mod <= accum:
                    target_stage = stage
                    prev_stage = cycle_stages[i - 1]
                    seg_start = accum - stage[1]
                    progress = (t_mod - seg_start) / stage[1]
                    break

            ease = 0.5 - 0.5 * math.cos(progress * math.pi)
            target_state = target_stage[0].split("_")[0]
            if target_state not in ("REST", "OPEN", "CLOSE", "GRASP"):
                target_state = "CLOSE" if ("ROM" in target_stage[0] or "FLEXION" in target_stage[0]) else "OPEN"

            curr_bends, curr_emg, curr_fsr, curr_mot = target_stage[2], target_stage[3], target_stage[4], target_stage[5]
            prev_bends, prev_emg, prev_fsr, prev_mot = prev_stage[2], prev_stage[3], prev_stage[4], prev_stage[5]
            curr_pitch = target_stage[6] if len(target_stage) > 6 else 0.0
            prev_pitch = prev_stage[6] if len(prev_stage) > 6 else 0.0

            bend_target = {
                f: prev_bends[f] + (curr_bends[f] - prev_bends[f]) * ease
                for f in ["thumb", "index", "middle", "ring", "pinky"]
            }
            emg_target = prev_emg + (curr_emg - prev_emg) * ease + random.uniform(-2, 2)
            fsr_target = prev_fsr + (curr_fsr - prev_fsr) * ease
            motion_energy = prev_mot + (curr_mot - prev_mot) * ease
            wrist_pitch = prev_pitch + (curr_pitch - prev_pitch) * ease
        else:
            target_state = self.manual_state
            curr_p = STATE_PROFILES.get(target_state, STATE_PROFILES["REST"])
            bend_target = curr_p["bends"].copy()
            emg_target = curr_p["emg"] + random.uniform(-3, 3)
            fsr_target = curr_p["fsr"] + random.randint(0, 20)
            motion_energy = curr_p["motion"]

        # Stroke / Edge-Case Overrides
        if self.mode == "PASSIVE_MOVEMENT":
            # Limb moved externally without patient muscle recruitment
            emg_target = 16.0 + random.uniform(-2, 2)
        elif self.mode == "ATTEMPT_NO_MOTION":
            # Patient tries to contract muscles (high EMG) but fingers can't move yet
            bend_target = {"thumb": 0.12, "index": 0.14, "middle": 0.14, "ring": 0.12, "pinky": 0.10}
            emg_target = 80.0 + random.uniform(-10, 15)
            fsr_target = 100

        # Calculate Flex ADC with slight physiological jitter
        flex_readings = {}
        for finger in ["thumb", "index", "middle", "ring", "pinky"]:
            span = self.calib_max[finger] - self.calib_min[finger]
            target_val = self.calib_min[finger] + bend_target[finger] * span
            jitter = random.gauss(0, 8.0)
            flex_readings[finger] = int(round(max(self.calib_min[finger], min(self.calib_max[finger] + 200, target_val + jitter))))

        # 2. MPU6050 IMU Simulation (Acceleration in g, Gyro in deg/s)
        acc_noise = random.gauss(0, 0.02)
        gyro_noise = random.gauss(0, 0.5)
        
        acc_x = round(math.sin(now * 1.5) * motion_energy + acc_noise, 3)
        if abs(wrist_pitch) > 0.01:
            acc_y = round(wrist_pitch + acc_noise, 3)
            acc_z = round(math.sqrt(max(0.01, 1.0 - min(0.95, acc_y**2))) + acc_noise, 3)
            gyro_x = round(math.cos(now * 2.5) * motion_energy * 25.0 + gyro_noise, 2)
            gyro_y = round(wrist_pitch * 45.0 + gyro_noise, 2)
            gyro_z = round(math.sin(now * 1.8) * motion_energy * 15.0 + gyro_noise, 2)
        else:
            acc_y = round(math.cos(now * 1.2) * motion_energy + acc_noise, 3)
            acc_z = round(1.0 + math.sin(now * 2.0) * (motion_energy * 0.5) + acc_noise, 3)
            gyro_x = round(math.cos(now * 2.5) * motion_energy * 45.0 + gyro_noise, 2)
            gyro_y = round(math.sin(now * 2.0) * motion_energy * 35.0 + gyro_noise, 2)
            gyro_z = round(math.sin(now * 1.8) * motion_energy * 20.0 + gyro_noise, 2)

        # 3. Surface EMG Simulation
        # Raw AC signal oscillating around baseline (1900 ADC) with amplitude proportional to envelope
        emg_env = max(5.0, emg_target + random.gauss(0, 3.0))
        emg_raw = int(1900 + (emg_env * 4.0) * math.sin(now * 2.0 * math.pi * 75.0) + random.gauss(0, 15.0))

        # 4. FSR Contact Force (0 - 4095)
        fsr_val = int(max(0, min(4095, fsr_target + random.gauss(0, 10.0))))

        return {
            "timestamp": now,
            "device_id": "neuroglove_sim_01",
            "seq": self.seq,
            "ground_truth_state": target_state,
            "sensors": {
                "flex": flex_readings,
                "imu": {
                    "acc_x": acc_x,
                    "acc_y": acc_y,
                    "acc_z": acc_z,
                    "gyro_x": gyro_x,
                    "gyro_y": gyro_y,
                    "gyro_z": gyro_z
                },
                "emg": {
                    "raw": emg_raw,
                    "envelope": round(emg_env, 2)
                },
                "fsr": {
                    "pressure": fsr_val
                }
            }
        }

    def stream_samples(self) -> Generator[Dict[str, Any], None, None]:
        """Generator that yields samples at the configured sample rate."""
        while True:
            t0 = time.time()
            yield self.generate_sample()
            elapsed = time.time() - t0
            sleep_time = max(0.0, self.dt - elapsed)
            time.sleep(sleep_time)

# Standalone quick test
if __name__ == "__main__":
    sim = SensorSimulator(sample_rate_hz=10)
    for _ in range(5):
        sample = sim.generate_sample()
        print(f"[{sample['ground_truth_state']}] Flex Index: {sample['sensors']['flex']['index']} | EMG Env: {sample['sensors']['emg']['envelope']} | FSR: {sample['sensors']['fsr']['pressure']}")
        time.sleep(0.1)
