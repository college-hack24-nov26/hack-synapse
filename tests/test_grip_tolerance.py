import unittest
from engine.paced_movement import PacedMovement


class GripToleranceTests(unittest.TestCase):
    def hold(self,movement,pressure,seconds=1.5):
        for _ in range(round(seconds*20)):
            movement.update({'fsr':{'pressure_instant_pct':pressure}},.05)
    def cycle(self,pressure):
        movement=PacedMovement('grip_pressure')
        self.hold(movement,0,.5)
        self.hold(movement,pressure)
        current=movement.current
        self.hold(movement,0,.8)
        return movement,current
    def test_comfortable_band_counts_at_full_quality(self):
        for pressure in (25,28,35,50,65):
            with self.subTest(pressure=pressure):
                movement,current=self.cycle(pressure)
                self.assertEqual(movement.completed,1)
                self.assertGreater(movement.average,98)
    def test_extra_pressure_never_collapses_to_zero(self):
        scores=[]
        for pressure in (70,80,90,100):
            movement,current=self.cycle(pressure)
            self.assertEqual(movement.completed,1)
            self.assertGreaterEqual(current,75)
            self.assertGreaterEqual(movement.average,75)
            scores.append(current)
        self.assertLess(max(scores)-min(scores),25)
    def test_light_touch_is_partial_not_a_completed_grip(self):
        movement,_=self.cycle(10)
        self.assertEqual(movement.completed,0)
        self.assertLess(movement.average,75)
    def test_spike_or_held_pressure_cannot_count_repeatedly(self):
        movement=PacedMovement('grip_pressure');self.hold(movement,0,.5)
        self.hold(movement,65,.15);self.hold(movement,0,.8)
        self.assertEqual(movement.completed,0)
        self.hold(movement,0,.5)
        self.hold(movement,60,3)
        self.assertEqual(movement.completed,0)
        self.hold(movement,0,.8)
        self.assertEqual(movement.completed,1)
    def test_missing_data_discards_unfinished_hold(self):
        movement=PacedMovement('grip_pressure');self.hold(movement,0,.5);self.hold(movement,50)
        self.assertFalse(movement.update({'fsr':{}},.05))
        self.hold(movement,0,.8);self.assertEqual(movement.completed,0)

if __name__=='__main__':unittest.main()
