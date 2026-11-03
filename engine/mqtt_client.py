"""
NeuroGlove MQTT Receiver Client
Connects to local Mosquitto MQTT broker, subscribes to sensor streams from ESP32,
and pushes received frames to the edge processing queue.
"""

import json
import time
import logging
from queue import Queue
from typing import Optional
from engine.serial_client import parse_sensor_line
import paho.mqtt.client as mqtt
import config

logger = logging.getLogger("NeuroGlove.MQTT")

class MQTTReceiver:
    def __init__(self, data_queue: Queue, host: str = config.MQTT_BROKER_HOST, port: int = config.MQTT_BROKER_PORT):
        self.data_queue = data_queue
        self.host = host
        self.port = port
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self.message_count = 0
        self.last_msg_time = 0.0

    def start(self):
        """Initializes and connects MQTT client in a background loop."""
        if self.client is not None:
            return
        try:
            # Paho MQTT 2.x API
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=config.MQTT_CLIENT_ID)
        except Exception:
            # Fallback for Paho MQTT 1.x
            self.client = mqtt.Client(client_id=config.MQTT_CLIENT_ID)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        if config.MQTT_USERNAME:
            self.client.username_pw_set(config.MQTT_USERNAME, config.MQTT_PASSWORD)
        self.client.reconnect_delay_set(min_delay=1, max_delay=10)

        try:
            logger.info(f"Connecting to MQTT broker at {self.host}:{self.port}...")
            self.client.connect_async(self.host, self.port, keepalive=config.MQTT_KEEPALIVE_SEC)
            self.client.loop_start()
        except Exception as e:
            logger.warning(f"Could not connect to MQTT broker ({e}). Pipeline can fallback to simulator.")

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT broker successfully. Subscribing to {config.MQTT_TOPIC_SENSOR_DATA}")
            client.subscribe(config.MQTT_TOPIC_SENSOR_DATA)
            client.subscribe(config.MQTT_TOPIC_STATUS)
        else:
            self.is_connected = False
            logger.error(f"MQTT connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, *args):
        self.is_connected = False
        logger.warning("Disconnected from MQTT broker")

    def _on_message(self, client, userdata, msg):
        if msg.topic != config.MQTT_TOPIC_SENSOR_DATA or msg.retain:
            return
        try:
            now = time.time()
            text = msg.payload.decode("utf-8")
            # Same twelve-channel contract as USB. Receipt time belongs to the Pi,
            # never to an ESP32 uptime clock or a retained broker message.
            if not text.lstrip().startswith('{'):
                payload = parse_sensor_line(text, seq=self.message_count + 1, received_at=now)
                if payload is None:
                    return
            else:
                message = json.loads(text)
                if not isinstance(message, dict) or not isinstance(message.get('sensors'), dict):
                    return
                sensors = message['sensors']
                flex, imu = sensors['flex'], sensors['imu']
                values = [flex[f] for f in ('thumb','index','middle','ring','pinky')]
                values += [sensors['fsr']['pressure']]
                values += [imu[k] for k in ('acc_x','acc_y','acc_z','gyro_x','gyro_y','gyro_z')]
                payload = parse_sensor_line(','.join(str(v) for v in values), seq=message.get('seq', self.message_count + 1), received_at=now)
                if payload is None:
                    return
                payload['device_id'] = message.get('device_id', 'neuroglove_esp32')
                if isinstance(sensors.get('emg'), dict):
                    payload['sensors']['emg'] = sensors['emg']
            payload['_source'] = 'mqtt'
            self.message_count += 1
            self.last_msg_time = now
            if self.data_queue.full():
                self.data_queue.get_nowait()
            self.data_queue.put_nowait(payload)
        except Exception as e:
            logger.error(f"Error parsing MQTT message: {e}")

    def stop(self):
        if self.client:
            self.client.disconnect()
            self.client.loop_stop()
            self.client = None
            self.is_connected = False
