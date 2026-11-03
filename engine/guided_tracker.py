"""Server-owned guided-session timing, scores, provenance and SQLite persistence."""
import json
import threading
import time
from datetime import datetime, timezone, timedelta
from engine.guided_exercises import EXERCISES, PROTOCOL_VERSION, imu_angles, required_channels_present
from engine.paced_movement import PacedMovement, TARGETS

class GuidedTracker:
    def __init__(self, database):
        self.db = database
        self.lock = threading.RLock()
        self.active = None
        self.last_result = None

    def recover_interrupted(self):
        with self.db.get_connection() as conn:
            conn.execute("UPDATE guided_sessions SET status='interrupted' WHERE status IN ('active','paused')")
            conn.commit()

    def start(self, exercise, source, calibration, processed, offset=330):
        with self.lock:
            if self.active:raise ValueError('Finish the current session before starting another.')
            if exercise not in EXERCISES:raise ValueError('Choose one of the six guided exercises.')
            now = datetime.now(timezone.utc)
            neutral = imu_angles(processed.get('imu',{})) or (0,0)
            protocol={'individual_fingers':'individual-fingers-round-v1','grip_pressure':'grip-pressure-tolerant-v1'}.get(exercise,PROTOCOL_VERSION)
            with self.db.get_connection() as conn:
                cursor = conn.execute('INSERT INTO guided_sessions (user_id,exercise_key,data_source,protocol_version,started_at,utc_offset_minutes,calibration_json,status) VALUES (1,?,?,?,?,?,?,?)',
                    (exercise,source,protocol,now.isoformat(),offset,json.dumps({'sensors':calibration,'imu_neutral_degrees':neutral,'protocol':protocol,'targets':TARGETS}),'active'))
                conn.commit();session_id = cursor.lastrowid
            self.active = {'id':session_id,'exercise':exercise,'source':source,'offset':offset,'status':'active',
                           'elapsed':0.0,'scored':0.0,'weighted':0.0,'samples':0,'score':None,'last_at':None,
                           'neutral':neutral,'signal_ready':False,'last_client_at':time.monotonic(),'movement':PacedMovement(exercise,neutral)}
            self.last_result = None
            return self.snapshot()

    def update(self, processed, source, now=None, raw_sensors=None):
        with self.lock:
            s = self.active
            if not s:return
            if source != s['source']:
                self.finish(s['id'],reason='source_changed');return
            if s['status'] != 'active':return
            now = time.monotonic() if now is None else now
            if now-s['last_client_at'] > 15:
                s['status'] = 'paused';s['last_at'] = None;return
            previous = s['last_at'];s['last_at'] = now
            # A gap suspends scoring and the demonstration clock; never score cached input.
            dt = 0 if previous is None or now-previous > .3 else max(0,now-previous)
            movement=s['movement']
            if previous is not None and now-previous>.3:movement.reset_attempt()
            valid=raw_sensors is None or required_channels_present(s['exercise'],raw_sensors)
            s['signal_ready']=valid and movement.update(processed,dt)
            if not s['signal_ready']:movement.reset_attempt();s['score']=None;return
            s['score']=movement.current
            s['elapsed'] += dt;s['scored'] += dt
            s['weighted']=movement.total_score
            if dt > 0:s['samples'] += 1

    def pause(self, session_id, paused):
        with self.lock:
            s = self.active
            if not s or s['id'] != session_id:raise ValueError('This session is no longer active.')
            s['status'] = 'paused' if paused else 'active';s['last_at'] = None
            s['movement'].reset_attempt()
            s['last_client_at'] = time.monotonic()
            return self.snapshot()

    def heartbeat(self, session_id):
        with self.lock:
            if not self.active or self.active['id'] != session_id:raise ValueError('This session is no longer active.')
            self.active['last_client_at'] = time.monotonic()
            return {'success':True}

    def finish(self, session_id, reason='completed'):
        with self.lock:
            if not self.active:
                if self.last_result and self.last_result['id'] == session_id:return self.last_result
                raise ValueError('This session is no longer active.')
            s = self.active
            if s['id'] != session_id:raise ValueError('This session is no longer active.')
            ended = datetime.now(timezone.utc)
            movement=s['movement'];average=movement.average
            day = (ended+timedelta(minutes=s['offset'])).date().isoformat()
            result = {'id':s['id'],'exercise':s['exercise'],'source':s['source'],'average_pct':average,
                      'active_seconds':round(s['elapsed'],2),'scored_seconds':round(s['scored'],2),'samples':s['samples'],
                      'status':reason,'local_day':day,'cycles':movement.completed,'attempts':movement.attempts,
                      'coverage':EXERCISES[s['exercise']]['coverage']}
            with self.db.get_connection() as conn:
                conn.execute('UPDATE guided_sessions SET ended_at=?,local_day=?,active_seconds=?,scored_seconds=?,weighted_score_sum=?,average_pct=?,sample_count=?,status=?,attempt_count=?,completed_movements=? WHERE id=?',
                    (ended.isoformat(),day,s['elapsed'],s['scored'],movement.total_score,average,s['samples'],reason,movement.attempts,movement.completed,s['id']))
                conn.commit()
            self.last_result = result;self.active = None
            return result

    def snapshot(self):
        with self.lock:
            if not self.active:return {'active':False,'last_result':self.last_result}
            s = self.active
            ready = s['signal_ready'] and s['last_at'] is not None and time.monotonic()-s['last_at'] < .5
            return {'active':True,'id':s['id'],'exercise':s['exercise'],'source':s['source'],'status':s['status'],
                    'elapsed':round(s['elapsed'],2),'cycles':s['movement'].completed,'attempts':s['movement'].attempts,
                    'current_pct':s['score'] if ready else None,'average_pct':s['movement'].average,
                    'signal_ready':ready,'step':s['movement'].instruction,'coverage':EXERCISES[s['exercise']]['coverage']}
