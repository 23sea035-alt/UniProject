#ifndef OFFLINE_STORAGE_H
#define OFFLINE_STORAGE_H

#include <Arduino.h>
#include <Preferences.h>

struct OfflineReading {
    uint32_t unixTimestamp;   // Unix time (seconds since epoch) for valid backend timestamps
    uint32_t pulseCount;      // Cumulative pulse count at time of reading
    float flowRate;
    float totalLitres;
    float totalM3;
    float pressure1;
    float pressure2;
    int batteryLevel;
    bool valveOpen;
};

class OfflineStorage {
public:
    void begin();
    bool saveReading(OfflineReading reading);
    bool hasReadings();
    OfflineReading getNextReading();
    void removeNextReading();
    int count();
    void clear();

private:
    Preferences _prefs;
    int _headIndex = 0;
    int _tailIndex = 0;
    int _count = 0;

    void _loadState();
    void _saveState();
    String _readingKey(int index);
};

#endif // OFFLINE_STORAGE_H
