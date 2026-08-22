#ifndef VALVE_H
#define VALVE_H

#include <Arduino.h>

class Valve {
public:
    void begin(uint8_t pin, bool openLevel = HIGH);
    bool open();
    bool close();
    bool isOpen();
    void emergencyClose();
    String getStatus();

private:
    uint8_t _pin;
    bool _openLevel;
    bool _isOpen = false;
};

#endif // VALVE_H
