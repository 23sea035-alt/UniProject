# ESP32 Smart Water Meter — MASTER WIRING DIAGRAM & PINOUTS

> Generated from `config.h` + `smart_water_meter.ino` + `valve.cpp` + `flow_sensor.cpp`
> Board: **ESP32 Dev Module (DOIT DevKit V1, 30-pin)**

---

## 1. SYSTEM BLOCK DIAGRAM

```
                         +---------------------+
                         |   12V DC SUPPLY     |
                         |   (2A minimum)      |
                         +----+-----------+----+
                              |           |
              12V (+) --------+           +-------- 12V (-) == COMMON GND
                              |                          ^
                              v                          |
                    +---------+----------+               |
                    |  BUCK CONVERTER    |               |
                    |  12V -> 5V (3A)    |               |
                    +----+----------+---+               |
                         |          |                   |
                     5V OUT     GND ---------------------+
                         |
        +----------------+-------------------------------+
        |                |                |              |
        v                v                v              v
   +---------+     +-----------+    +----------+   +-----------+
   | ESP32   |     | RELAY VCC |    | FLOW SNS |   | PRESS x2  |
   | VIN     |     | (5V)      |    | VCC(RED) |   | VCC       |
   +---------+     +-----------+    +----------+   +-----------+

 SIGNAL PATHS:
   YF-S201 Yellow -----> ESP32 GPIO2   (pulse interrupt)
   ESP32 GPIO4 --------> Relay IN ----> Solenoid Valve (12V)
   Pressure 1 out -----> [divider] ---> ESP32 GPIO34
   Pressure 2 out -----> [divider] ---> ESP32 GPIO35
   Battery + ----------> [divider] ---> ESP32 GPIO36
   Hydro generator ----> [divider] ---> ESP32 GPIO39
```

---

## 2. COMPONENTS LIST

| # | Component | Qty | Purpose |
|---|-----------|-----|---------|
| 1 | ESP32 DevKit V1 (30-pin) | 1 | Main controller + WiFi |
| 2 | YF-S201 water flow sensor | 1 | Flow rate / total volume (450 pulses/L) |
| 3 | 5V 1-channel relay module | 1 | Drives 12V solenoid from ESP32 |
| 4 | 12V solenoid valve, N.C. | 1 | Shuts water off (closes when unpowered) |
| 5 | MPX5010 pressure sensor | 2 | Pipe pressure (inlet/outlet), 0–10 kPa |
| 6 | Resistor 10kΩ | 8 | Voltage dividers (4 dividers × 2 resistors) |
| 7 | Buck converter 12V→5V (≥3A) | 1 | Powers ESP32 + sensors |
| 8 | 12V DC power supply ≥2A | 1 | Main power |
| 9 | LiPo battery (optional) | 1 | Battery monitor input (max 8.4V) |

---

## 3. ESP32 DEVKIT V1 — FULL PINOUT (30-PIN)

```
                 ESP32 DevKit V1 (top view, USB at bottom)

            LEFT SIDE                    RIGHT SIDE
        +------------------+          +------------------+
        |  EN          [1] |          | [30] D23         |
        |  VP  (GPIO36)[2] |<=========| [29] D22         |
        |  VN  (GPIO39)[3] |<=========| [28] TX0 (GPIO1) |
        |  D34         [4] |<=========| [27] RX0 (GPIO3) |
        |  D35         [5] |<=========| [26] D21 (SDA)   |
        |  D32         [6] |          | [25] D19 (MISO)  |
        |  D33         [7] |          | [24] D18 (SCK)   |
        |  D25         [8] |          | [23] D5  (CS)    |
        |  D26         [9] |          | [22] TX2 (GPIO17)|
        |  D27        [10] |          | [21] RX2 (GPIO16)|
        |  D14        [11] |          | [20] D4  <=======|--> Relay IN
        |  D12        [12] |          | [19] D2  <=======|--> Flow SIG
        |  D13        [13] |          | [18] D15         |
        |  GND        [14] |=====+    | [17] GND     ====+== COMMON GND
        |  VIN        [15] |<====+    | [16] 3V3         |
        +------------------+     |    +------------------+
                                 |
                        5V from Buck Converter
        (<=====> = wires used by this project)
```

### Pins USED by this project

| GPIO | Physical Pin | Direction | Connected To | Type |
|------|-------------|-----------|--------------|------|
| **GPIO2** | Right #19 | Input (INT, RISING) | YF-S201 yellow signal wire | Digital pulse |
| **GPIO4** | Right #20 | Output | Relay module IN | Digital HIGH/LOW |
| **GPIO34** | Left #4 | Analog input (ADC1_CH6) | Pressure sensor 1 via divider | 0–2.5V analog |
| **GPIO35** | Left #5 | Analog input (ADC1_CH7) | Pressure sensor 2 via divider | 0–2.5V analog |
| **GPIO36 (VP)** | Left #2 | Analog input (ADC1_CH0) | Battery via ÷2 divider | 0–4.2V analog |
| **GPIO39 (VN)** | Left #3 | Analog input (ADC1_CH3) | Hydro generator via ÷3 divider | 0–9.9V analog |
| **VIN** | Left #15 | Power in | 5V from buck converter | 5V |
| **GND** | Left #14 / Right #17 | Ground | COMMON GND bus | — |

