import {
  pgTable,
  text,
  uuid,
  real,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tariffsTable = pgTable("tariffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  tierName: text("tier_name").notNull(),
  minUnits: real("min_units").notNull(),
  maxUnits: real("max_units"),
  ratePerUnit: real("rate_per_unit").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTariffSchema = createInsertSchema(tariffsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTariff = z.infer<typeof insertTariffSchema>;
export type Tariff = typeof tariffsTable.$inferSelect;

export const systemConfigTable = pgTable("system_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSystemConfigSchema = createInsertSchema(
  systemConfigTable
).omit({ id: true, updatedAt: true });
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfigTable.$inferSelect;
