"""Guided practice endpoints; scores are computed by the server, never posted by the UI."""
import time
from datetime import datetime, timezone, timedelta
from flask import request, jsonify
from engine.guided_exercises import EXERCISES, PROTOCOL_VERSION, required_channels_present

def register_guided_routes(app, pipeline, db):
    @app.get('/api/guided/status')
    def guided_status():return jsonify(pipeline.guided.snapshot())

    @app.get('/api/guided/exercises')
    def guided_catalog():
        with db.get_connection() as conn:
            rows = conn.execute("""SELECT exercise_key, MAX(ended_at) AS last_practised_at
                FROM guided_sessions WHERE user_id=1 AND active_seconds>0
                AND ended_at IS NOT NULL AND status NOT IN ('active','paused')
                GROUP BY exercise_key""").fetchall()
        activity = {row['exercise_key']:row['last_practised_at'] for row in rows}
        return jsonify({'protocol':PROTOCOL_VERSION,'exercises':[{'id':key,**value,'last_practised_at':activity.get(key)} for key,value in EXERCISES.items()]})

    @app.post('/api/guided/start')
    def guided_start():
        data = request.get_json(silent=True) or {}
        state = pipeline.latest_state
        if not isinstance(data.get('exercise'),str) or data['exercise'] not in EXERCISES:return jsonify({'error':'Choose one of the six exercises.'}),400
        if not state.get('received_at') or time.time()-state['received_at'] > 2.5 or state.get('data_source') != pipeline.data_source:
            return jsonify({'error':'Waiting for fresh sensor readings. Connect your glove or select simulated data.'}),409
        if pipeline.data_source == 'serial' and not pipeline.serial_receiver.is_connected:return jsonify({'error':'The USB glove is disconnected.'}),409
        if pipeline.data_source == 'mqtt' and not pipeline.mqtt_receiver.is_connected:
            return jsonify({'error':'The glove is disconnected.'}),409
        if not required_channels_present(data['exercise'],state.get('raw_sensors',{})):
            return jsonify({'error':'Waiting for all sensors needed by this exercise.'}),409
        offset = data.get('utc_offset_minutes',330)
        if not isinstance(offset,int) or isinstance(offset,bool) or not -840 <= offset <= 840:return jsonify({'error':'Invalid timezone offset.'}),400
        try:return jsonify(pipeline.guided.start(data.get('exercise'),pipeline.data_source,db.get_calibration(1),state.get('processed',{}),offset))
        except ValueError as error:return jsonify({'error':str(error)}),409

    @app.post('/api/guided/pause')
    def guided_pause():
        data = request.get_json(silent=True) or {}
        if type(data.get('paused')) is not bool:return jsonify({'error':'Specify paused as true or false.'}),400
        try:return jsonify(pipeline.guided.pause(data.get('session_id'),data['paused']))
        except ValueError as error:return jsonify({'error':str(error)}),409

    @app.post('/api/guided/finish')
    def guided_finish():
        data = request.get_json(silent=True) or {}
        try:return jsonify(pipeline.guided.finish(data.get('session_id')))
        except ValueError as error:return jsonify({'error':str(error)}),409

    @app.post('/api/guided/heartbeat')
    def guided_heartbeat():
        data = request.get_json(silent=True) or {}
        try:return jsonify(pipeline.guided.heartbeat(data.get('session_id')))
        except ValueError as error:return jsonify({'error':str(error)}),409

    @app.get('/api/guided/history')
    def guided_history():
        exercise = request.args.get('exercise','grasp_release');source = request.args.get('source') or pipeline.data_source
        if exercise not in EXERCISES or source not in ('simulate','mqtt','serial'):return jsonify({'error':'Invalid exercise or source.'}),400
        try:offset = int(request.args.get('utc_offset_minutes','330'))
        except ValueError:return jsonify({'error':'Invalid timezone offset.'}),400
        if not -840 <= offset <= 840:return jsonify({'error':'Invalid timezone offset.'}),400
        since = (datetime.now(timezone.utc)+timedelta(minutes=offset)-timedelta(days=29)).date().isoformat()
        params = (exercise,source,PROTOCOL_VERSION)
        with db.get_connection() as conn:
            daily = conn.execute("""SELECT local_day AS day, COUNT(*) AS sessions,
                ROUND(SUM(weighted_score_sum)/SUM(attempt_count),1) AS average_pct,
                ROUND(SUM(scored_seconds),1) AS scored_seconds
                FROM guided_sessions WHERE user_id=1 AND exercise_key=? AND data_source=? AND protocol_version=?
                AND status='completed' AND attempt_count>0 AND average_pct IS NOT NULL
                AND local_day>=? GROUP BY local_day ORDER BY local_day""",(*params,since)).fetchall()
            recent = conn.execute("""SELECT id,local_day,started_at,ended_at,average_pct,active_seconds,scored_seconds,status
                FROM guided_sessions WHERE user_id=1 AND exercise_key=? AND data_source=? AND protocol_version=?
                AND status NOT IN ('active','paused') ORDER BY id DESC LIMIT 8""",params).fetchall()
        return jsonify({'exercise':exercise,'source':source,'protocol':PROTOCOL_VERSION,'daily':[dict(row) for row in daily],'recent':[dict(row) for row in recent],
                        'aggregation':'Attempt-weighted target achievement across reach-and-return movements. Days without attempts are omitted.'})
