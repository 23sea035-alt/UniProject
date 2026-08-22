#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class ApiClient {
public:
    void begin(const char* baseUrl, const char* apiKey, const char* deviceId);

    // POST /readings - send meter reading
    bool sendReading(uint32_t pulseCount, float flowRate, float totalLitres, float totalM3,
                     float pressure1, float pressure2, int batteryLevel,
                     float hydroVoltage, bool valveOpen, bool online);

    // GET /valve/pending/:deviceId - poll for valve commands
    String getPendingCommand();

    // POST /valve/acknowledge - confirm command execution
    bool acknowledgeCommand(String commandId, bool success);

    // POST /readings (heartbeat type) - send heartbeat
    bool sendHeartbeat(uint32_t pulseCount);

private:
    const char* _baseUrl;
    const char* _apiKey;
    const char* _deviceId;

    String _httpPost(String endpoint, String jsonBody);
    String _httpGet(String endpoint);
    String _getISO8601Timestamp();
};

#endif // API_CLIENT_H
