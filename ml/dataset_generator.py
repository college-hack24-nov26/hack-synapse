"""
NeuroGlove ML Dataset Generator
Synthesizes labelled multimodal dataset simulating diverse participants and hand sessions.
Ensures zero train/serve skew by routing raw signals through the real Preprocessor and FeatureExtractor.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import random
import pandas as pd
from typing import Tuple
from engine.simulator import SensorSimulator
from engine.preprocessor import SensorPreprocessor
from engine.feature_extractor import FeatureExtractor, FEATURE_NAMES
import config


def generate_session_data(num_cycles_per_class: int = 40, noise_level: float = 1.0) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates training and testing feature data across REST, OPEN, CLOSE, GRASP.
    Returns:
        train_df, test_df
    """
    classes = ["REST", "OPEN", "CLOSE", "GRASP"]

    rows = []

    # Simulate 4 different "participants" with slightly different calibration offsets
    participants = [
        {"id": "P1", "calib_offset": 0},
        {"id": "P2", "calib_offset": -50},
        {"id": "P3", "calib_offset": 60},
        {"id": "P4_Test", "calib_offset": -20}  # Held-out participant for testing
    ]

    for p in participants:
        sim = SensorSimulator(sample_rate_hz=50)
        # Apply participant offset to baselines
        for k in sim.calib_min:
            sim.calib_min[k] += p["calib_offset"]
            sim.calib_max[k] += p["calib_offset"]

        preproc = SensorPreprocessor()
        extractor = FeatureExtractor(window_size=config.WINDOW_SIZE_SAMPLES)

        for label in classes:
            sim.set_mode("MANUAL_HOLD", manual_state=label)
            # Warm up buffer
            extractor.buffer.clear()

            # Generate frames
            frames_to_generate = num_cycles_per_class * 15
            for i in range(frames_to_generate):
                raw = sim.generate_sample()
                proc, _ = preproc.process_frame(raw)
                extractor.add_frame(proc)

                # Every STEP samples, extract a feature vector
                if i >= config.WINDOW_SIZE_SAMPLES and (i % config.WINDOW_STEP_SAMPLES == 0):
                    feat_dict = extractor.extract_features()
                    if feat_dict:
                        feat_row = {name: feat_dict[name] for name in FEATURE_NAMES}
                        feat_row["label"] = label
                        feat_row["participant"] = p["id"]
                        rows.append(feat_row)

    df = pd.DataFrame(rows)
    # Shuffle
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    # Participant-level split: P1, P2, P3 in train; P4_Test in test to evaluate generalization!
    train_df = df[df["participant"] != "P4_Test"].drop(columns=["participant"])
    test_df = df[df["participant"] == "P4_Test"].drop(columns=["participant"])

    return train_df, test_df

if __name__ == "__main__":
    print("Generating dataset...")
    train, test = generate_session_data(num_cycles_per_class=20)
    print(f"Generated {len(train)} training samples and {len(test)} test samples.")
    print(f"Class distribution in test:\n{test['label'].value_counts()}")
