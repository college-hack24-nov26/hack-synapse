"""Run with sudo after extraction. Credentials are read from the local firmware."""
import os
import re
import shutil
import subprocess
from pathlib import Path

root = Path('/home/pi/NeuroGlove-React')
if os.geteuid() != 0:
    raise SystemExit('Run this provisioning script with sudo.')

credentials = {}
for source in sorted((root / 'firmware').rglob('*')):
    if source.suffix not in ('.ino', '.h') or 'example' in source.name:
        continue
    text = source.read_text(encoding='utf-8')
    for key, value in re.findall(r'(MQTT_USER(?:NAME)?|MQTT_PASS(?:WORD)?)\s*=\s*"([^"\n]+)"', text):
        credentials['user' if 'USER' in key else 'password'] = value
if not {'user', 'password'} <= credentials.keys():
    raise SystemExit('No MQTT credentials found in firmware; configure them before provisioning.')

def run(*args):
    subprocess.run(args, check=True)

config_dir = Path('/home/pi/.config/neuroglove')
config_dir.mkdir(parents=True, exist_ok=True)
env = config_dir / 'react.env'
env.write_text('MQTT_BROKER_HOST=127.0.0.1\nMQTT_BROKER_PORT=1883\n'
               f'MQTT_USERNAME={credentials["user"]}\nMQTT_PASSWORD={credentials["password"]}\n', encoding='utf-8')
env.chmod(0o600)
shutil.chown(config_dir, user='pi', group='pi')
shutil.chown(env, user='pi', group='pi')
password_file = '/etc/mosquitto/neuroglove-passwords'
run('mosquitto_passwd', '-b', '-c', password_file, credentials['user'], credentials['password'])
os.chmod(password_file, 0o640)
shutil.chown(password_file, user='root', group='mosquitto')
Path('/etc/mosquitto/neuroglove-acl').write_text(
    f'user {credentials["user"]}\ntopic readwrite neuroglove/sensors/data\ntopic readwrite neuroglove/control/status\n')
Path('/etc/mosquitto/conf.d/neuroglove.conf').write_text(
    'listener 1883 0.0.0.0\nlistener 1884 0.0.0.0\nallow_anonymous false\n'
    'password_file /etc/mosquitto/neuroglove-passwords\nacl_file /etc/mosquitto/neuroglove-acl\n')
shutil.copyfile(root / 'deployment/neuroglove-react.service', '/etc/systemd/system/neuroglove-react.service')
run('systemctl', 'daemon-reload')
run('systemctl', 'enable', 'mosquitto', 'neuroglove-react')
run('systemctl', 'restart', 'mosquitto')
run('systemctl', 'restart', 'neuroglove-react')
print('MQTT and React startup services configured.')
