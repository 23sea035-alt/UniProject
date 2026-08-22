#include "valve.h"

void Valve::begin(uint8_t pin, bool openLevel) {
    _pin = pin;
    _openLevel = openLevel;
    _isOpen = false;

    pinMode(_pin, OUTPUT);
    // Ensure valve is closed on startup (NC valve — de-energize to close)
    digitalWrite(_pin, _openLevel ? LOW : HIGH);
    _isOpen = false;

    Serial.println("[Valve] Initialized on pin " + String(_pin));
    Serial.println("[Valve] Default state: CLOSED");
}

bool Valve::open() {
    Serial.println("[Valve] Opening valve...");
    digitalWrite(_pin, _openLevel);
    _isOpen = true;
    Serial.println("[Valve] State: OPEN");
    return true;
}

bool Valve::close() {
    Serial.println("[Valve] Closing valve...");
    digitalWrite(_pin, _openLevel ? LOW : HIGH);
    _isOpen = false;
    Serial.println("[Valve] State: CLOSED");
    return true;
}

bool Valve::isOpen() {
    return _isOpen;
}

void Valve::emergencyClose() {
    Serial.println("[Valve] EMERGENCY CLOSE");
    digitalWrite(_pin, _openLevel ? LOW : HIGH);
    _isOpen = false;
    Serial.println("[Valve] State: CLOSED (emergency)");
}

String Valve::getStatus() {
    return _isOpen ? "OPEN" : "CLOSED";
}