### Pins intentionally NOT used (and why)

| Pin | Reason |
|-----|--------|
| GPIO0, 2*, 4*, 12–15, 25–27 | ADC2 pins — unusable for analog while WiFi is ON. (*GPIO2/GPIO4 here are digital only, so OK) |
| GPIO6–11 | Connected to internal flash — never use |
| GPIO34/35/36/39 | Input-only, no pull-ups — perfect for ADC here |

---

## 4. PER-COMPONENT WIRING

### 4.1 Flow Sensor — YF-S201 (3 wires)

```
  YF-S201 WIRE        COLOR      ESP32 PIN
  -------------------------------------------------
  VCC (5-18V)         RED    --> 5V rail (buck output)
  GND                 BLACK  --> GND bus
  Signal (pulse)      YELLOW --> GPIO2  (pin right #19)

  Note: 450 pulses = 1 litre. ISR counts RISING edges.
```

### 4.2 Solenoid Valve + Relay (12V NC valve)

```
  RELAY MODULE (5V, 1-ch)                  ESP32
  -----------------------------------------------
  VCC          --> 5V rail
  GND          --> GND bus
  IN           <-- GPIO4 (right pin #20)

  RELAY CONTACT SIDE (screw terminals)     POWER/VALVE
  ---------------------------------------------------------
  COM  <-- 12V supply (+)
  NO   --> Solenoid valve wire A
  (NC left unconnected)

  SOLENOID VALVE (2 wires):
  Wire A  --> Relay NO
  Wire B  --> 12V supply (-) / GND bus

  Logic: GPIO4 HIGH = relay energized = NO closes = VALVE OPEN
         GPIO4 LOW  = relay off = valve CLOSED (fail-safe)
```

### 4.3 Pressure Sensor 1 — MPX5010 (inlet)

```
  MPX5010 PIN          CONNECTION
  --------------------------------------------------
  Pin 1 (N/C mark)     not connected
  Pin 2 (+Vs)          5V rail
  Pin 3 (GND)          GND bus
  Pin 4 (Vout)         ---[R1 10k]---+--- GPIO34 (left #4)
                                     |
                                 [R2 10k]
                                     |
                                    GND

  Divider math: 5.0V max -> 2.5V at GPIO (safe for 3.3V ADC)
```

### 4.4 Pressure Sensor 2 — MPX5010 (outlet)

Identical to 4.3, except:

```
  Pin 4 (Vout) ---[10k]---+--- GPIO35 (left #5)
                           |
                        [10k]
                           |
                          GND
```

### 4.5 Battery Monitor (optional LiPo, 3.3–8.4V)

```
  BATTERY (+) ---[10k]---+--- GPIO36 / VP (left #2)
                         |
                     [10k]
                         |
                        GND

  Divider ratio 2:1 -> 8.4V max reads as 4.2V.
  Firmware: BATTERY_VOLTAGE_DIVIDER = 2.0
  Map: 3.3V (0%) ... 4.2V (100%)
```

### 4.6 Hydro Generator Monitor

```
  HYDRO GEN (+) ---[20k]---+--- GPIO39 / VN (left #3)
                            |
                        [10k]
                            |
                           GND

  Divider ratio 3:1 (e.g. 20k top / 10k bottom).
  Firmware: HYDRO_VOLTAGE_DIVIDER = 3.0
```

---

## 5. POWER DISTRIBUTION TREE

```
 12V SUPPLY (+) ----+---------------------------> Relay COM
                    |                                   |
                    +---> Buck IN (+)                   v
                    |     Buck IN (-) ---> GND      SOLLENOID A
                    |                                  (valve B -> GND)
                    |     Buck OUT 5V --+--> ESP32 VIN
                    |                   +--> Relay VCC
                    |                   +--> YF-S201 RED
                    |                   +--> MPX5010 #1 pin2
                    |                   +--> MPX5010 #2 pin2
                    |
 12V SUPPLY (-) ----+========== COMMON GND BUS ==========
                    (ESP32 GND, relay GND, flow GND,
                     both MPX5010 GND, all divider bottoms,
                     buck GND, solenoid return)
```

---

## 6. ONE-PAGE MASTER DIAGRAM (everything)

