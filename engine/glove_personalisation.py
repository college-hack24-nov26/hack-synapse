"""Validated finger endpoints and squeeze/release pressure calibration."""
import copy
import math
import secrets
import statistics
import threading
import time

FINGERS = ('thumb', 'index', 'middle', 'ring', 'pinky')


class PersonalisationError(Exception):
    def __init__(self, message, status=400, fingers=None):
        super().__init__(message)
        self.status = status
        self.fingers = fingers or []


class GlovePersonalisation:
    def __init__(self, pipeline, database, duration=3.0, minimum_samples=18,
                 clock=time.monotonic, wall_clock=time.time, sleep=time.sleep):
        self.pipeline, self.database = pipeline, database
        self.duration, self.minimum_samples = duration, minimum_samples
        self.clock, self.wall_clock, self.sleep = clock, wall_clock, sleep
        self.lock = threading.RLock()
        self.session = None

    def _frame(self, source=None):
        p = self.pipeline
        state = p.latest_state
        kind = state.get('data_source')
        receiver = p.mqtt_receiver if kind == 'mqtt' else p.serial_receiver
        age = self.wall_clock() - (state.get('received_at') or 0)
        if kind not in ('mqtt', 'serial') or kind != p.data_source or (source and kind != source):
            raise PersonalisationError('Connect your glove to personalise it. Simulated readings cannot be used.', 409)
        if not receiver.is_connected or not 0 <= age < 0.8:
            raise PersonalisationError('Glove readings paused. Check the connection and try again.', 409)
        flex = state.get('raw_sensors', {}).get('flex', {})
        if any(isinstance(flex.get(f), bool) or not isinstance(flex.get(f), (int, float))
               or not math.isfinite(flex[f]) or not 0 <= flex[f] <= 4095 for f in FINGERS):
            raise PersonalisationError('All five finger sensors need to be connected. Check your glove and try again.', 409)
        values={f:flex[f] for f in FINGERS}
        values['_fsr']=state.get('raw_sensors',{}).get('fsr',{}).get('pressure')
        return state['received_at'], values

    def start(self):
        with self.lock:
            if self.session and self.session.get('busy'):
                raise PersonalisationError('A reading is already being captured. Please wait.', 409)
            if self.pipeline.guided.active:
                raise PersonalisationError('Finish your guided exercise session before personalising the glove.', 409)
            self._frame()
            self.session = {'id': secrets.token_urlsafe(24), 'stage': 'open', 'busy': False,
                            'source': self.pipeline.data_source, 'created': self.clock(),
                            'original': copy.deepcopy(self.database.get_calibration(1))}
            return {'id': self.session['id'], 'stage': 'open', 'duration_seconds': self.duration}

    def _session(self, ident):
        if not self.session or self.session['id'] != ident or self.clock() - self.session['created'] > 600:
            raise PersonalisationError('This setup has ended. Start glove personalisation again.', 409)
        return self.session

    def cancel(self, ident):
        with self.lock:
            if self.session and self.session['id'] == ident:
                self.session = None
        return {'success': True}

    def capture(self, ident, pose):
        with self.lock:
            session = self._session(ident)
            if pose not in ('open', 'closed', 'rest', 'fsr', 'release') or session['stage'] != pose:
                raise PersonalisationError('Capture the open hand first, then the closed hand.', 409)
            if session['busy']:
                raise PersonalisationError('A reading is already being captured. Please wait.', 409)
            session['busy'] = True
        try:
            samples, seen = [], set()
            started = self.clock()
            while self.clock() - started < self.duration:
                with self.lock:
                    self._session(ident)
                stamp, flex = self._frame(session['source'])
                if pose in ('rest','fsr','release'):
                    pressure=flex.get('_fsr')
                    if isinstance(pressure,bool) or not isinstance(pressure,(int,float)) or not math.isfinite(pressure) or not 0<=pressure<=4095:
                        raise PersonalisationError('No valid pressure reading. Check the FSR connection and try again.',409)
                if stamp not in seen:
                    seen.add(stamp)
                    samples.append(flex)
                self.sleep(0.04)
            if len(samples) < self.minimum_samples:
                raise PersonalisationError('Not enough glove readings. Keep your hand still and try again.', 409)
            medians = {f: statistics.median(row[f] for row in samples) for f in FINGERS}
            deviations = {f: statistics.median(abs(row[f] - medians[f]) for row in samples) for f in FINGERS}
            def spread(key):
                values=sorted(row[key] for row in samples)
                return values[int((len(values)-1)*.9)]-values[int((len(values)-1)*.1)]
            def drift(key):
                count=max(1,len(samples)//3)
                return abs(statistics.median(row[key] for row in samples[:count])-statistics.median(row[key] for row in samples[-count:]))
            if pose in ('open','closed','rest'):
                # This glove can legitimately reach zero at full flexion. Accept
                # that closed endpoint only after a distinct open endpoint; the
                # later nonzero rest capture confirms the channel recovers.
                bad=[f for f in FINGERS if any((row[f]<=3 and pose!='closed') or row[f]>=4090 for row in samples)]
                if bad:raise PersonalisationError('A finger sensor is reading zero or saturated. Check its signal wire and glove position, then capture again.',fingers=bad)
                # Use robust medians rather than blocking patients for movement
                # during a capture. Endpoint separation remains checked below.
            with self.lock:
                self._session(ident)
                if pose == 'open':
                    session.update(stage='closed', opened=medians, open_noise=deviations)
                    return {'success': True, 'stage': 'closed', 'samples': len(samples)}
                if pose == 'closed':
                    bad = [f for f in FINGERS if abs(medians[f] - session['opened'][f]) <
                           20]
                    if bad:
                        raise PersonalisationError('Some finger readings are too similar or unsteady. Adjust the glove and capture your closed hand again.', fingers=bad)
                    session.update(stage='rest', closed=medians)
                    return {'success': True, 'stage': 'rest', 'samples': len(samples)}
                pressure=statistics.median(row['_fsr'] for row in samples)
                noise=statistics.median(abs(row['_fsr']-pressure) for row in samples)
                if self.database.get_calibration(1)!=session['original']:
                    raise PersonalisationError('Calibration changed during setup. Start personalisation again.',409)
                if pose=='rest':
                    outside=[f for f in FINGERS if not min(session['opened'][f],session['closed'][f])-10<=medians[f]<=max(session['opened'][f],session['closed'][f])+10]
                    if outside:raise PersonalisationError('The glove shifted since the first readings. Start again with the glove in a fixed position.',fingers=outside)
                    if noise>5 or spread('_fsr')>15 or drift('_fsr')>10:raise PersonalisationError('Release all pressure from the FSR and keep your hand still. Try again.')
                    session.update(stage='fsr',rested=medians,rest_noise=deviations,fsr_baseline=pressure,fsr_noise=noise)
                    return {'success':True,'stage':'fsr','samples':len(samples)}
                if pose=='fsr':
                    span=pressure-session['fsr_baseline']
                    if span<max(50,10*max(noise,session['fsr_noise'])):
                        raise PersonalisationError('No clear pressure increase. Place the ball directly over the FSR and hold a comfortable squeeze, then try again.')
                    if noise>max(5,span*.06) or spread('_fsr')>max(15,span*.2) or drift('_fsr')>max(10,span*.12):
                        raise PersonalisationError('Pressure changed during capture. Hold one comfortable squeeze steadily for the full reading and try again.')
                    if any(row['_fsr']>=4090 for row in samples):raise PersonalisationError('The pressure sensor is saturated. Ease your squeeze slightly and try again.')
                    session.update(stage='release',fsr_squeeze=pressure)
                    return {'success':True,'stage':'release','samples':len(samples)}
                span=session['fsr_squeeze']-session['fsr_baseline']
                if abs(pressure-session['fsr_baseline'])>max(12,span*.08) or spread('_fsr')>max(12,span*.05) or drift('_fsr')>max(8,span*.04):
                    raise PersonalisationError('Remove the ball and release all pressure. The sensor must return to its resting reading before calibration can be saved.')
                if self.pipeline.guided.active:
                    raise PersonalisationError('Finish your guided exercise session before saving personalisation.', 409)
                current = self.database.get_calibration(1)
                if current != session['original']:
                    raise PersonalisationError('Calibration changed during setup. Start personalisation again.', 409)
                flex = {f: {'min_adc': session['opened'][f], 'max_adc': session['closed'][f],
                            'rest_adc': session['rested'][f], 'rest_noise_adc': session['rest_noise'][f]} for f in FINGERS}
                self.database.save_calibration(1, flex, current['emg_baseline'], current['emg_active_threshold'],
                    statistics.median([session['fsr_baseline'],pressure]),session['fsr_baseline']+max(10,span*.1,session['fsr_noise']*4),session['fsr_squeeze'])
                saved = self.database.get_calibration(1)
                self.pipeline.preprocessor.update_calibration(saved)
                session['stage'] = 'done'
                return {'success': True, 'stage': 'done', 'samples': len(samples), 'calibration': saved}
        finally:
            with self.lock:
                session['busy'] = False
