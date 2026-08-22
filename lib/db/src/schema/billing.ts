import {
  pgTable,
  text,
  uuid,
  real,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { metersTable } from "./meters";

export const billsTable = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  meterId: uuid("meter_id")
    .notNull()
    .references(() => metersTable.id),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  consumptionCubicMetres: real("consumption_cubic_metres"),
  consumptionLitres: real("consumption_litres"),
  variableCharge: real("variable_charge"),
  fixedCharge: real("fixed_charge"),
  systemLevy: real("system_levy"),
  stampDuty: real("stamp_duty"),
  totalAmount: real("total_amount"),
  status: text("status", {
    enum: ["draft", "issued", "paid", "overdue", "cancelled"],
  })
    .notNull()
    .default("draft"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;
