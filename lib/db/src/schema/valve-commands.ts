import {
  pgTable,
  text,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { metersTable } from "./meters";
import { usersTable } from "./users";

export const valveCommandsTable = pgTable("valve_commands", {
  id: uuid("id").primaryKey().defaultRandom(),
  commandId: text("command_id").notNull().unique(),
  meterId: uuid("meter_id")
    .notNull()
    .references(() => metersTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  command: text("command", { enum: ["open", "close"] }).notNull(),
  status: text("status", {
    enum: ["pending", "sent", "acknowledged", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  reason: text("reason"),
  initiatedBy: text("initiated_by"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertValveCommandSchema = createInsertSchema(
  valveCommandsTable
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertValveCommand = z.infer<typeof insertValveCommandSchema>;
export type ValveCommand = typeof valveCommandsTable.$inferSelect;
