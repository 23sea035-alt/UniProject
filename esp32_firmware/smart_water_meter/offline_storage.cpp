#include "offline_storage.h"
#include "config.h"

void OfflineStorage::begin() {
    _prefs.begin("watermeter", false);
    _loadState();
    Serial.println("[OfflineStorage] Initialized, " + String(_count) + " readings stored");
}

void OfflineStorage::_loadState() {
    _headIndex = _prefs.getInt("head", 0);
    _tailIndex = _prefs.getInt("tail", 0);
    _count = _prefs.getInt("count", 0);
}

void OfflineStorage::_saveState() {
    _prefs.putInt("head", _headIndex);
    _prefs.putInt("tail", _tailIndex);
    _prefs.putInt("count", _count);
}

String OfflineStorage::_readingKey(int index) {
    return "rd_" + String(index);
}

bool OfflineStorage::saveReading(OfflineReading reading) {
    if (_count >= MAX_OFFLINE_READINGS) {
        Serial.println("[OfflineStorage] Storage full, dropping oldest reading");
        removeNextReading();
    }

    // Serialize reading into a byte buffer
    uint8_t buffer[sizeof(OfflineReading)];
    memcpy(buffer, &reading, sizeof(OfflineReading));

    String key = _readingKey(_headIndex);
    _prefs.putBytes(key.c_str(), buffer, sizeof(OfflineReading));

    _headIndex = (_headIndex + 1) % MAX_OFFLINE_READINGS;
    _count++;
    _saveState();

    Serial.println("[OfflineStorage] Saved reading #" + String(_count) + " (key: " + key + ")");
    return true;
}

bool OfflineStorage::hasReadings() {
    return _count > 0;
}

OfflineReading OfflineStorage::getNextReading() {
    OfflineReading reading = {0, 0, 0, 0, 0, 0, 0, 0, false};

    if (_count == 0) {
        Serial.println("[OfflineStorage] No readings to retrieve");
        return reading;
    }

    String key = _readingKey(_tailIndex);
    uint8_t buffer[sizeof(OfflineReading)];

    size_t bytesRead = _prefs.getBytes(key.c_str(), buffer, sizeof(OfflineReading));
    if (bytesRead == sizeof(OfflineReading)) {
        memcpy(&reading, buffer, sizeof(OfflineReading));
    } else {
        Serial.println("[OfflineStorage] Failed to read key: " + key);
    }

    return reading;
}

void OfflineStorage::removeNextReading() {
    if (_count == 0) return;

    String key = _readingKey(_tailIndex);
    _prefs.remove(key.c_str());

    _tailIndex = (_tailIndex + 1) % MAX_OFFLINE_READINGS;
    _count--;
    _saveState();

    Serial.println("[OfflineStorage] Removed reading, " + String(_count) + " remaining");
}

int OfflineStorage::count() {
    return _count;
}

void OfflineStorage::clear() {
    // Remove all stored reading keys
    for (int i = 0; i < MAX_OFFLINE_READINGS; i++) {
        String key = _readingKey(i);
        _prefs.remove(key.c_str());
    }
    _headIndex = 0;
    _tailIndex = 0;
    _count = 0;
    _saveState();
    Serial.println("[OfflineStorage] Cleared all readings");
}
