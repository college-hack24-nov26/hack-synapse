"""Patient-paced reach-and-return attempts. No video clock or speed bonus."""
import math
from collections import deque
from engine.guided_exercises import FINGERS, imu_angles

TARGETS = {'grasp_flex_pct':70,'finger_flex_pct':65,'thumb_flex_pct':60,'wrist_degrees':30,'rotation_degrees':45,'grip_pressure_pct':35}

class PacedMovement:
    def __init__(self, exercise, neutral=(0,0)):
        self.exercise=exercise;self.neutral=neutral;self.index=0
        self.attempts=0;self.completed=0;self.total_score=0.0;self.current=0.0
        self.finger_round_scores=[]
        self.reset_attempt()

    def reset_attempt(self):
        self.phase='rest';self.rest_seconds=0.0;self.target_seconds=0.0;self.peak=0.0;self.reached=False
        self.grip_window=deque();self.grip_best_hold=0.0;self.grip_baseline_samples=[];self.grip_filtered=None

    def update_grip(self, processed, dt):
        measurement=self.measure(processed)
        if measurement is None:
            self.current=None;self.reset_attempt();return False
        pressure=measurement[0]*TARGETS['grip_pressure_pct']
        if not isinstance(dt,(int,float)) or not math.isfinite(dt) or dt<=0:return True
        if dt>.3:self.reset_attempt();return True
        alpha=1-math.exp(-dt/.08)
        self.grip_filtered=pressure if self.grip_filtered is None else self.grip_filtered+alpha*(pressure-self.grip_filtered)
        value=self.grip_filtered
        if self.phase=='rest':
            self.current=0.0
            if pressure<=7:
                self.rest_seconds+=dt;self.grip_baseline_samples.append((pressure,dt))
                if self.rest_seconds>=.4:
                    self.grip_baseline=sum(p*t for p,t in self.grip_baseline_samples)/self.rest_seconds
                    self.phase='ready'
            else:self.rest_seconds=0;self.grip_baseline_samples=[]
            return True
        baseline=getattr(self,'grip_baseline',0.0)
        target=TARGETS['grip_pressure_pct']
        excursion=max(0,value-baseline)
        # A comfortable pressure band, rather than one exact force. A stronger
        # squeeze reduces the match gently and never becomes a zero score.
        low,high=25.0,65.0
        quality=min(1.0,excursion/low) if excursion<=high else max(.75,1-.25*(excursion-high)/(100-high))
        self.current=round(quality*100,1)
        if self.phase=='ready':
            if pressure-baseline>=target*.25:
                self.phase='moving';self.rest_seconds=0
            else:return True
        self.grip_window.append((dt,quality))
        duration=sum(t for t,q in self.grip_window)
        while self.grip_window and duration-self.grip_window[0][0]>=.6:
            duration-=self.grip_window.popleft()[0]
        if duration>=.6:
            hold=sum(t*q for t,q in self.grip_window)/duration
            self.grip_best_hold=max(self.grip_best_hold,hold)
        in_band=excursion>=low-.5 and pressure-baseline>=low-.5 and quality>=.75
        self.target_seconds=self.target_seconds+dt if in_band else 0
        if self.target_seconds>=.6:self.reached=True
        if self.reached and excursion<low:self.current=round(self.grip_best_hold*100,1)
        # Raw and smoothed channels must both release: spikes cannot finish a rep.
        self.rest_seconds=self.rest_seconds+dt if excursion<=5 and pressure-baseline<=5 else 0
        if self.rest_seconds>=.3:
            self.attempts+=1
            score=100*self.grip_best_hold
            if not self.reached:score=min(94.9,score)
            self.total_score+=score
            if self.reached:self.completed+=1
            self.index+=1;self.reset_attempt()
        return True

    def measure(self, processed):
        def valid(v):return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
        if self.exercise in ('wrist_flexion','forearm_rotation'):
            angles=imu_angles(processed.get('imu',{}))
            if angles is None:return None
            axis=0 if self.exercise=='wrist_flexion' else 1
            value=(angles[axis]-self.neutral[axis]+180)%360-180
            target=TARGETS['wrist_degrees' if axis==0 else 'rotation_degrees']
            direction=1 if self.index%2==0 else -1
            return max(0,value*direction/target),abs(value)/target
        if self.exercise=='grip_pressure':
            pressure=processed.get('fsr',{}).get('pressure_instant_pct',processed.get('fsr',{}).get('pressure_pct'))
            if not valid(pressure) or not 0<=pressure<=100:return None
            return pressure/TARGETS['grip_pressure_pct'],pressure/TARGETS['grip_pressure_pct']
        flex=processed.get('flex',{})
        required=('thumb',) if self.exercise=='thumb_opposition' else FINGERS
        if not all(valid(flex.get(f)) and 0<=flex[f]<=100 for f in required):return None
        if self.exercise=='grasp_release':
            return min(flex[f]/70 for f in FINGERS),max(flex[f] for f in FINGERS)/70
        if self.exercise=='individual_fingers':
            selected=FINGERS[self.index%5]
            return flex[selected]/TARGETS['finger_flex_pct'],flex[selected]/TARGETS['finger_flex_pct']
        return flex['thumb']/60,flex['thumb']/60

    def update_individual_fingers(self, processed, dt):
        measurement=self.measure(processed)
        if measurement is None:
            self.current=None;self.reset_attempt();return False
        if not isinstance(dt,(int,float)) or not math.isfinite(dt) or dt<=0:return True
        if dt>.3:self.reset_attempt();return True
        progress,rest=measurement
        selected=FINGERS[self.index%5]
        flex=processed['flex']
        other_mean=sum(flex[f] for f in FINGERS if f!=selected)/4
        # Neighbouring fingers may follow naturally. Only a general whole-hand
        # curl is excluded: the requested finger should lead the other channels.
        focus=max(0,min(1,(flex[selected]-other_mean)/8))
        quality=max(0,min(1,progress))*focus
        self.current=round(quality*100,1)
        if self.phase=='rest':
            self.rest_seconds=self.rest_seconds+dt if rest<=.35 else 0
            if self.rest_seconds>=.2:self.phase='ready'
            return True
        if self.phase=='ready':
            if progress>=.4:self.phase='moving';self.peak=quality;self.rest_seconds=0
            return True
        self.peak=max(self.peak,quality)
        self.target_seconds=self.target_seconds+dt if quality>=.75 else 0
        if self.target_seconds>=.2:self.reached=True
        self.rest_seconds=self.rest_seconds+dt if rest<=.35 else 0
        if self.rest_seconds>=.2:
            if self.reached:
                self.finger_round_scores.append(self.peak*100)
                self.index+=1
                if len(self.finger_round_scores)==5:
                    self.attempts+=1;self.completed+=1
                    self.total_score+=sum(self.finger_round_scores)/5
                    self.finger_round_scores=[]
            # An incomplete finger stays selected for another comfortable try.
            self.reset_attempt()
        return True

    def update(self, processed, dt):
        if self.exercise=='grip_pressure':return self.update_grip(processed,dt)
        if self.exercise=='individual_fingers':return self.update_individual_fingers(processed,dt)
        measurement=self.measure(processed)
        if measurement is None:self.current=None;self.reset_attempt();return False
        progress,rest=measurement;progress=max(0,min(1,progress));self.current=round(progress*100,1)
        if self.phase=='rest':
            self.rest_seconds=self.rest_seconds+dt if rest<=.2 else 0
            if self.rest_seconds>=.2:self.phase='ready'
            return True
        if self.phase=='ready':
            if progress>=.25:self.phase='moving';self.peak=progress;self.rest_seconds=0.0
            return True
        self.peak=max(self.peak,progress)
        self.target_seconds=self.target_seconds+dt if progress>=.95 else 0
        if self.target_seconds>=.2:self.reached=True
        self.rest_seconds=self.rest_seconds+dt if rest<=.2 else 0
        if self.rest_seconds>=.2:
            self.attempts+=1
            self.total_score+=100 if self.reached else min(94.9,self.peak*100)
            if self.reached:self.completed+=1
            self.index+=1;self.reset_attempt()
        return True

    @property
    def average(self):return round(self.total_score/self.attempts,1) if self.attempts else None

    @property
    def instruction(self):
        if self.exercise=='individual_fingers':
            finger={'pinky':'little finger','thumb':'thumb'}.get(FINGERS[self.index%5],FINGERS[self.index%5]+' finger')
            prefix=f'{len(self.finger_round_scores)}/5 fingers completed. '
            if self.reached:return prefix+'Target reached. Relax this finger to continue.'
            return prefix+f'Bend and relax your {finger}. Nearby fingers may move too. Aim for at least 75%.'
        if self.phase=='rest':return 'Return to a comfortable resting position.'
        if self.exercise=='grip_pressure':
            value=max(0,(self.grip_filtered or 0)-getattr(self,'grip_baseline',0))
            if self.reached:return 'Hold complete. Release gently to finish this attempt.'
            if value>65:return f'Pressure {value:.0f}%. A stronger squeeze still counts. Ease gently if needed, then release.'
            return f'Pressure {value:.0f}%. Aim for a comfortable 25–65%, hold briefly, then release.'
        if self.reached:return 'Target reached. Slowly return to rest.'
        if self.exercise=='grasp_release':return 'Gently close your hand, then open and return to rest.'
        if self.exercise=='individual_fingers':return f'Bend your {FINGERS[self.index%5]} finger, keeping the others relaxed, then return.'
        if self.exercise=='thumb_opposition':return 'Gently bend your thumb toward a fingertip, then relax. Contact is not scored.'
        if self.exercise=='wrist_flexion':return 'Lift your wrist, then return to centre.' if self.index%2==0 else 'Lower your wrist, then return to centre.'
        return 'Turn your forearm one way, then return to centre.' if self.index%2==0 else 'Turn your forearm the other way, then return to centre.'
