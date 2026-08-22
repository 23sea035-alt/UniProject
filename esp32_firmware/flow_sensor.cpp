#include "flow_sensor.h"

void FlowSensor::begin(uint8_t pin, float calibrationFactor) {
    _pin = pin;
    _calibrationFactor = calibrationFactor;
    _pulseCount = 0;
    _lastPulseCount = 0;
    _flowRate = 0.0;
    _totalLitres = 0.0;
    _lastCalcTime = millis();
    _lastPulseTime = 0;

    pinMode(_pin, INPUT_PULLUP);

    Serial.println("[FlowSensor] Initialized on pin " + String(_pin));
    Serial.println("[FlowSensor] Calibration: " + String(_calibrationFactor) + " pulses/L");
}

void IRAM_ATTR FlowSensor::pulseISR() {
    unsigned long now = micros();
    if (now - _lastPulseTime > 50000) { // 50ms debounce in microseconds
        _pulseCount++;
        _lastPulseTime = now;
    }
}

void FlowSensor::update() {
    unsigned long now = millis();
    unsigned long elapsed = now - _lastCalcTime;

    // Calculate flow rate every second at minimum
    if (elapsed >= 1000) {
        uint32_t currentPulses = _pulseCount;
        uint32_t deltaPulses = currentPulses - _lastPulseCount;

        // Flow rate in litres per minute
        float elapsedMinutes = (float)elapsed / 60000.0;
        _flowRate = (float)deltaPulses / _calibrationFactor / elapsedMinutes;

        // Clamp to reasonable range (0 - 100 L/min for typical residential meter)
        if (_flowRate < 0.0) _flowRate = 0.0;
        if (_flowRate > 100.0) _flowRate = 0.0; // sensor error if >100 L/min

        // Update cumulative total
        _totalLitres = (float)currentPulses / _calibrationFactor;

        _lastPulseCount = currentPulses;
        _lastCalcTime = now;
    }
}

float FlowSensor::getFlowRate() {
    return _flowRate;
}

float FlowSensor::getTotalLitres() {
    return _totalLitres;
}

float FlowSensor::getTotalCubicMetres() {
    return _totalLitres / 1000.0;
}

uint32_t FlowSensor::getPulseCount() {
    return _pulseCount;
}

void FlowSensor::resetTotal() {
    _pulseCount = 0;
    _lastPulseCount = 0;
    _totalLitres = 0.0;
    _flowRate = 0.0;
    Serial.println("[FlowSensor] Totals reset");
}
