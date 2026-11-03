"""Versioned reference movements and transparent sensor-to-reference matching.

These are engineering movement-match scores, not clinical assessments. Thumb
opposition is explicitly a bend-pattern proxy until contact sensing is available.
"""
import math

PROTOCOL_VERSION = 'paced-reach-return-v4'
FINGERS = ('thumb', 'index', 'middle', 'ring', 'pinky')
EXERCISES = {
    'grasp_release': {'name':'Hand Opening & Closing', 'description':'Gently close your hand, then open and relax.', 'duration':10, 'video':'hand_open_close_right_10s.mp4', 'demo_video':'hand_open_close_right_10s.mp4', 'coverage':'Five flex sensors measure opening and closing. Grip pressure is not required for this movement.', 'steps':['Open and relax','Gently close and hold','Release and open']},
    'individual_fingers': {'name':'Individual Finger Movement', 'description':'Bend and straighten one finger at a time.', 'duration':12, 'coverage':'Five independent flex sensors', 'steps':['Thumb','Index finger','Middle finger','Ring finger','Little finger']},
    'thumb_opposition': {'name':'Thumb Opposition', 'description':'Move your thumb toward each fingertip.', 'duration':12, 'coverage':'Partial score: thumb bend pattern only. Fingertip contact and opposition position are not measured.', 'steps':['Toward index','Toward middle','Toward ring','Toward little finger']},
    'wrist_flexion': {'name':'Wrist Flexion & Extension', 'description':'Move your wrist up and down comfortably.', 'duration':12, 'coverage':'IMU wrist tilt relative to your resting position', 'steps':['Lift gently','Return to centre','Lower gently','Return to centre']},
    'grip_pressure': {'name':'Grip & Release Pressure', 'description':'Gently squeeze a soft object, then release your grip.', 'duration':12, 'coverage':'FSR grip pressure', 'steps':['Hold a soft object comfortably','Squeeze gently and hold briefly','Release the pressure and relax']},
    'forearm_rotation': {'name':'Forearm Rotation', 'description':'Turn your palm upward, then downward.', 'duration':12, 'coverage':'IMU forearm rotation relative to your resting position', 'steps':['Turn one way','Return to centre','Turn the other way','Return to centre']},
}

def reference_target(exercise, elapsed):
    t = elapsed % 12.0
    flex = {f:0.0 for f in FINGERS}
    pressure = pitch = roll = 0.0
    if exercise == 'grasp_release':
        # Open hold, gradual close, closed hold, gradual release, open hold.
        amount = 0 if t < 2 else min(1, (t-2)/2) if t < 4 else 1 if t < 7 else max(0, 1-(t-7)/2)
        flex = {f:70*amount for f in FINGERS};pressure = 35*amount
        step = 'Open and relax' if t < 2 or t >= 9 else 'Gently close and hold' if t < 7 else 'Release and open'
    elif exercise == 'grip_pressure':
        pressure = 35*math.sin(math.pi*t/12)**2
        step = 'Squeeze gently, then release the pressure.'
    elif exercise == 'individual_fingers':
        index = min(4,int(t/2.4)); phase = (t%2.4)/2.4
        flex[FINGERS[index]] = 65*math.sin(math.pi*phase)**2
        step = f'Bend and relax your {EXERCISES[exercise]["steps"][index].lower()}'
    elif exercise == 'thumb_opposition':
        index = min(3,int(t/3));phase = (t%3)/3
        flex['thumb'] = 60*math.sin(math.pi*phase)**2
        step = EXERCISES[exercise]['steps'][index]
    else:
        angle = 30*math.sin(t*math.pi/6)
        if exercise == 'wrist_flexion':pitch = angle
        else:roll = angle*1.5
        step = EXERCISES[exercise]['steps'][min(3,int(t/3))]
    return {'flex':flex, 'pressure':pressure, 'pitch':pitch, 'roll':roll, 'step':step}

def imu_angles(imu):
    def finite(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
    if finite(imu.get('pitch')) and finite(imu.get('roll')):
        return float(imu['pitch']),float(imu['roll'])
    if not all(finite(imu.get(key)) for key in ('acc_x','acc_y','acc_z')):return None
    x,y,z = (imu[key] for key in ('acc_x','acc_y','acc_z'))
    if x*x+y*y+z*z < .01:return None
    return math.degrees(math.atan2(y, math.sqrt(x*x+z*z))), math.degrees(math.atan2(x,z))

def match_score(exercise, processed, target, neutral=(0,0)):
    """Return a 0–100 match, or None when a required sensor channel is missing."""
    def valid(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
    def closeness(actual,desired,span):return max(0.0,1.0-abs(actual-desired)/span)
    if exercise == 'grip_pressure':
        pressure = processed.get('fsr',{}).get('pressure_pct')
        return 100*closeness(pressure,target['pressure'],35) if valid(pressure) and 0 <= pressure <= 100 else None
    flex = processed.get('flex',{})
    if exercise in ('wrist_flexion','forearm_rotation'):
        angles = imu_angles(processed.get('imu',{}))
        if angles is None:return None
        index = 0 if exercise == 'wrist_flexion' else 1
        measured = (angles[index]-neutral[index]+180)%360-180
        return 100*closeness(measured,target['pitch' if index==0 else 'roll'],45 if index==0 else 65)
    required = ('thumb',) if exercise == 'thumb_opposition' else FINGERS
    if not all(valid(flex.get(f)) and 0 <= flex[f] <= 100 for f in required):return None
    score = sum(closeness(flex[f],target['flex'][f],70) for f in required)/len(required)
    return round(score*100,2)

def required_channels_present(exercise, sensors):
    def valid(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
    if exercise in ('wrist_flexion','forearm_rotation'):
        return imu_angles(sensors.get('imu',{})) is not None
    if exercise == 'grip_pressure':
        pressure = sensors.get('fsr',{}).get('pressure_pct',sensors.get('fsr',{}).get('pressure'))
        return valid(pressure)
    fingers = ('thumb',) if exercise == 'thumb_opposition' else FINGERS
    if not all(valid(sensors.get('flex',{}).get(f)) for f in fingers):return False
    return True
