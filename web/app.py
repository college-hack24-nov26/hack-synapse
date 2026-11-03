"""
NeuroGlove Flask Web Application
Provides real-time REST API, Server-Sent Events (SSE) streaming,
session management, calibration controls, and report generation endpoints.
"""

import os
import sys
import json
import time
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from flask import Flask, render_template, jsonify, request, Response, send_file
import config
from database.db_manager import db
from engine.edge_pipeline import pipeline
from reporting.pdf_generator import generate_pdf_report
from reporting.csv_exporter import export_session_reps_csv

app = Flask(
    __name__,
    template_folder=str(Path(__file__).parent / "templates"),
    static_folder=str(Path(__file__).parent / "static")
)

# Reflect saved template edits in the local dashboard without stale cached markup.
app.config["TEMPLATES_AUTO_RELOAD"] = True

from web.guided_api import register_guided_routes
register_guided_routes(app,pipeline,db)
from web.personalisation_api import register_personalisation_routes
register_personalisation_routes(app, pipeline, db)
from web.prediction_api import register_prediction_routes
register_prediction_routes(app, db)

@app.route("/")
def index():
    """Renders the main NeuroGlove real-time rehabilitation dashboard."""
    goals = db.get_goals(user_id=1)
    calib = db.get_calibration(user_id=1)
    eval_file = config.MODELS_DIR / "evaluation_report.json"
    eval_data = {}
    if eval_file.exists():
        try:
            with open(eval_file, "r", encoding="utf-8") as f:
                eval_data = json.load(f)
        except Exception:
            pass
            
    return render_template(
        "index.html",
        goals=goals,
        calibration=calib,
        eval_data=eval_data,
        data_source=pipeline.data_source
    )

@app.route("/api/status", methods=["GET"])
def get_status():
    """Returns the latest processed snapshot of the pipeline."""
    return jsonify(pipeline.latest_state)

@app.route("/api/stream")
def sse_stream():
    """Push a new sensor frame immediately, with a status heartbeat when idle."""
    def event_generator():
        previous = None
        while True:
            with pipeline.state_changed:
                pipeline.state_changed.wait_for(lambda: pipeline.latest_state is not previous, timeout=0.25)
                previous = pipeline.latest_state
            state = {**previous, "mqtt_connected": pipeline.mqtt_receiver.is_connected, "serial_connected":pipeline.serial_receiver.is_connected,"serial":pipeline.serial_receiver.status(),"guided":pipeline.guided.snapshot()}
            data_str = json.dumps(state)
            yield f"data: {data_str}\n\n"
            
    return Response(event_generator(), mimetype="text/event-stream", headers={"Cache-Control":"no-cache", "X-Accel-Buffering":"no"})

@app.route("/api/session/start", methods=["POST"])
def start_session():
    data = request.get_json() or {}
    exercise = data.get("exercise", "Hand Flexion/Extension")
    user_id = int(data.get("user_id", 1))
    notes = data.get("notes", "")
    session_id = pipeline.start_session(exercise_name=exercise, user_id=user_id, notes=notes)
    return jsonify({"success": True, "session_id": session_id})

@app.route("/api/session/stop", methods=["POST"])
def stop_session():
    data = request.get_json() or {}
    notes = data.get("notes", "")
    session_data = pipeline.stop_session(notes=notes)
    return jsonify({"success": True, "session": session_data})

@app.route("/api/session/reset", methods=["POST"])
def reset_session_reps():
    """Resets the repetition counter and active repetition count."""
    pipeline.reset_reps()
    return jsonify({"success": True, "reps": 0})

@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    sessions = db.get_all_sessions(limit=50)
    return jsonify({"sessions": sessions})

@app.route("/api/session/<int:session_id>", methods=["GET"])
def get_session_detail(session_id: int):
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(session)

