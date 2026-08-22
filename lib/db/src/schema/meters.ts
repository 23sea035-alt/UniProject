import {
  pgTable,
  text,
  uuid,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const metersTable = pgTable("meters", {
  id: uuid("id").primaryKey().defaultRandom(),
  meterId: text("meter_id").notNull().unique(),
  deviceId: text("device_id").notNull().unique(),
  userId: uuid("user_id").references(() => usersTable.id),
  calibrationFactor: real("calibration_factor").notNull().default(450.0),
  firmwareVersion: text("firmware_version"),
  installedAt: timestamp("installed_at"),
  lastSeen: timestamp("last_seen"),
  status: text("status", { enum: ["active", "inactive", "maintenance"] })
    .notNull()
    .default("active"),
});

export const insertMeterSchema = createInsertSchema(metersTable).omit({
  id: true,
  lastSeen: true,
});
export type InsertMeter = z.infer<typeof insertMeterSchema>;
export type Meter = typeof metersTable.$inferSelect;
