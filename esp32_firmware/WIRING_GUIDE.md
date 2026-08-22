# ESP32 Smart Water Meter — Wiring Guide

## Components Needed

| # | Component | Description |
|---|-----------|-------------|
| 1 | ESP32 Dev Module | Main controller |
| 2 | Flow Sensor (YF-S201) | Pulse output, 450 pulses/L |
| 3 | 12V Solenoid Valve (NC) | Normally Closed, closes on power loss |
| 4 | Relay Module (5V, 1-channel) | To drive the 12V solenoid |
| 5 | MPX5010 Pressure Sensor x2 | Analog 0-5V output |
| 6 | 2x Voltage Divider (10k + 10k) | For pressure sensors (5V to 3.3V) |
| 7 | 12V to 5V Buck Converter | Power ESP32 from 12V supply |
| 8 | External 12V Power Supply | For solenoid valve |

---

## ESP32 Dev Module Pinout

```
ESP32 Dev Module
+-----------------------------+
|                             |
|  GPIO2  -------------------+--> Flow Sensor (Signal/Yellow)
|                             |
|  GPIO4  -------------------+--> Relay IN (controls solenoid)
|                             |
|  GPIO34 (VP) --[10k+10k]--+--> Pressure Sensor 1 (Output)
|  (ADC1, input only)         |
|                             |
|  GPIO35 (VN) --[10k+10k]--+--> Pressure Sensor 2 (Output)
|  (ADC1, input only)         |
|                             |
|  GPIO36 (SVP)--[10k+10k]--+--> Battery Voltage Monitor
|  (ADC1, input only)         |
|                             |
|  GPIO39 (SVN)--[10k+10k]--+--> Hydro Generator Voltage
|  (ADC1, input only)         |
|                             |
|  5V    ---------------------+--> Flow Sensor VCC (Red)
|  GND   ---------------------+--> Common Ground (ALL devices)
|  GND   ---------------------+--> Relay GND
|                             |
|  VIN/5V --------------------+--> 5V from Buck Converter
|                             |
+-----------------------------+
```

---

## Detailed Wiring

### 1. Flow Sensor (YF-S201)

```
Flow Sensor Wire    -->    ESP32
---------------------------------
Red (VCC)           -->    5V
Black (GND)         -->    GND
Yellow (Signal)     -->    GPIO2
```

### 2. Solenoid Valve (via Relay)

```
12V Supply (+)  --+---> Relay COM (Common)
                  |
Solenoid (+)    --+---> Relay NO (Normally Open)
                  |
Solenoid (-)    --+---> 12V Supply (-) / GND

ESP32 GPIO4     ----> Relay IN

Relay VCC       ----> 5V (or external 5V if relay needs it)
Relay GND       ----> GND
```

### 3. Pressure Sensors (x2) — Voltage Divider Needed

```
Pressure Sensor Output (0-5V) --> [10k] --> Junction --> ESP32 GPIO
                                                  |
                                              [10k]
                                                  |
                                                 GND

This halves 5V to 2.5V max (safe for ESP32's 3.3V ADC)

Sensor 1: Output -> Divider -> GPIO34
Sensor 2: Output -> Divider -> GPIO35

Each sensor also needs:
  VCC  --> 5V
  GND  --> GND
```

### 4. Power Supply

```
Main 12V Supply
    |
    +---> Solenoid Valve (+)
    |
    +---> 5V Buck Converter Input
              |
              +-- 5V Out  --> ESP32 VIN
              +-- GND      --> Common GND
```

---

## Ground Connection (IMPORTANT)

```
ALL grounds must be connected together:
  - ESP32 GND
  - Relay GND
  - Flow Sensor GND
  - Pressure Sensor 1 GND
  - Pressure Sensor 2 GND
  - 5V Buck Converter GND
  - 12V Supply GND
```

---

## GPIO Summary Table

| GPIO | Function | Direction | Notes |
|------|----------|-----------|-------|
| **2** | Flow Sensor | Input (INT) | Interrupt capable, pulse counting |
| **4** | Solenoid Valve | Output | Controls relay via HIGH/LOW |
| **34** | Pressure Sensor 1 | Input (ADC) | VP pin, 0-3.3V after divider |
| **35** | Pressure Sensor 2 | Input (ADC) | VN pin, 0-3.3V after divider |
| **36** | Battery Monitor | Input (ADC) | SVP pin, voltage divider 2:1 |
| **39** | Hydro Generator | Input (ADC) | SVN pin, voltage divider 3:1 |

---

## Firmware Config (config.h)

```c
#define FLOW_SENSOR_PIN 2
#define CALIBRATION_FACTOR 450.0   // pulses per litre
#define VALVE_CONTROL_PIN 4
#define PRESSURE_SENSOR_1_PIN 34
#define PRESSURE_SENSOR_2_PIN 35
#define BATTERY_VOLTAGE_PIN 36
#define HYDRO_VOLTAGE_PIN 39
#define BATTERY_VOLTAGE_DIVIDER 2.0
#define HYDRO_VOLTAGE_DIVIDER 3.0
```

---

## Safety Notes

- **Never power the solenoid directly from ESP32** — it draws too much current. Always use a relay or MOSFET driver
- **Voltage dividers are mandatory** for pressure sensors — ESP32 ADC max is 3.3V, sensors output 5V
- **NC (Normally Closed) valve** = valve opens only when powered. If ESP32 dies, valve closes automatically (safe default)
- **Common ground** — all GND pins must connect together or readings will be wrong
- **ADC1 only** — GPIO34, 35, 36, 39 are ADC1 pins and work while WiFi is active. Do NOT use ADC2 pins (GPIO0, 2, 4, 12-15, 25-27) for analog reads with WiFi enabled
