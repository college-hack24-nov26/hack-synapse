"""Visual EMG surrogate from kinematics, not a measurement of muscle activity."""
import math


class EMGEstimator:
    def __init__(self):
        self.previous_flex = None
        self.previous_time = None
        self.envelope = 4.0

    def update(self, processed):
        timestamp = processed['timestamp']
        flex = processed['flex']
        dt = timestamp-self.previous_time if self.previous_time is not None else .1
        continuous = self.previous_time is not None and 0 < dt < .8
        dt = max(.02, min(.3, dt))
        if not continuous:
            self.envelope = 4.0
        speed = sum(abs(value-self.previous_flex.get(finger,value)) for finger,value in flex.items()) / max(1,len(flex)) / dt if continuous else 0.0
        # Ignore small ADC jitter. Moving fingers produce a short activation
        # burst; pressure produces sustained activity; wrist motion adds less.
        motion = min(1.0,max(0.0,speed-8.0)/140.0)
        pressure = min(1.0,max(0.0,processed['fsr']['pressure_pct'])/100.0)
        wrist = min(1.0,max(0.0,processed['imu']['gyro_energy']-5.0)/100.0)
        bend = sum(flex.values()) / max(1,len(flex)) / 100.0
        target = 4.0 + 48.0*motion + 32.0*pressure + 12.0*wrist + 7.0*bend
        tau = .12 if target > self.envelope else .55
        self.envelope += (1.0-math.exp(-dt/tau))*(target-self.envelope)
        ripple = (.25+self.envelope*.008)*(math.sin(timestamp*13.1)+.4*math.sin(timestamp*23.7))
        value = round(max(0.0,min(100.0,self.envelope+ripple)),1)
        self.previous_flex = dict(flex)
        self.previous_time = timestamp
        return {'raw':None, 'envelope':value, 'available':False,
                'estimated':True, 'source':'kinematic_estimate', 'units':'a.u.',
                'case':'grip' if pressure>.15 else 'finger_movement' if motion>.1 else 'wrist_movement' if wrist>.1 else 'hold' if bend>.25 else 'rest'}
