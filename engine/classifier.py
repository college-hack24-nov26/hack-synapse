"""
NeuroGlove Movement Classifier
Loads the trained Random Forest model and provides real-time movement prediction,
probability confidence scores, and feature explanation breakdowns.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

import config
from engine.feature_extractor import FEATURE_NAMES

logger = logging.getLogger("NeuroGlove.Classifier")

class MovementClassifier:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or config.MODEL_PATH
        self.model = None
        self.classes = config.MODEL_CLASSES
        self.feature_names = FEATURE_NAMES
        self.feature_importances = {}
        self.load_model()

    def load_model(self):
        """Loads the pre-trained joblib model artifact."""
        if not self.model_path.exists():
            logger.warning(f"Model file not found at {self.model_path}. Train model first using ml/train_model.py.")
            return

        try:
            payload = joblib.load(self.model_path)
            self.model = payload["model"]
            # Single-frame inference should not spawn worker pools at sensor frequency.
            self.model.n_jobs = 1
            self.classes = payload.get("classes", config.MODEL_CLASSES)
            self.feature_names = payload.get("feature_names", FEATURE_NAMES)
            self.feature_importances = payload.get("feature_importances", {})
            logger.info(f"Loaded Random Forest model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")

    def predict(self, feature_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs inference on extracted window features.
        Returns:
            dict containing predicted class, confidence, probabilities, and top explanation features.
        """
        if self.model is None:
            # Fallback heuristic if model not loaded
            mean_bend = feature_dict.get("hand_bend_mean", 0.0)
            fsr_mean = feature_dict.get("fsr_pressure_mean", 0.0)
            if fsr_mean > 30.0 and mean_bend > 50.0:
                pred = "GRASP"
            elif mean_bend > 60.0:
                pred = "CLOSE"
            elif mean_bend < 15.0:
                pred = "OPEN"
            else:
                pred = "REST"
            return {
                "class": pred,
                "confidence": 0.85,
                "probabilities": {c: (0.85 if c == pred else 0.05) for c in self.classes},
                "top_features": []
            }

        # Construct feature vector DataFrame with matching column names
        vector = [feature_dict.get(name, 0.0) for name in self.feature_names]
        X = pd.DataFrame([vector], columns=self.feature_names)

        probs = self.model.predict_proba(X)[0]
        max_idx = int(np.argmax(probs))
        pred_class = str(self.classes[max_idx])
        confidence = float(probs[max_idx])

        prob_dict = {str(self.classes[i]): round(float(probs[i]), 3) for i in range(len(self.classes))}

        # Explainability: top 5 contributing features based on Gini importance
        top_features = []
        if self.feature_importances:
            sorted_feats = sorted(self.feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]
            for f_name, imp in sorted_feats:
                top_features.append({
                    "name": f_name,
                    "importance": imp,
                    "value": round(float(feature_dict.get(f_name, 0.0)), 2)
                })

        return {
            "class": pred_class,
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "top_features": top_features
        }