```
                                12V DC INPUT
                               +------------+
                               | 12V    GND |
                               +--+------+--+
                                  |      |
              +-------------------+      +----------------------------------+
              |                          |                                  |
              v                          v                                  |
      +--------------+            +-------------+                             |
      | BUCK 12V->5V |            | RELAY MODULE|                             |
      | IN+ IN- OUT- |            | VCC GND IN  |                             |
      +--+---+---+---+            +--+---+---+--+                             |
         |   |   |                  |   |   |                                |
         |   |   +-> GND BUS -------+   |   |                                |
         |   |                      |   |   +<- GPIO4 (ESP32 right #20)      |
         |   +-> 5V RAIL            |   |                                    |
         |        |                 |   |                                    |
         |        +-> ESP32 VIN     |   |  COM <---- 12V (+) ================+
         |        +-> RELAY VCC     |   |  NO  ----> SOLLENOID A
         |        +-> FLOW RED      |   |  SOLLENOID B -------------> GND BUS
         |        +-> P1 pin2       |   |
         |        +-> P2 pin2       |   |
         |                          |   |
+--------v----------+               |   |
|      ESP32        |               |   |
|  DEVKIT V1        |               |   |
|                   |               |   |
| VIN  GND          |               |   |
|  ^     |          |               |   |
|  |     v          |               |   |
|  |  GND BUS <-----+---------------+---+---- ALL GROUNDS JOIN HERE
|  |                |
| GPIO2 <-----------+---- YF-S201 YELLOW
|                   +---- YF-S201 BLACK -> GND BUS
|                   |
| GPIO34 <---[10k]--+---[10k]---+ <--- MPX5010 #1 VOUT (pin4)
|             R1    |    R2     |
|                   |          (junction = GPIO34)
| GPIO35 <---[10k]--+---[10k]---+ <--- MPX5010 #2 VOUT (pin4)
|                   |
| GPIO36 <---[10k]--+---[10k]---+ <--- BATTERY +
|                   |           (bottom R -> GND)
| GPIO39 <---[20k]--+---[10k]---+ <--- HYDRO GEN +
|                   |           (bottom R -> GND)
+-------------------+
```

---

## 7. COMPLETE NETLIST (every connection)

| Net | From | To |
|-----|------|----|
| +12V | Supply (+) | Buck IN+, Relay COM |
| 5V | Buck OUT | ESP32 VIN, Relay VCC, YF-S201 red, MPX5010#1 pin2, MPX5010#2 pin2 |
| GND | Everything | Supply (−), Buck −, ESP32 GND×2, Relay GND, YF-S201 black, MPX5010 GNDs, all divider bottom resistors, solenoid wire B |
| SIG_FLOW | YF-S201 yellow | ESP32 GPIO2 |
| SIG_VALVE | ESP32 GPIO4 | Relay IN |
| SW_P1 | MPX5010#1 pin4 | 10k→GPIO34, 10k→GND |
| SW_P2 | MPX5010#2 pin4 | 10k→GPIO35, 10k→GND |
| VBATT | Battery + | 10k→GPIO36, 10k→GND |
| VHYDRO | Hydro gen + | 20k→GPIO39, 10k→GND |

---

## 8. SAFETY & GOTCHAS

1. **COMMON GROUND IS MANDATORY** — every GND above joins on one bus. Floating grounds = garbage ADC readings.
2. **Never drive the solenoid from a GPIO** — 12V solenoid draws ~500mA+. Relay (or MOSFET) only.
3. **Voltage dividers are mandatory** on GPIO34/35/36/39 — ESP32 ADC absolute max is 3.3V.
4. **ADC1 only for analog** (GPIO32–39) — ADC2 pins stop working while WiFi is active. This design already complies.
5. **GPIO2 is a boot-strapping pin** — the YF-S201 signal on GPIO2 can block flashing if it pulses during boot. If upload fails, disconnect the yellow wire while flashing.
6. **NC valve fail-safe** — power loss ⇒ valve closes automatically. Do not swap for a NO valve.
7. **Buck converter must supply ≥3A** — ESP32 WiFi bursts (~500mA) + sensors + relay coil.
8. **Known firmware note:** `readPressure1/2()` in `smart_water_meter.ino` converts ADC volts straight to kPa using `PRESSURE_SENSOR_MAX_V = 4.8`, but the divider halves the sensor output to ≤2.5V at the pin. Multiply measured voltage by 2 before the kPa formula (or set MAX_V to 2.4) or pressure readings will cap low.

---

## 9. QUICK BUILD CHECKLIST

- [ ] Buck converter set to exactly 5.0V **before** connecting ESP32
- [ ] All grounds tied to single bus
- [ ] Dividers soldered: verify junction voltages with multimeter (<3.3V)
- [ ] Relay jumper set to high-level trigger matching GPIO4 logic
- [ ] Valve wired through NO contact
- [ ] Flash firmware (`smart_water_meter/smart_water_meter.ino`), then reconnect GPIO2 yellow wire
- [ ] Serial monitor @115200 — verify `[Reading]` line shows sensible values
