#include "api_client.h"
#include "config.h"
#include <time.h>

void ApiClient::begin(const char* baseUrl, const char* apiKey, const char* deviceId) {
    _baseUrl = baseUrl;
    _apiKey = apiKey;
    _deviceId = deviceId;

    // Sync time via NTP for ISO 8601 timestamps
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");

    Serial.println("[ApiClient] Initialized");
    Serial.println("[ApiClient] Base URL: " + String(_baseUrl));
    Serial.println("[ApiClient] Device ID: " + String(_deviceId));
}

String ApiClient::_getISO8601Timestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return "1970-01-01T00:00:00Z";
    }
    char buf[30];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
}

bool ApiClient::sendReading(uint32_t pulseCount, float flowRate, float totalLitres, float totalM3,
                            float pressure1, float pressure2, int batteryLevel,
                            float hydroVoltage, bool valveOpen, bool online) {
    // Build JSON payload — field names match backend Zod schema
    JsonDocument doc;
    doc["deviceId"] = _deviceId;
    doc["meterId"] = METER_ID;
    doc["recordedAt"] = _getISO8601Timestamp();
    doc["pulseCount"] = pulseCount;
    doc["flowRate"] = round(flowRate * 1000.0) / 1000.0;
    doc["totalLitres"] = round(totalLitres * 1000.0) / 1000.0;
    doc["totalCubicMetres"] = round(totalM3 * 10000.0) / 10000.0;
    doc["pressure1"] = round(pressure1 * 100.0) / 100.0;
    doc["pressure2"] = round(pressure2 * 100.0) / 100.0;
    doc["batteryLevel"] = batteryLevel;
    doc["hydroVoltage"] = round(hydroVoltage * 100.0) / 100.0;
    doc["valveStatus"] = valveOpen ? "open" : "closed";
    doc["online"] = online;
    doc["type"] = "reading";

    String body;
    serializeJson(doc, body);

    Serial.println("[ApiClient] Sending reading: " + body);
    String response = _httpPost("/readings", body);

    if (response.length() > 0) {
        Serial.println("[ApiClient] Reading sent OK");
        return true;
    }
    Serial.println("[ApiClient] Failed to send reading");
    return false;
}

String ApiClient::getPendingCommand() {
    String endpoint = "/valve/pending/" + String(_deviceId);
    Serial.println("[ApiClient] Polling commands: " + endpoint);

    String response = _httpGet(endpoint);

    if (response.length() > 0) {
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, response);
        if (!err) {
            if (doc.containsKey("command") && doc["command"].is<JsonObject>()) {
                String cmdStr;
                serializeJson(doc["command"], cmdStr);
                Serial.println("[ApiClient] Pending command: " + cmdStr);
                return cmdStr;
            }
        }
    }
    return "";
}

bool ApiClient::acknowledgeCommand(String commandId, bool success) {
    JsonDocument doc;
    doc["commandId"] = commandId;
    doc["deviceId"] = _deviceId;
    doc["success"] = success;
    doc["timestamp"] = _getISO8601Timestamp();

    String body;
    serializeJson(doc, body);

    Serial.println("[ApiClient] Acknowledging command: " + body);
    String response = _httpPost("/valve/acknowledge", body);

    return response.length() > 0;
}

bool ApiClient::sendHeartbeat(uint32_t pulseCount) {
    JsonDocument doc;
    doc["deviceId"] = _deviceId;
    doc["meterId"] = METER_ID;
    doc["recordedAt"] = _getISO8601Timestamp();
    doc["pulseCount"] = pulseCount;
    doc["type"] = "heartbeat";
    doc["uptime"] = millis() / 1000;

    String body;
    serializeJson(doc, body);

    Serial.println("[ApiClient] Sending heartbeat");
    String response = _httpPost("/readings", body);

    return response.length() > 0;
}

String ApiClient::_httpPost(String endpoint, String jsonBody) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[ApiClient] WiFi not connected");
        return "";
    }

    HTTPClient http;
    String url = String(_baseUrl) + endpoint;

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", _apiKey);
    http.setTimeout(10000);

    int httpCode = http.POST(jsonBody);
    String response = "";

    if (httpCode > 0) {
        Serial.println("[ApiClient] HTTP " + String(httpCode));
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
            response = http.getString();
        }
    } else {
        Serial.println("[ApiClient] HTTP error: " + http.errorToString(httpCode));
    }

    http.end();
    return response;
}

String ApiClient::_httpGet(String endpoint) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[ApiClient] WiFi not connected");
        return "";
    }

    HTTPClient http;
    String url = String(_baseUrl) + endpoint;

    http.begin(url);
    http.addHeader("X-Device-Key", _apiKey);
    http.setTimeout(10000);

    int httpCode = http.GET();
    String response = "";

    if (httpCode > 0) {
        Serial.println("[ApiClient] HTTP " + String(httpCode));
        if (httpCode == HTTP_CODE_OK) {
            response = http.getString();
        }
    } else {
        Serial.println("[ApiClient] HTTP error: " + http.errorToString(httpCode));
    }

    http.end();
    return response;
}
