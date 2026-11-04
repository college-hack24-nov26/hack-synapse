"""Opening the ESP32 port must not deliberately toggle its reset lines."""
import importlib.util
from pathlib import Path
import queue
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('usb_receiver_under_test', Path(__file__).resolve().parents[1] / 'engine/serial_client.py')
usb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(usb)


class USBConnectionTests(unittest.TestCase):
    def test_control_lines_inactive_before_open_and_fragmented_frame_survives(self):
        receiver = usb.SerialReceiver(queue.Queue())
        events = []

        class Port:
            def __init__(self, **kwargs):
                self.dtr = True
                self.rts = True
                self.parts = iter([b'333,219,112,273,284,0,-0.05,', b'0.2,1.0,2,2,-1\r\n'])
            def open(self):
                events.append((self.dtr, self.rts))
            def reset_input_buffer(self): pass
            def close(self): pass
            def read_until(self, *args, **kwargs):
                try: return next(self.parts)
                except StopIteration:
                    receiver._stop.set()
                    return b''

        with patch('serial.Serial', Port):
            receiver._run()
        self.assertEqual(events, [(False, False)])
        frame = receiver.queue.get_nowait()
        self.assertEqual(frame['sensors']['flex']['thumb'], 333)
        self.assertEqual(receiver.seq, 1)


if __name__ == '__main__':
    unittest.main()
