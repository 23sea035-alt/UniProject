// =============================================================================
// ESP32 Smart Water Meter Firmware
// =============================================================================
// Libraries required:
//   - ArduinoJson (by Benoit Blanchon) v7.x
//   - WiFi (built-in ESP32 Arduino core)
//   - HTTPClient (built-in ESP32 Arduino core)
//   - Preferences (built-in ESP32 Arduino core)
//
// Board: ESP32 Dev Module
// =============================================================================

#include "config.h"
#include "flow_sensor.h"
#include "valve.h"
#include "api_client.h"
#include "offline_storage.h"

// =============================================================================
// Global objects
// =============================================================================
FlowSensor flowSensor;
Valve valve;
ApiClient apiClient;
OfflineStorage offlineStorage;

// =============================================================================
// State variables
// =============================================================================
unsigned long lastReadingTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastCommandPollTime = 0;
unsigned long lastWifiReconnectTime = 0;
unsigned long lastOfflineSyncTime = 0;

bool wifiConnected = false;
bool valveStartupDelay = true;
bool lastOnlineState = false;

float lastFlowRate = 0.0;
float lastTotalLitres = 0.0;
float lastTotalM3 = 0.0;
int lastBattery = 0;
float lastPressure1 = 0.0;
float lastPressure2 = 0.0;
float lastHydroVoltage = 0.0;

// Command idempotency — track last executed command to prevent replay
String lastExecutedCommandId = "";

// =============================================================================
// ISR for flow sensor pulse detection
// =============================================================================
void IRAM_ATTR flowPulseISR() {
    flowSensor.pulseISR();
}

// =============================================================================
// Analog sensor reading functions
// =============================================================================
float readPressure1() {
    int raw = analogRead(PRESSURE_SENSOR_1_PIN);
    float voltage = (float)raw / 4095.0 * 3.3;
    float pressureKpa = (voltage - PRESSURE_SENSOR_MIN_V) /
                        (PRESSURE_SENSOR_MAX_V - PRESSURE_SENSOR_MIN_V) *
                        PRESSURE_SENSOR_MAX_KPA;
    if (pressureKpa < 0.0) pressureKpa = 0.0;
    return pressureKpa;
}

float readPressure2() {
    int raw = analogRead(PRESSURE_SENSOR_2_PIN);
    float voltage = (float)raw / 4095.0 * 3.3;
    float pressureKpa = (voltage - PRESSURE_SENSOR_MIN_V) /
                        (PRESSURE_SENSOR_MAX_V - PRESSURE_SENSOR_MIN_V) *
                        PRESSURE_SENSOR_MAX_KPA;
    if (pressureKpa < 0.0) pressureKpa = 0.0;
    return pressureKpa;
}

int readBatteryLevel() {
    int raw = analogRead(BATTERY_VOLTAGE_PIN);
    float voltage = (float)raw / 4095.0 * 3.3 * BATTERY_VOLTAGE_DIVIDER;
    int percent = (int)((voltage - BATTERY_EMPTY_VOLTAGE) /
                   (BATTERY_FULL_VOLTAGE - BATTERY_EMPTY_VOLTAGE) * 100.0);
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    return percent;
}

float readHydroVoltage() {
    int raw = analogRead(HYDRO_VOLTAGE_PIN);
    float voltage = (float)raw / 4095.0 * 3.3 * HYDRO_VOLTAGE_DIVIDER;
    return voltage;
}

// =============================================================================
// WiFi management
// =============================================================================
void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.println("[WiFi] Connecting to " + String(WIFI_SSID));
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setSleep(false);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("[WiFi] Connected! IP: " + WiFi.localIP().toString());
        Serial.println("[WiFi] RSSI: " + String(WiFi.RSSI()) + " dBm");
        wifiConnected = true;
    } else {
        Serial.println();
        Serial.println("[WiFi] Connection failed");
        wifiConnected = false;
    }
}

void checkWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
    } else {
        wifiConnected = false;
    }
}

