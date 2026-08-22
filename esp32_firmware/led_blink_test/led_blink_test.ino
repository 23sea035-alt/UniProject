/*
 * ESP32 LED Blink + Remote Control Test
 * -------------------------------------
 * App switch -> server queue -> device polls -> LED blinks -> ACK
 *
 *   1. App "ESP32 LED Test" switch -> POST /api/led/request
 *   2. Command queued in valveCommands (action: led_on / led_off)
 *   3. This sketch polls GET /api/led/poll every 3s (tiny JSON response)
 *   4. Applies it to BOTH LEDs and confirms via POST /api/led/ack
 *
 * Behaviour:
 *   - Startup:  3 quick blinks, then restores TRUE state from server
 *   - led_on:   LEDs blink CONTINUOUSLY (150ms on/off)
 *   - led_off:  LEDs stay completely dark
 *
 * Wiring - EXTERNAL LED:
 *
 *   GPIO23 ──[330 ohm resistor]──►|──── GND
 *   Long leg (+) -> resistor -> GPIO23, Short leg (-) -> GND
 *   Resistor: 220-330 ohm (do NOT skip it!)
 *
 * Board: ESP32 Dev Module (Arduino IDE, no extra libraries needed)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>

// ---------------- Config ----------------
const char* WIFI_SSID     = "Dialog 4G 683";
const char* WIFI_PASSWORD = "BcD937EF";

// LAN mode (PC server):   API_USE_HTTPS=false, API_HOST="192.168.8.106", API_PORT=3000
// Cloud mode (Render):    API_USE_HTTPS=true,  API_HOST="aquatrack-api-qdy7.onrender.com", API_PORT=443
const bool  API_USE_HTTPS = true;
const char* API_HOST      = "aquatrack-api-qdy7.onrender.com";
const int   API_PORT      = 443;
const char* DEVICE_KEY    = "ESP32-WM001";    // X-Device-Key header

#define ONBOARD_LED_PIN 2    // built-in LED
#define EXT_LED_PIN     23   // external LED via resistor
const unsigned long POLL_INTERVAL_MS = 3000;
const unsigned long HTTP_TIMEOUT_MS  = 20000;  // 20s timeout for cold starts

// Continuous-blink timing while LED is switched ON
const unsigned long BLINK_ON_MS  = 150;
const unsigned long BLINK_OFF_MS = 150;

// ---------------- Globals ----------------
unsigned long lastPoll  = 0;
unsigned long lastBlink = 0;
bool ledCommandOn = false;        // authoritative local state
String lastAppliedCommandId = ""; // duplicate-command guard

// ---------------- Helpers ----------------
WiFiClientSecure& getSecureClient() {
  static WiFiClientSecure client;
  return client;
}

bool apiBegin(HTTPClient& http, const String& url) {
  if (!API_USE_HTTPS) return http.begin(url);
  WiFiClientSecure& client = getSecureClient();
  client.setInsecure();               // TODO production: pin the server CA cert
  bool ok = http.begin(client, url);
  if (ok) http.setTimeout(HTTP_TIMEOUT_MS);
  return ok;
}

void setLed(bool on) {
  digitalWrite(ONBOARD_LED_PIN, on ? HIGH : LOW);
  digitalWrite(EXT_LED_PIN,     on ? HIGH : LOW);
}

void blink(int times, int onMs = 120, int offMs = 120) {
  for (int i = 0; i < times; i++) {
    setLed(true);
    delay(onMs);
    if (ledCommandOn && i == times - 1) break;
    setLed(false);
    delay(offMs);
  }
}

void connectWifi() {
  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print('.');
  }
  Serial.printf(" connected, IP: %s\n", WiFi.localIP().toString().c_str());
}

// ISO-8601 UTC timestamp from NTP (used for readings)
String isoTime() {
  struct tm t;
  if (!getLocalTime(&t, 500)) return "1970-01-01T00:00:00Z";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &t);
  return String(buf);
}

// Extract "key":"value" from a SMALL json body
String jsonStr(const String& body, const String& key) {
  int k = body.indexOf("\"" + key + "\":\"");
  if (k < 0) return "";
  int start = k + key.length() + 4;
  int end = body.indexOf('"', start);
  if (end < 0) return "";
  return body.substring(start, end);
}

void sendAck(const String& commandId, bool success) {
  for (int attempt = 1; attempt <= 3; attempt++) {
    HTTPClient http;
    String url = String("http://") + API_HOST + ":" + API_PORT + "/api/led/ack";
    if (!apiBegin(http, url)) { http.end(); delay(500); continue; }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_KEY);
    String payload = "{\"commandId\":\"" + commandId + "\",\"success\":" + (success ? "true" : "false") + "}";
    int code = http.POST(payload);
    if (code == 200) {
      Serial.printf("[ACK] %s -> HTTP 200\n", commandId.c_str());
      http.end();
      return;
    }
    Serial.printf("[ACK] attempt %d failed: HTTP %d\n", attempt, code);
    http.end();
    if (attempt < 3) delay(1000 * attempt);
  }
  Serial.printf("[ACK] %s -> all retries failed\n", commandId.c_str());
}

void applyCommand(const String& action, const String& commandId) {
  if (commandId.length() > 0 && commandId == lastAppliedCommandId) {
    Serial.println("[CMD] duplicate ignored");
    sendAck(commandId, true);      // re-confirm so server marks it executed
    return;
  }

  Serial.printf("[CMD] applying: %s (%s)\n", action.c_str(), commandId.c_str());

  if (action == "led_on") {
    ledCommandOn = true;           // loop() keeps it blinking from now on
  } else if (action == "led_off") {
    ledCommandOn = false;
    setLed(false);
  } else {
    Serial.printf("[CMD] unknown action '%s'\n", action.c_str());
    if (commandId.length() > 0) sendAck(commandId, false);
    return;
  }

  if (commandId.length() > 0) {
    lastAppliedCommandId = commandId;
    sendAck(commandId, true);
  }
}

// Ask the server for the next queued command: {"command":{"id":"..","action":".."}} or {"command":null}
void pollCommands() {
  for (int attempt = 1; attempt <= 3; attempt++) {
    HTTPClient http;
    String url = String("http://") + API_HOST + ":" + API_PORT + "/api/led/poll";
    if (!apiBegin(http, url)) { http.end(); delay(500); continue; }
    http.addHeader("X-Device-Key", DEVICE_KEY);
    int code = http.GET();

    if (code == 200) {
      String body = http.getString();
      http.end();

      if (body.indexOf("\"command\":null") >= 0) return;   // nothing queued

      String id     = jsonStr(body, "id");
      String action = jsonStr(body, "action");
      if (id.length() > 0 && action.length() > 0) {
        applyCommand(action, id);
        return;
      }
      Serial.println("[POLL] unexpected body: " + body);
      return;
    }

    Serial.printf("[POLL] attempt %d failed: HTTP %d\n", attempt, code);
    http.end();
    if (attempt < 3) delay(2000 * attempt);
  }
  Serial.println("[POLL] all retries failed");
}
    return;
  }

  Serial.printf("[POLL] failed: HTTP %d\n", code);
  http.end();
}

// Keep sending readings so the dashboard shows the device online
void sendReading() {
  for (int attempt = 1; attempt <= 3; attempt++) {
    HTTPClient http;
    String url = String("http://") + API_HOST + ":" + API_PORT + "/api/readings";
    if (!apiBegin(http, url)) { http.end(); delay(500); continue; }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_KEY);

    String payload = "{\"pulseCount\":0,\"flowRate\":0,\"recordedAt\":\"" + isoTime() +
                     "\",\"type\":\"reading\",\"online\":true}";
    int code = http.POST(payload);
    if (code == 201) {
      http.end();
      return;
    }
    Serial.printf("[READ] attempt %d failed: HTTP %d\n", attempt, code);
    http.end();
    if (attempt < 3) delay(1000 * attempt);
  }
  Serial.println("[READ] all retries failed");
}
  http.end();
}

// After boot: ask the server what the LED should be: {"on":true|false|null}
void restoreState() {
  for (int attempt = 1; attempt <= 5; attempt++) {
    HTTPClient http;
    String url = String("http://") + API_HOST + ":" + API_PORT + "/api/led/state";
    if (!apiBegin(http, url)) { http.end(); delay(1000); continue; }
    http.addHeader("X-Device-Key", DEVICE_KEY);
    int code = http.GET();
    if (code == 200) {
      String body = http.getString();
      int onIdx = body.indexOf("\"on\":true");
      int offIdx = body.indexOf("\"on\":false");
      if (onIdx >= 0) {
        ledCommandOn = true;
        Serial.println("[STATE] restored: ON (blinking)");
      } else if (offIdx >= 0) {
        ledCommandOn = false;
        setLed(false);
        Serial.println("[STATE] restored: OFF");
      }
      http.end();
      return;
    }
    Serial.printf("[STATE] attempt %d failed: HTTP %d\n", attempt, code);
    http.end();
    if (attempt < 5) delay(3000 * attempt);
  }
  Serial.println("[STATE] all retries failed — starting OFF");
  ledCommandOn = false;
  setLed(false);
}
  } else {
    Serial.printf("[STATE] restore failed: HTTP %d\n", code);
  }
  http.end();
}

// ---------------- Main ----------------
void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED_PIN, OUTPUT);
  pinMode(EXT_LED_PIN, OUTPUT);
  setLed(false);

  blink(3);                   // alive signal
  connectWifi();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  delay(1500);

  restoreState();             // sync with the app switch after every boot
  Serial.println("[READY] polling for commands...");
}

void loop() {
  // Non-blocking continuous blink while the app switch is ON
  if (ledCommandOn) {
    unsigned long now = millis();
    unsigned long interval = (digitalRead(EXT_LED_PIN) == HIGH) ? BLINK_ON_MS : BLINK_OFF_MS;
    if (now - lastBlink >= interval) {
      lastBlink = now;
      setLed(digitalRead(EXT_LED_PIN) != HIGH);
    }
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi lost, reconnecting...");
    connectWifi();
    return;
  }

  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = millis();
    pollCommands();           // check for app commands FIRST
    sendReading();            // keep presence alive
  }
}
