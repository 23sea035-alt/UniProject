import {
  pgTable,
  text,
  uuid,
  real,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { metersTable } from "./meters";

export const meterReadingsTable = pgTable("meter_readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  meterId: uuid("meter_id")
    .notNull()
    .references(() => metersTable.id),
  pulseCount: integer("pulse_count").notNull(),
  flowRate: real("flow_rate"),
  totalLitres: real("total_litres"),
  totalCubicMetres: real("total_cubic_metres"),
  pressure1: real("pressure1"),
  pressure2: real("pressure2"),
  batteryLevel: integer("battery_level"),
  hydroVoltage: real("hydro_voltage"),
  valveStatus: text("valve_status", { enum: ["open", "closed"] }),
  online: boolean("online"),
  wifiSignal: integer("wifi_signal"),
  recordedAt: timestamp("recorded_at").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

export const insertMeterReadingSchema = createInsertSchema(
  meterReadingsTable
).omit({ id: true, syncedAt: true });
export type InsertMeterReading = z.infer<typeof insertMeterReadingSchema>;
export type MeterReading = typeof meterReadingsTable.$inferSelect;
