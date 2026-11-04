"""
NeuroGlove ML Training & Evaluation Script
Trains Random Forest movement classifier, calculates clinical evaluation metrics,
benchmarks sensor contribution ablation, and exports the model artifact.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

import config
from engine.feature_extractor import FEATURE_NAMES
from ml.dataset_generator import generate_session_data


def train_and_evaluate():
    print("=" * 65)
    print(" NeuroGlove Edge-AI: Training Random Forest Movement Classifier")
    print("=" * 65)

    print("\n[1/4] Generating participant-separated multimodal datasets...")
    train_df, test_df = generate_session_data(num_cycles_per_class=35)

    X_train = train_df[FEATURE_NAMES]
    y_train = train_df["label"]

    X_test = test_df[FEATURE_NAMES]
    y_test = test_df["label"]

    print(f"  Training samples: {len(X_train)} across 3 participants")
    print(f"  Testing samples:  {len(X_test)} from held-out test participant")

    # 1. Full Multimodal Random Forest Model
    print("\n[2/4] Training Full Multimodal Model (Flex + IMU + EMG + FSR)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=14,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    full_acc = accuracy_score(y_test, y_pred)
    full_macro_f1 = f1_score(y_test, y_pred, average="macro")
    conf_mat = confusion_matrix(y_test, y_pred, labels=config.MODEL_CLASSES)
    report_dict = classification_report(y_test, y_pred, labels=config.MODEL_CLASSES, output_dict=True)

    print(f"  --> Full Model Accuracy: {full_acc * 100:.2f}%")
    print(f"  --> Macro-F1 Score:     {full_macro_f1 * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, labels=config.MODEL_CLASSES))

    # 2. Sensor Contribution Ablation Study
    print("\n[3/4] Running Sensor Contribution Ablation Study...")

    # Subset 1: Flex only
    flex_cols = [c for c in FEATURE_NAMES if c.startswith("flex") or c.startswith("hand")]
    clf_flex = RandomForestClassifier(n_estimators=100, max_depth=14, random_state=42)
    clf_flex.fit(X_train[flex_cols], y_train)
    acc_flex = accuracy_score(y_test, clf_flex.predict(X_test[flex_cols]))

    # Subset 2: Flex + IMU
    flex_imu_cols = flex_cols + [c for c in FEATURE_NAMES if c.startswith("imu")]
    clf_flex_imu = RandomForestClassifier(n_estimators=100, max_depth=14, random_state=42)
    clf_flex_imu.fit(X_train[flex_imu_cols], y_train)
    acc_flex_imu = accuracy_score(y_test, clf_flex_imu.predict(X_test[flex_imu_cols]))

    print(f"  Ablation (Flex Only):        Accuracy = {acc_flex * 100:.2f}%")
    print(f"  Ablation (Flex + IMU):       Accuracy = {acc_flex_imu * 100:.2f}%")
    print(f"  Multimodal (Flex+IMU+EMG+FSR): Accuracy = {full_acc * 100:.2f}%")

    # 3. Feature Importance Analysis
    importances = clf.feature_importances_
    feat_imp = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    top_10_features = [{"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_imp[:10]]

    print("\nTop 5 Most Informative Features:")
    for f, imp in feat_imp[:5]:
        print(f"  - {f}: {imp * 100:.2f}%")

    # 4. Save Model Artifacts
    print("\n[4/4] Exporting model artifact & evaluation metrics...")
    model_payload = {
        "model": clf,
        "classes": config.MODEL_CLASSES,
        "feature_names": FEATURE_NAMES,
        "feature_importances": {f: round(float(imp), 4) for f, imp in feat_imp}
    }
    joblib.dump(model_payload, config.MODEL_PATH)
    print(f"  Saved trained model to {config.MODEL_PATH}")

    eval_results = {
        "accuracy": round(float(full_acc), 4),
        "macro_f1": round(float(full_macro_f1), 4),
        "classes": config.MODEL_CLASSES,
        "confusion_matrix": conf_mat.tolist(),
        "classification_report": report_dict,
        "sensor_ablation": {
            "flex_only_accuracy": round(float(acc_flex), 4),
            "flex_imu_accuracy": round(float(acc_flex_imu), 4),
            "multimodal_accuracy": round(float(full_acc), 4)
        },
        "top_features": top_10_features
    }

    eval_path = config.MODELS_DIR / "evaluation_report.json"
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)
    print(f"  Saved evaluation report to {eval_path}")
    print("\nModel training and evaluation successfully completed.")

if __name__ == "__main__":
    train_and_evaluate()