@app.route("/api/session/<int:session_id>/report/pdf", methods=["GET"])
def download_pdf_report(session_id: int):
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    pdf_path = generate_pdf_report(session)
    return send_file(
        str(pdf_path),
        as_attachment=True,
        download_name=f"neuroglove_session_{session_id}.pdf",
        mimetype="application/pdf"
    )

@app.route("/api/session/<int:session_id>/report/csv", methods=["GET"])
def download_csv_report(session_id: int):
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    csv_str = export_session_reps_csv(session)
    return Response(
        csv_str,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=neuroglove_session_{session_id}.csv"}
    )

@app.route("/api/control/source", methods=["POST"])
def set_data_source():
    data = request.get_json() or {}
    source = data.get("source", "simulate")
    if source in ("simulate", "mqtt", "serial"):
        pipeline.set_source(source)
        return jsonify({"success": True, "data_source": pipeline.data_source})
    return jsonify({"error": "Invalid source"}), 400

@app.route("/api/control/sim_mode", methods=["POST"])
def set_sim_mode():
    data = request.get_json() or {}
    mode = data.get("mode", "AUTO_CYCLE")
    manual_state = data.get("state", "REST")
    pipeline.set_sim_mode(mode, manual_state)
    return jsonify({"success": True, "mode": mode, "state": manual_state})

@app.route("/api/control/exercise", methods=["POST"])
def set_exercise():
    data = request.get_json() or {}
    exercise = data.get("exercise", "Hand Flexion/Extension")
    pipeline.set_exercise(exercise)
    return jsonify({"success": True, "exercise": exercise})

@app.route("/exercise_videos/<path:filename>")
def serve_exercise_video(filename):
    video_dir = PROJECT_ROOT / "exercise_videos"
    video_path = video_dir / filename
    if video_path.exists():
        return send_file(str(video_path), mimetype="video/mp4")
    return jsonify({"error": "Video not found"}), 404

@app.route("/api/calibration", methods=["GET", "POST"])
def manage_calibration():
    if request.method == "POST":
        data = request.get_json() or {}
        user_id = int(data.get("user_id", 1))
        flex_calib = data.get("flex", config.DEFAULT_CALIBRATION["flex"])
        emg_base = float(data.get("emg_baseline", 20.0))
        emg_thresh = float(data.get("emg_active_threshold", 45.0))
        fsr_base = float(data.get("fsr_baseline", 100.0))
        fsr_thresh = float(data.get("fsr_contact_threshold", 350.0))
        
        fsr_max=float(data.get("fsr_max_raw",db.get_calibration(user_id).get("fsr_max_raw",1300)))
        if fsr_max<=fsr_base or fsr_max>4095:return jsonify({"error":"FSR maximum must exceed its baseline and be at most 4095."}),400
        db.save_calibration(user_id, flex_calib, emg_base, emg_thresh, fsr_base, fsr_thresh,fsr_max)
        if pipeline.guided.active:
            pipeline.guided.finish(pipeline.guided.active['id'],reason='calibration_changed')
        new_calib = db.get_calibration(user_id)
        pipeline.preprocessor.update_calibration(new_calib)
        pipeline.fusion_engine.update_thresholds(emg_base, emg_thresh)
        return jsonify({"success": True, "calibration": new_calib})
    
    calib = db.get_calibration(user_id=1)
    return jsonify(calib)

@app.route("/api/goals", methods=["GET", "POST"])
def manage_goals():
    if request.method == "POST":
        data = request.get_json() or {}
        goal_id = int(data.get("goal_id", 1))
        target_reps = int(data.get("target_reps", 15))
        target_rom = float(data.get("target_rom_pct", 75.0))
        target_freq = int(data.get("target_sessions_per_week", 3))
        db.update_goal(goal_id, target_reps, target_rom, target_freq)
        return jsonify({"success": True})
        
    goals = db.get_goals(user_id=1)
    return jsonify({"goals": goals})

if __name__ == "__main__":
    pipeline.start()
    try:
        app.run(host=config.WEB_HOST, port=config.WEB_PORT, debug=False, threaded=True)
    finally:
        pipeline.stop()
