import unittest
from engine.paced_movement import PacedMovement
from engine.guided_exercises import FINGERS


class FingerRoundTests(unittest.TestCase):
    def setUp(self):self.movement=PacedMovement('individual_fingers')
    def hold(self,values,n=5):
        for _ in range(n):self.movement.update({'flex':dict(values)},.1)
    def attempt(self,selected,amount=55,neighbours=40):
        self.hold({f:0 for f in FINGERS},3)
        self.hold({f:amount if f==selected else neighbours for f in FINGERS},6)
        self.hold({f:0 for f in FINGERS},3)
    def test_neighbours_allowed_and_only_five_fingers_award_round(self):
        for finger in FINGERS[:4]:
            self.attempt(finger)
            self.assertEqual(self.movement.completed,0)
            self.assertEqual(self.movement.attempts,0)
        self.attempt('pinky')
        self.assertEqual(self.movement.completed,1)
        self.assertEqual(self.movement.attempts,1)
        self.assertAlmostEqual(self.movement.average,84.6,places=1)
        self.assertEqual(self.movement.index,5)
    def test_75_percent_qualifies_without_perfect_movement(self):
        for finger in FINGERS:self.attempt(finger,49,35)
        self.assertEqual(self.movement.completed,1)
        self.assertAlmostEqual(self.movement.average,75.4,places=1)
    def test_incomplete_finger_retries_same_step(self):
        self.attempt('thumb',30,10)
        self.assertEqual(self.movement.index,0)
        self.attempt('thumb')
        self.assertEqual(self.movement.index,1)
        self.assertEqual(self.movement.completed,0)
    def test_whole_hand_curl_does_not_pass(self):
        self.attempt('thumb',65,65)
        self.assertEqual(self.movement.index,0)
        self.assertEqual(self.movement.completed,0)
    def test_wrong_finger_and_held_finger_do_not_repeat(self):
        self.attempt('index')
        self.assertEqual(self.movement.index,0)
        self.hold({f:0 for f in FINGERS},3)
        self.hold({f:55 if f=='thumb' else 20 for f in FINGERS},40)
        self.assertEqual(self.movement.index,0)
        self.hold({f:0 for f in FINGERS},3)
        self.assertEqual(self.movement.index,1)
    def test_missing_data_cannot_finish_a_finger(self):
        self.hold({f:0 for f in FINGERS},3)
        self.hold({f:55 if f=='thumb' else 20 for f in FINGERS},5)
        self.assertFalse(self.movement.update({'flex':{}},.1))
        self.hold({f:0 for f in FINGERS},3)
        self.assertEqual(self.movement.index,0)

if __name__=='__main__':unittest.main()