// =============================================================================
// Valve command handler
// =============================================================================
void handleValveCommand(String json) {
    Serial.println("[Command] Processing: " + json);

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, json);
    if (err) {
        Serial.println("[Command] JSON parse error: " + String(err.c_str()));
        return;
    }

    // Backend returns Firestore doc ID as "id" field
    String commandId = doc["id"] | "";
    String action = doc["action"] | "";

    if (commandId.length() == 0) {
        Serial.println("[Command] Missing command id, ignoring");
        return;
    }

    // Idempotency: skip if already executed
    if (commandId == lastExecutedCommandId) {
        Serial.println("[Command] Duplicate command " + commandId + ", skipping");
        return;
    }

    bool success = false;

    if (action == "open") {
        Serial.println("[Command] OPEN valve requested");
        success = valve.open();
    } else if (action == "close") {
        Serial.println("[Command] CLOSE valve requested");
        success = valve.close();
    } else {
        Serial.println("[Command] Unknown action: " + action);
    }

    lastExecutedCommandId = commandId;

    // Acknowledge the command
    if (wifiConnected) {
        apiClient.acknowledgeCommand(commandId, success);
    }
}

// =============================================================================
// Offline data sync
// =============================================================================
void syncOfflineReadings() {
    if (!wifiConnected || !offlineStorage.hasReadings()) return;

    Serial.println("[Sync] Sending " + String(offlineStorage.count()) + " offline readings");

    int synced = 0;
    int maxSyncPerCycle = 50; // Limit per cycle to avoid long blocking

    while (offlineStorage.hasReadings() && synced < maxSyncPerCycle) {
        OfflineReading reading = offlineStorage.getNextReading();

        // Convert unix timestamp to ISO 8601 for backend
        char isoTimestamp[30];
        time_t t = (time_t)reading.unixTimestamp;
        struct tm* tm_info = gmtime(&t);
        strftime(isoTimestamp, sizeof(isoTimestamp), "%Y-%m-%dT%H:%M:%SZ", tm_info);

        bool ok = apiClient.sendReading(
            reading.pulseCount,
            reading.flowRate,
            reading.totalLitres,
            reading.totalM3,
            reading.pressure1,
            reading.pressure2,
            reading.batteryLevel,
            0.0,           // hydroVoltage not stored in offline struct
            reading.valveOpen,
            false          // was offline when captured
        );

        if (ok) {
            offlineStorage.removeNextReading();
            synced++;
        } else {
            Serial.println("[Sync] Failed to send offline reading, stopping");
            break;
        }

        yield(); // Feed watchdog
    }

    Serial.println("[Sync] Synced " + String(synced) + " readings");
}

// =============================================================================
// Main setup
// =============================================================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("============================================");
    Serial.println("  ESP32 Smart Water Meter v1.0");
    Serial.println("  Device: " + String(DEVICE_ID));
    Serial.println("  Meter:  " + String(METER_ID));
    Serial.println("============================================");

    // Configure ADC attenuation for full range (0-3.3V)
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);

    // Initialize flow sensor with interrupt
    flowSensor.begin(FLOW_SENSOR_PIN, CALIBRATION_FACTOR);
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), flowPulseISR, RISING);

    // Initialize valve (closed by default for safety)
    valve.begin(VALVE_CONTROL_PIN, VALVE_OPEN);

    // Initialize offline storage
    offlineStorage.begin();

    // Connect to WiFi
    connectWiFi();

    // Initialize API client — device key = deviceId (backend looks up meter by deviceId)
    apiClient.begin(API_BASE_URL, DEVICE_ID, DEVICE_ID);

    // Startup delay for valve safety
    Serial.println("[Startup] Valve operations paused for " + String(STARTUP_DELAY_MS / 1000) + "s");
    delay(STARTUP_DELAY_MS);
    valveStartupDelay = false;
    Serial.println("[Startup] Valve operations enabled. Default state: CLOSED");

    lastReadingTime = millis();
    lastHeartbeatTime = millis();
    lastCommandPollTime = millis();
    lastWifiReconnectTime = millis();
    lastOfflineSyncTime = millis();

    Serial.println("[Setup] Complete. Entering main loop.");
    Serial.println();
}

