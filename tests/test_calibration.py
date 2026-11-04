import copy
import unittest
from types import SimpleNamespace
from unittest.mock import Mock
from engine.glove_personalisation import GlovePersonalisation, PersonalisationError, FINGERS


class Clock:
    def __init__(self): self.now=1000.
    def __call__(self): return self.now
    def sleep(self,seconds): self.now+=seconds


class Glove:
    def __init__(self,clock):
        self.clock=clock;self.data_source='mqtt';self.values={f:350 for f in FINGERS};self.pressure=10
        self.mqtt_receiver=SimpleNamespace(is_connected=True)
        self.serial_receiver=SimpleNamespace(is_connected=True)
        self.guided=SimpleNamespace(active=None);self.preprocessor=Mock()
    @property
    def latest_state(self):
        return {'data_source':self.data_source,'received_at':self.clock(),
                'raw_sensors':{'flex':self.values.copy(),'fsr':{'pressure':self.pressure}}}


class Database:
    def __init__(self):
        self.profile={'flex':{},'emg_baseline':21,'emg_active_threshold':47};self.writes=0
    def get_calibration(self,_):return copy.deepcopy(self.profile)
    def save_calibration(self,_,flex,emg,threshold,baseline,contact,maximum):
        self.writes+=1
        self.profile.update(flex=flex,fsr_baseline=baseline,fsr_contact_threshold=contact,fsr_max_raw=maximum)


class CalibrationTests(unittest.TestCase):
    def setUp(self):
        self.clock=Clock();self.glove=Glove(self.clock);self.db=Database()
        self.service=GlovePersonalisation(self.glove,self.db,duration=.4,minimum_samples=5,
            clock=self.clock,wall_clock=self.clock,sleep=self.clock.sleep)
        self.id=self.service.start()['id']
    def fingers(self):
        self.service.capture(self.id,'open')
        self.glove.values={f:100 for f in FINGERS};self.glove.values['thumb']=500
        self.service.capture(self.id,'closed')
        self.glove.values={f:320 for f in FINGERS}
        self.glove.values['thumb']=400
        self.service.capture(self.id,'rest')
    def test_complete_requires_release_and_preserves_finger_direction(self):
        self.fingers();self.glove.pressure=650
        self.assertEqual(self.service.capture(self.id,'fsr')['stage'],'release')
        self.assertEqual(self.db.writes,0)
        self.glove.pressure=10;result=self.service.capture(self.id,'release')
        self.assertEqual(result['stage'],'done');self.assertEqual(self.db.writes,1)
        self.assertEqual(self.db.profile['fsr_max_raw'],650)
        self.assertEqual(self.db.profile['fsr_baseline'],10)
        self.assertEqual(self.db.profile['flex']['thumb']['max_adc'],500)
        self.assertEqual(self.db.profile['flex']['index']['max_adc'],100)
    def test_zero_index_cannot_be_saved_as_open_endpoint(self):
        self.glove.values['index']=0
        with self.assertRaises(PersonalisationError) as error:self.service.capture(self.id,'open')
        self.assertIn('index',error.exception.fingers)
        self.assertEqual(self.service.session['stage'],'open');self.assertEqual(self.db.writes,0)
    def test_zero_closed_endpoint_allowed_but_must_recover_at_rest(self):
        self.service.capture(self.id,'open');self.glove.values={f:100 for f in FINGERS};self.glove.values['middle']=0
        self.assertEqual(self.service.capture(self.id,'closed')['stage'],'rest')
        with self.assertRaises(PersonalisationError):self.service.capture(self.id,'rest')
        self.assertEqual(self.db.writes,0)
        self.glove.values={f:320 for f in FINGERS};self.service.capture(self.id,'rest')
        self.glove.pressure=650;self.service.capture(self.id,'fsr')
        self.glove.pressure=10;self.service.capture(self.id,'release')
        self.assertEqual(self.db.profile['flex']['middle']['max_adc'],0)
    def test_moving_finger_capture_uses_median_without_blocking(self):
        def move(seconds):
            self.clock.sleep(seconds);self.glove.values['index']+=12
        self.service.sleep=move
        self.assertEqual(self.service.capture(self.id,'open')['stage'],'closed')
        self.assertGreater(self.service.session['opened']['index'],350)
        self.assertEqual(self.db.writes,0)
    def test_rest_outside_captured_range_rejected(self):
        self.service.capture(self.id,'open');self.glove.values={f:100 for f in FINGERS};self.service.capture(self.id,'closed')
        self.glove.values={f:500 for f in FINGERS}
        with self.assertRaises(PersonalisationError):self.service.capture(self.id,'rest')
    def test_no_pressure_and_saturated_pressure_rejected(self):
        self.fingers()
        for pressure in (10,35,4095):
            self.glove.pressure=pressure
            with self.assertRaises(PersonalisationError):self.service.capture(self.id,'fsr')
            self.assertEqual(self.service.session['stage'],'fsr');self.assertEqual(self.db.writes,0)
    def test_unstable_pressure_rejected(self):
        self.fingers();self.glove.pressure=350
        def move(seconds):
            self.clock.sleep(seconds);self.glove.pressure+=40
        self.service.sleep=move
        with self.assertRaises(PersonalisationError):self.service.capture(self.id,'fsr')
        self.assertEqual(self.db.writes,0)
    def test_held_pressure_does_not_pass_release_and_retry_succeeds(self):
        self.fingers();self.glove.pressure=650;self.service.capture(self.id,'fsr')
        with self.assertRaises(PersonalisationError):self.service.capture(self.id,'release')
        self.assertEqual(self.db.writes,0);self.assertEqual(self.service.session['stage'],'release')
        self.glove.pressure=10;self.service.capture(self.id,'release');self.assertEqual(self.db.writes,1)

if __name__=='__main__':unittest.main()
