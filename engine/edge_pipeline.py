"""
NeuroGlove Edge Pipeline Orchestrator
Master coordinator executing the real-time processing loop:
Ingestion -> Preprocessing -> Feature Extraction -> Random Forest Classification ->
Sensor Fusion (Active Attempt) -> Repetition Counter -> Persistence & Real-time State.
"""

import time
import queue
import threading
import logging
from typing import Dict, Any, Optional

import config
from database.db_manager import db
from engine.simulator import SensorSimulator
from engine.mqtt_client import MQTTReceiver
from engine.serial_client import SerialReceiver
from engine.preprocessor import SensorPreprocessor
from engine.feature_extractor import FeatureExtractor
from engine.classifier import MovementClassifier
from engine.fusion_engine import SensorFusionEngine
from engine.repetition_counter import RepetitionCounter
from engine.guided_tracker import GuidedTracker

logger = logging.getLogger("NeuroGlove.Pipeline")

class EdgePipeline:
    def __init__(self, data_source: str = config.DEFAULT_DATA_SOURCE):
        self.data_source = data_source  # "simulate" or "mqtt"
        self._source_lock = threading.RLock()
        self.state_changed = threading.Condition()
        self._source_generation = 0
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        
        # Ingestion queue
        self.raw_queue: queue.Queue = queue.Queue(maxsize=1)
        
        # Modules
        self.simulator = SensorSimulator(sample_rate_hz=config.SAMPLING_RATE_HZ)
        self.mqtt_receiver = MQTTReceiver(data_queue=self.raw_queue)
        self.serial_receiver = SerialReceiver(self.raw_queue,config.SERIAL_PORT,config.SERIAL_BAUD)
        
        # Load user 1 calibration from db
        calib = db.get_calibration(user_id=1)
        self.preprocessor = SensorPreprocessor(calibration_profile=calib)
        self.feature_extractor = FeatureExtractor(window_size=config.WINDOW_SIZE_SAMPLES)
        self.classifier = MovementClassifier()
        self.fusion_engine = SensorFusionEngine(calibration_profile=calib)
        self.rep_counter = RepetitionCounter()
        self.guided = GuidedTracker(db)

        # Session State
        self.active_session_id: Optional[int] = None
        self.current_exercise = "Hand Flexion/Extension"
        self.session_start_time = None
        
        # Real-time state cache for Web UI
        self.latest_state = {
            "timestamp": time.time(),
            "received_at": None,
            "data_source": self.data_source,
            "mqtt_connected": False,
            "session_active": False,
            "session_id": None,
            "exercise": self.current_exercise,
            "raw_sensors": {},
            "processed": {
                "flex": {"thumb": 0, "index": 0, "middle": 0, "ring": 0, "pinky": 0},
                "mean_bend_pct": 0.0,
                "imu": {"acc_mag": 1.0, "dyn_acc": 0.0, "gyro_energy": 0.0},
                "emg": {"raw": 1900, "envelope": 20.0},
                "fsr": {"pressure_pct": 0.0}
            },
            "classification": {
                "class": "REST",
                "confidence": 0.95,
                "probabilities": {"REST": 0.95, "OPEN": 0.02, "CLOSE": 0.02, "GRASP": 0.01},
                "top_features": []
            },
            "attempt": {
                "status": "REST",
                "code": "REST_STATE",
                "explanation": "Neutral baseline"
            },
            "repetitions": {
                "count": 0,
                "state": "IDLE",
                "avg_duration": 0.0,
                "avg_rom": 0.0,
                "avg_consistency": 0.0
            },
            "target_pose": {
                "pose": "OPEN",
                "matched": False
            },
            "anomalies": []
        }

    def start(self):
        """Starts the pipeline thread."""
        if self.is_running:
            return
        self.guided.recover_interrupted()
        self.is_running = True
        
        if self.data_source == "mqtt":
            self.mqtt_receiver.start()
        elif self.data_source == "serial":
            self.serial_receiver.start()
            
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"NeuroGlove Edge Pipeline started in [{self.data_source}] mode.")

    def stop(self):
        self.is_running = False
        if self.mqtt_receiver:
            self.mqtt_receiver.stop()
        if getattr(self,"serial_receiver",None):self.serial_receiver.stop()
        if self.thread:
            self.thread.join(timeout=2.0)
        logger.info("NeuroGlove Edge Pipeline stopped.")

    def set_source(self, source: str):
        """Switch between 'simulate' and 'mqtt' data sources."""
        if source not in ("simulate","mqtt","serial"):raise ValueError("Invalid sensor source")
        with self._source_lock:
            if source == self.data_source:
                return
            if getattr(self, 'guided', None) and self.guided.active:
                self.guided.finish(self.guided.active['id'], reason='source_changed')
            self.data_source = source
            self._source_generation += 1
            # A source change cannot relabel a cached simulator frame as glove data.
            self.latest_state = {**self.latest_state, "data_source": source, "received_at": None,
                                 "processed": {}, "raw_sensors": {}, "classification": {}, "attempt": {}}
            if getattr(self,"serial_receiver",None):self.serial_receiver.stop()
            if source == "serial":self.serial_receiver.start()
            if getattr(self,"raw_queue",None):
                while True:
                    try:self.raw_queue.get_nowait()
                    except queue.Empty:break
            if source == "mqtt":
                self.mqtt_receiver.start()
            else:
                self.mqtt_receiver.stop()
            logger.info(f"Switched data source to {source}")

    def set_sim_mode(self, mode: str, manual_state: str = "REST"):
        self.simulator.set_mode(mode, manual_state)

    def set_exercise(self, exercise_name: str):
        """Sets the exercise target and repetition tracking, without driving sensor input."""
        self.current_exercise = exercise_name
        self.rep_counter.set_exercise(exercise_name)
        logger.info(f"Pipeline active exercise set to '{exercise_name}'")

    def reset_reps(self):
        """Resets the repetition counter and active repetition state for the current session."""
        self.rep_counter.reset()
        if "repetitions" in self.latest_state:
            self.latest_state["repetitions"]["count"] = 0
            self.latest_state["repetitions"]["phase"] = "REST"
            self.latest_state["repetitions"]["avg_consistency"] = 100.0
        logger.info("Pipeline repetition counter reset to 0.")

    def start_session(self, exercise_name: str, user_id: int = 1, notes: str = "") -> int:
        """Starts a rehabilitation session in the database."""
        self.set_exercise(exercise_name)
        session_id = db.start_session(user_id=user_id, exercise_name=exercise_name, notes=notes)
        self.active_session_id = session_id
        self.session_start_time = time.time()
        logger.info(f"Started rehabilitation session #{session_id} for '{exercise_name}'")
        return session_id

    def stop_session(self, notes: str = "") -> Optional[Dict[str, Any]]:
        """Completes and saves the active session."""
        if not self.active_session_id:
            return None
        
        metrics = self.rep_counter.get_summary_metrics()
        db.end_session(
            session_id=self.active_session_id,
            total_reps=metrics["total_reps"],
            avg_dur=metrics["avg_duration"],
            avg_rom=metrics["avg_rom"],
            consistency=metrics["avg_consistency"],
            active_attempts=metrics["active_attempts"],
            passive=metrics["passive_movements"],
            attempt_no_motion=metrics["attempt_no_motion"],
            uncertain=metrics["uncertain"],
            notes=notes
        )
        saved_id = self.active_session_id
        self.active_session_id = None
        self.session_start_time = None
        logger.info(f"Saved session #{saved_id} with {metrics['total_reps']} completed reps.")
        return db.get_session(saved_id)

    def _determine_target_pose(self) -> Dict[str, Any]:
        """Provides dynamic target posture prompts for interactive rehabilitation training."""
        if "Flexion" in self.current_exercise or "Open" in self.current_exercise:
            # Alternates target between CLOSE and OPEN
            if self.rep_counter.state in ("IDLE", "RETURNING"):
                target = "CLOSE"
            else:
                target = "OPEN"
        elif "Grasp" in self.current_exercise:
            target = "GRASP"
        else:
            target = "OPEN"
        
        current_pred = self.latest_state.get("classification", {}).get("class", "UNKNOWN")
        matched = (current_pred == target)
        return {"pose": target, "matched": matched}

    def _publish_state(self, state, source, generation):
        """Never publish a frame that was processed before a source switch."""
        with self._source_lock:
            if source != self.data_source or generation != self._source_generation:
                return False
            self.latest_state = state
            condition = getattr(self, 'state_changed', None)
            if condition is not None:
                with condition:
                    condition.notify_all()
            return True

    def _run_loop(self):
        """Core real-time processing loop running at ~50 Hz."""
        while self.is_running:
            t_cycle_start = time.time()
            raw_frame = None
            with self._source_lock:
                sample_source = self.data_source
                sample_generation = self._source_generation

            # 1. Acquire raw sample
            if sample_source in ("mqtt","serial"):
                try:
                    raw_frame = self.raw_queue.get(timeout=0.04)
                except queue.Empty:
                    # No MQTT message received in 40ms, continue loop
                    time.sleep(0.01)
                    continue
            else:
                raw_frame = self.simulator.generate_sample()

            if sample_source != self.data_source or not isinstance(raw_frame, dict) or not isinstance(raw_frame.get("sensors"), dict):
                continue
            if sample_source=="serial" and (raw_frame.get('_source')!='serial' or time.time()-raw_frame.get('received_at',0)>.5):continue
            raw_flex = raw_frame["sensors"].get("flex", {})
            if not isinstance(raw_flex, dict) or not any(
                isinstance(raw_flex.get(finger), (int, float)) for finger in ("thumb", "index", "middle", "ring", "pinky")
            ):
                continue
            received_at = raw_frame.get("received_at",time.time())
            # Do not carry simulator filter history into the live glove stream.
            if getattr(self, "_filter_source", None) != sample_source:
                self.preprocessor = SensorPreprocessor(calibration_profile=config.DEFAULT_CALIBRATION if sample_source=="simulate" else db.get_calibration(1))
                self.feature_extractor = FeatureExtractor(window_size=config.WINDOW_SIZE_SAMPLES)
                self._filter_source = sample_source

            # 2. Preprocess & Calibrate
            processed, anomalies = self.preprocessor.process_frame(raw_frame)
            if getattr(self, 'guided', None):self.guided.update(processed, sample_source, raw_sensors=raw_frame['sensors'])
            self.feature_extractor.add_frame(processed)

            # 3. Machine Learning Classification & Sensor Fusion
            sensor_only_hardware = sample_source in ("serial", "mqtt") and processed.get('emg', {}).get('available') is False
            # This glove uses flex/pressure rules without EMG. Building the full
            # multimodal window here would delay the mirror without being used.
            features = None if sensor_only_hardware else self.feature_extractor.extract_features()
            classification = self.latest_state["classification"] or {"class": "UNKNOWN", "confidence": 0.0, "probabilities": {}, "top_features": []}
            attempt_info = self.latest_state["attempt"] or {"status": "REST"}

            if sensor_only_hardware:
                bend=processed['mean_bend_pct'];pressure=processed['fsr']['pressure_pct']
                pose='GRASP' if pressure>=15 and bend>=20 else 'CLOSE' if bend>=65 else 'OPEN' if bend<=18 else 'REST'
                classification={'class':pose,'confidence':None,'method':'sensor_rules','probabilities':{},'top_features':[]}
                attempt_info={'status':'EMG_UNAVAILABLE','code':'EMG_UNAVAILABLE','is_active_attempt':False,
                              'explanation':'Flex, pressure and wrist movement only. Muscle activation is not measured.'}
            elif features:
                classification = self.classifier.predict(features)
                attempt_info = self.fusion_engine.evaluate_attempt(features, classification["class"])

            # 4. Repetition Counting State Machine
            completed_rep = self.rep_counter.update(processed, attempt_info, classification["class"])
            if completed_rep and self.active_session_id:
                db.log_repetition(
                    session_id=self.active_session_id,
                    rep_number=completed_rep["rep_number"],
                    duration_sec=completed_rep["duration_sec"],
                    peak_rom=completed_rep["peak_rom"],
                    movement_class=completed_rep["movement_class"],
                    attempt_status=completed_rep["attempt_status"],
                    consistency_score=completed_rep["consistency_score"]
                )
                logger.info(f"Session #{self.active_session_id} - Logged Rep #{completed_rep['rep_number']}: ROM={completed_rep['peak_rom']}%, Dur={completed_rep['duration_sec']}s")

            # 5. Mirror-Hand Target Matching
            target_pose = self._determine_target_pose()

            # 6. Update Real-Time Snapshot
            summary_metrics = self.rep_counter.get_summary_metrics()
            next_state = {
                "timestamp": processed["timestamp"],
                "received_at": received_at,
                "data_source": sample_source,
                "mqtt_connected": self.mqtt_receiver.is_connected,
                "serial_connected": getattr(getattr(self,"serial_receiver",None),"is_connected",False),
                "serial": self.serial_receiver.status() if getattr(self,"serial_receiver",None) else {},
                "session_active": (self.active_session_id is not None),
                "session_id": self.active_session_id,
                "exercise": self.current_exercise,
                "raw_sensors": raw_frame.get("sensors", {}),
                "processed": processed,
                "classification": classification,
                "attempt": attempt_info,
                "repetitions": {
                    "count": self.rep_counter.rep_count,
                    "state": self.rep_counter.state,
                    "current_rom": processed["mean_bend_pct"],
                    "avg_duration": summary_metrics["avg_duration"],
                    "avg_rom": summary_metrics["avg_rom"],
                    "avg_consistency": summary_metrics["avg_consistency"],
                    "active_attempts": summary_metrics["active_attempts"],
                    "passive_movements": summary_metrics["passive_movements"]
                },
                "target_pose": target_pose,
                "anomalies": anomalies
            }

            self._publish_state(next_state, sample_source, sample_generation)

            # Enforce sampling frequency
            elapsed = time.time() - t_cycle_start
            sleep_needed = max(0.001, config.SAMPLE_INTERVAL_SEC - elapsed)
            time.sleep(sleep_needed)

# Global Edge Pipeline instance
pipeline = EdgePipeline()
