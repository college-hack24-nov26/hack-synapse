#include <WiFi.h>
#include <ESPmDNS.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "secrets.h"

// ADC1 pins only: ADC2 (including GPIO14 and GPIO27) conflicts with Wi-Fi.
const int FLEX_PINS[] = {36, 34, 32, 35, 39}; // thumb, index, middle, ring, pinky
const int FSR_PIN = 33;
const uint8_t MPU_ADDR = 0x68;
const char* TOPIC = "neuroglove/sensors/data";
WiFiClient transport;
PubSubClient mqtt(transport);
unsigned long lastWifi = 0, lastMqtt = 0, lastSample = 0;
bool mdnsStarted = false;

void writeMPU(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR); Wire.write(reg); Wire.write(value); Wire.endTransmission();
}
bool readMPU(int16_t* values) {
  Wire.beginTransmission(MPU_ADDR); Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0 || Wire.requestFrom(MPU_ADDR, (uint8_t)14) != 14) return false;
  for (int i = 0; i < 7; ++i) values[i] = (int16_t)((Wire.read() << 8) | Wire.read());
  return true;
}
void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  for (int pin : FLEX_PINS) pinMode(pin, INPUT);
  pinMode(FSR_PIN, INPUT);
  Wire.begin(21, 22); Wire.setClock(100000); Wire.setTimeOut(50);
  delay(100); writeMPU(0x6B, 0); delay(100);
  writeMPU(0x1C, 0); writeMPU(0x1B, 0);
  WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true); WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  mqtt.setServer(MQTT_FALLBACK_IP, MQTT_PORT);
  mqtt.setBufferSize(512); mqtt.setSocketTimeout(1); mqtt.setKeepAlive(15);
  Serial.println("NeuroGlove wireless: thumb36 index34 middle32 ring35 pinky39 FSR33");
}
void loop() {
  unsigned long now = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifi >= 10000) {lastWifi = now; WiFi.reconnect(); Serial.println("Waiting for Wi-Fi");}
  } else {
    if (!mdnsStarted) {mdnsStarted = MDNS.begin("neuroglove-esp32"); Serial.print("Wi-Fi IP: "); Serial.println(WiFi.localIP());}
    if (!mqtt.connected() && now - lastMqtt >= 3000) {
      lastMqtt = now;
      IPAddress broker = MDNS.queryHost("raspberrypi", 500);
      if (broker != IPAddress(0,0,0,0)) mqtt.setServer(broker, MQTT_PORT);
      else mqtt.setServer(MQTT_FALLBACK_IP, MQTT_PORT);
      String id = "NeuroGlove-" + WiFi.macAddress();
      id.replace(":", "");
      if (mqtt.connect(id.c_str(), MQTT_USER, MQTT_PASS)) Serial.println("MQTT connected to Raspberry Pi");
      else {Serial.print("MQTT retry, code "); Serial.println(mqtt.state());}
    }
    mqtt.loop();
  }
  if (now - lastSample < 100) return;
  lastSample = now;
  int16_t imu[7];
  if (!readMPU(imu)) {Serial.println("ERROR: MPU6050 not responding"); return;}
  // CSV matches the USB contract exactly. No invented IMU values or EMG.
  char frame[220];
  int n = snprintf(frame, sizeof(frame), "%d,%d,%d,%d,%d,%d,%.3f,%.3f,%.3f,%.2f,%.2f,%.2f",
    analogRead(FLEX_PINS[0]), analogRead(FLEX_PINS[1]), analogRead(FLEX_PINS[2]),
    analogRead(FLEX_PINS[3]), analogRead(FLEX_PINS[4]), analogRead(FSR_PIN),
    imu[0]/16384.0, imu[1]/16384.0, imu[2]/16384.0, imu[4]/131.0, imu[5]/131.0, imu[6]/131.0);
  if (n <= 0 || n >= (int)sizeof(frame)) return;
  Serial.println(frame);
  if (mqtt.connected()) mqtt.publish(TOPIC, frame, false);
}
