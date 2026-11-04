import unittest
from engine.emg_estimator import EMGEstimator


class EstimatedEMGTests(unittest.TestCase):
    def frame(self,t,bend=0,pressure=0,gyro=0):
        return {'timestamp':t,'flex':{f:bend for f in ('thumb','index','middle','ring','pinky')},
                'fsr':{'pressure_pct':pressure},'imu':{'gyro_energy':gyro}}
    def test_motion_and_grip_raise_signal_then_rest_decays(self):
        estimator=EMGEstimator();rest=estimator.update(self.frame(1))['envelope']
        burst=estimator.update(self.frame(1.1,bend=70))
        self.assertGreater(burst['envelope'],rest+10)
        self.assertEqual(burst['case'],'finger_movement')
        for i in range(20):grip=estimator.update(self.frame(1.2+i*.1,70,80))
        self.assertGreater(grip['envelope'],30);self.assertEqual(grip['case'],'grip')
        for i in range(50):relaxed=estimator.update(self.frame(3.2+i*.1))
        self.assertLess(relaxed['envelope'],6)
    def test_wrist_response_and_stale_gap_reset(self):
        estimator=EMGEstimator();estimator.update(self.frame(1))
        for i in range(15):result=estimator.update(self.frame(1.1+i*.1,gyro=100))
        self.assertEqual(result['case'],'wrist_movement');self.assertGreater(result['envelope'],10)
        self.assertLess(estimator.update(self.frame(10))['envelope'],6)
    def test_provenance_and_input_preservation(self):
        import copy
        estimator=EMGEstimator();frame=self.frame(1);original=copy.deepcopy(frame)
        result=estimator.update(frame)
        self.assertEqual(frame,original);self.assertFalse(result['available'])
        self.assertTrue(result['estimated']);self.assertIsNone(result['raw'])
        self.assertEqual(result['units'],'a.u.')
    def test_preprocessor_changes_only_missing_emg(self):
        from unittest.mock import patch
        from engine.preprocessor import SensorPreprocessor
        frame={'timestamp':1,'_source':'mqtt','sensors':{'flex':{f:1800 for f in ('thumb','index','middle','ring','pinky')},
               'fsr':{'pressure':400},'imu':{'acc_z':1,'gyro_x':10},'emg':{'available':False}}}
        with patch('config.ESTIMATE_MISSING_EMG',False):real,_=SensorPreprocessor().process_frame(frame)
        with patch('config.ESTIMATE_MISSING_EMG',True):estimated,_=SensorPreprocessor().process_frame(frame)
        for key in ('flex','fsr','imu','mean_bend_pct'):self.assertEqual(real[key],estimated[key])
        self.assertFalse(estimated['emg']['available']);self.assertTrue(estimated['emg']['estimated'])
        frame['sensors']['emg']={'available':True,'envelope':42,'raw':1900}
        with patch('config.ESTIMATE_MISSING_EMG',True):measured,_=SensorPreprocessor().process_frame(frame)
        self.assertTrue(measured['emg']['available']);self.assertNotIn('estimated',measured['emg'])

if __name__=='__main__':unittest.main()