// =============================================================================
// Main loop
// =============================================================================
void loop() {
    unsigned long now = millis();

    // --- WiFi reconnection check ---
    if (!valveStartupDelay && (now - lastWifiReconnectTime >= WIFI_RECONNECT_MS)) {
        lastWifiReconnectTime = now;
        checkWiFi();
        if (!wifiConnected) {
            Serial.println("[WiFi] Disconnected, attempting reconnect...");
            connectWiFi();
        }
    }

    // --- Update flow sensor ---
    flowSensor.update();

    // --- Main reading interval ---
    if (now - lastReadingTime >= READING_INTERVAL_MS) {
        lastReadingTime = now;

        // Read all sensors
        lastFlowRate = flowSensor.getFlowRate();
        lastTotalLitres = flowSensor.getTotalLitres();
        lastTotalM3 = flowSensor.getTotalCubicMetres();
        lastPressure1 = readPressure1();
        lastPressure2 = readPressure2();
        lastBattery = readBatteryLevel();
        lastHydroVoltage = readHydroVoltage();

        Serial.println("[Reading] Flow: " + String(lastFlowRate, 3) + " L/min | " +
                       "Total: " + String(lastTotalLitres, 2) + " L (" +
                       String(lastTotalM3, 4) + " m3) | " +
                       "P1: " + String(lastPressure1, 1) + " kPa | " +
                       "P2: " + String(lastPressure2, 1) + " kPa | " +
                       "Batt: " + String(lastBattery) + "% | " +
                       "Hydro: " + String(lastHydroVoltage, 2) + "V | " +
                       "Valve: " + valve.getStatus());

        if (wifiConnected) {
            // Send reading to backend
            bool sent = apiClient.sendReading(
                flowSensor.getPulseCount(),
                lastFlowRate, lastTotalLitres, lastTotalM3,
                lastPressure1, lastPressure2, lastBattery,
                lastHydroVoltage, valve.isOpen(), true
            );

            if (!sent) {
                Serial.println("[Reading] Failed to send, saving offline");
                OfflineReading offline;
                offline.unixTimestamp = (uint32_t)time(nullptr);
                offline.pulseCount = flowSensor.getPulseCount();
                offline.flowRate = lastFlowRate;
                offline.totalLitres = lastTotalLitres;
                offline.totalM3 = lastTotalM3;
                offline.pressure1 = lastPressure1;
                offline.pressure2 = lastPressure2;
                offline.batteryLevel = lastBattery;
                offline.valveOpen = valve.isOpen();
                offlineStorage.saveReading(offline);
            }
        } else {
            // Offline: save to local storage
            OfflineReading offline;
            offline.unixTimestamp = (uint32_t)time(nullptr);
            offline.pulseCount = flowSensor.getPulseCount();
            offline.flowRate = lastFlowRate;
            offline.totalLitres = lastTotalLitres;
            offline.totalM3 = lastTotalM3;
            offline.pressure1 = lastPressure1;
            offline.pressure2 = lastPressure2;
            offline.batteryLevel = lastBattery;
            offline.valveOpen = valve.isOpen();
            offlineStorage.saveReading(offline);

            Serial.println("[Reading] Saved offline (" + String(offlineStorage.count()) + " stored)");
        }

        lastOnlineState = wifiConnected;
    }

    // --- Command polling interval ---
    if (wifiConnected && (now - lastCommandPollTime >= COMMAND_POLL_INTERVAL_MS)) {
        lastCommandPollTime = now;

        String command = apiClient.getPendingCommand();
        if (command.length() > 0) {
            handleValveCommand(command);
        }
    }

    // --- Heartbeat interval ---
    if (wifiConnected && (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS)) {
        lastHeartbeatTime = now;
        apiClient.sendHeartbeat(flowSensor.getPulseCount());
    }

    // --- Offline sync when WiFi reconnects ---
    if (wifiConnected && !lastOnlineState && offlineStorage.hasReadings()) {
        Serial.println("[Sync] WiFi reconnected, syncing offline data");
        syncOfflineReadings();
    }

    // Periodic offline sync attempt (every 60 seconds)
    if (wifiConnected && offlineStorage.hasReadings() && (now - lastOfflineSyncTime >= 60000)) {
        lastOfflineSyncTime = now;
        syncOfflineReadings();
    }

    // Yield to prevent watchdog reset
    yield();
}
