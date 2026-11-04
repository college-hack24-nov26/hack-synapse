"""Read the user's 12-column ESP32 USB CSV at 115200 baud; never synthesise channels."""
import math
import queue
import threading
import time
import logging

log=logging.getLogger('NeuroGlove.Serial')
FINGERS=('thumb','index','middle','ring','pinky')

def parse_sensor_line(line, seq=0, received_at=None):
    if isinstance(line,bytes):line=line.decode('ascii',errors='strict')
    fields=line.strip().split(',')
    if len(fields)!=12:return None
    try:values=[float(v) for v in fields]
    except ValueError:return None
    if not all(math.isfinite(v) for v in values):return None
    if any(v!=int(v) or not 0<=v<=4095 for v in values[:6]):return None
    if any(abs(v)>32 for v in values[6:9]) or any(abs(v)>4000 for v in values[9:]):return None
    now=time.time() if received_at is None else received_at
    return {'timestamp':now,'received_at':now,'seq':seq,'_source':'serial',
            'sensors':{'flex':dict(zip(FINGERS,map(int,values[:5]))),'fsr':{'pressure':int(values[5])},
                       'imu':dict(zip(('acc_x','acc_y','acc_z','gyro_x','gyro_y','gyro_z'),values[6:])),
                       'emg':{'available':False}}}

class SerialReceiver:
    def __init__(self,data_queue,port='COM11',baud=115200):
        self.queue=data_queue;self.port=port;self.baud=baud;self.is_connected=False;self.error=None
        self.last_received_at=None;self._stop=threading.Event();self.thread=None;self.connection=None;self.seq=0
        self.last_device_message=None;self.device_boot_count=0
    def start(self):
        if self.thread and self.thread.is_alive():return
        self._stop.clear();self.thread=threading.Thread(target=self._run,daemon=True,name='ESP32-USB');self.thread.start()
    def stop(self):
        self._stop.set();self.is_connected=False
        if self.connection:
            try:self.connection.close()
            except Exception:pass
        if self.thread:self.thread.join(timeout=2)
    def _run(self):
        import serial
        while not self._stop.is_set():
            target_port = self.port
            try:
                conn = serial.Serial(port=None, baudrate=self.baud, timeout=.05,
                                     rtscts=False, dsrdtr=False, xonxoff=False)
                # Set control lines BEFORE opening. Opening with pySerial's
                # active defaults and changing them afterwards can reset ESP32.
                conn.dtr = False
                conn.rts = False
                try:
                    conn.port = target_port
                    conn.open()
                except (serial.SerialException, OSError) as e:
                    # If configured port is not available, try scanning for USB-UART bridge
                    detected = None
                    try:
                        import serial.tools.list_ports
                        for p in serial.tools.list_ports.comports():
                            d = (p.description or '').lower()
                            h = (p.hwid or '').lower()
                            if any(k in d or k in h for k in ('cp210', 'ch340', 'ftdi', 'usb-to-uart', 'uart bridge', '10c4:ea60')):
                                detected = p.device
                                break
                    except Exception:
                        pass
                    if detected and detected != target_port:
                        conn.port = detected
                        conn.open()
                        self.port = detected
                        target_port = detected
                    else:
                        raise e
                conn.reset_input_buffer()
                self.connection = conn
                self.is_connected = True
                self.error = None
                log.info('ESP32 USB connected on %s at %s baud', target_port, self.baud)
                buffer=b''
                while not self._stop.is_set():
                    chunk=conn.read_until(b'\n',size=512)
                    if not chunk:continue
                    buffer+=chunk
                    if len(buffer)>2048:buffer=b'';continue
                    if not buffer.endswith(b'\n'):continue
                    line=buffer;buffer=b''
                    try:frame=parse_sensor_line(line,self.seq)
                    except UnicodeError:continue
                    if frame is None:
                        message=line.decode('ascii',errors='replace').strip()
                        self.last_device_message=message
                        if message.startswith(('rst:', 'ets ', 'ESP-ROM:')):
                            self.device_boot_count+=1
                            log.warning('ESP32 USB boot message: %s',message)
                        if line.startswith(b'ERROR:'):self.error=line.decode('ascii',errors='replace').strip()
                        continue
                    self.seq+=1;self.last_received_at=frame['received_at'];self.error=None
                    # Only the newest physical sample matters; stale queued frames are never replayed.
                    try:self.queue.put_nowait(frame)
                    except queue.Full:
                        try:self.queue.get_nowait()
                        except queue.Empty:pass
                        try:self.queue.put_nowait(frame)
                        except queue.Full:pass
            except (serial.SerialException, OSError) as error:
                err_str = str(error)
                if 'Access is denied' in err_str or getattr(error, 'errno', None) == 13:
                    self.error = f"{target_port} is busy: close Arduino Serial Monitor to connect"
                else:
                    self.error = err_str
                log.warning('ESP32 USB unavailable: %s', self.error)
            finally:
                self.is_connected=False
                if self.connection:
                    try:self.connection.close()
                    except Exception:pass
                elif 'conn' in locals():
                    try:conn.close()
                    except Exception:pass
                self.connection=None
            self._stop.wait(1)
    def status(self):
        return {'port':self.port,'baud':self.baud,'connected':self.is_connected,
                'received_at':self.last_received_at,'error':self.error,
                'last_device_message':self.last_device_message,'device_boot_count':self.device_boot_count}
