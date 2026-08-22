#ifndef FLOW_SENSOR_H
#define FLOW_SENSOR_H

#include <Arduino.h>

class FlowSensor {
public:
    void begin(uint8_t pin, float calibrationFactor);
    void IRAM_ATTR pulseISR();
    void update();
    float getFlowRate();
    float getTotalLitres();
    float getTotalCubicMetres();
    uint32_t getPulseCount();
    void resetTotal();

private:
    volatile uint32_t _pulseCount = 0;
    uint32_t _lastPulseCount = 0;
    float _flowRate = 0.0;
    float _totalLitres = 0.0;
    float _calibrationFactor = 450.0;
    uint8_t _pin;
    unsigned long _lastCalcTime = 0;
    unsigned long _lastPulseTime = 0;
};

#endif // FLOW_SENSOR_H
