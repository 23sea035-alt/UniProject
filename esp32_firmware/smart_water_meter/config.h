#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// WiFi credentials
// =============================================================================
#define WIFI_SSID "Dialog 4G 683"
#define WIFI_PASSWORD "BcD937EF"

// =============================================================================
// Backend API
// =============================================================================
#define API_BASE_URL "http://192.168.8.106:3000/api"
#define DEVICE_ID "ESP32-WM001"
#define METER_ID "WM-2024-COL-0042"

// =============================================================================
// Flow sensor
// =============================================================================
#define FLOW_SENSOR_PIN 2        // GPIO2 (interrupt capable)
#define CALIBRATION_FACTOR 450.0 // pulses per litre (configurable per sensor)

// =============================================================================
// Solenoid valve
// =============================================================================
#define VALVE_CONTROL_PIN 4      // GPIO4
#define VALVE_OPEN HIGH          // HIGH = open (NC valve energized = open)
#define VALVE_CLOSED LOW

// =============================================================================
// Timing (milliseconds)
// =============================================================================
#define READING_INTERVAL_MS 5000       // Send reading every 5 seconds
#define HEARTBEAT_INTERVAL_MS 30000    // Heartbeat every 30 seconds
#define COMMAND_POLL_INTERVAL_MS 10000 // Poll for commands every 10 seconds
#define WIFI_RECONNECT_MS 5000         // Reconnect every 5s if disconnected

// =============================================================================
// Offline storage
// =============================================================================
#define MAX_OFFLINE_READINGS 1000
#define STORAGE_KEY "offline_readings"

// =============================================================================
// Analog pins (adjust for your hardware)
// =============================================================================
#define PRESSURE_SENSOR_1_PIN 34   // ADC1 channel (VP)
#define PRESSURE_SENSOR_2_PIN 35   // ADC1 channel (VN)
#define BATTERY_VOLTAGE_PIN 36     // ADC1 channel (SVP)
#define HYDRO_VOLTAGE_PIN 39       // ADC1 channel (SVN)

// =============================================================================
// Voltage divider and battery constants
// =============================================================================
#define BATTERY_VOLTAGE_DIVIDER 2.0   // ratio of voltage divider
#define BATTERY_FULL_VOLTAGE 4.2      // LiPo full voltage
#define BATTERY_EMPTY_VOLTAGE 3.3     // LiPo empty voltage
#define HYDRO_VOLTAGE_DIVIDER 3.0     // ratio for hydro generator

// =============================================================================
// Pressure sensor constants (MPX5010 or similar)
// =============================================================================
#define PRESSURE_SENSOR_MIN_V 0.2    // voltage at 0 kPa
#define PRESSURE_SENSOR_MAX_V 4.8    // voltage at max kPa
#define PRESSURE_SENSOR_MAX_KPA 68.95 // max pressure in kPa

// =============================================================================
// Startup delay before valve operations (ms)
// =============================================================================
#define STARTUP_DELAY_MS 5000

#endif // CONFIG_H
