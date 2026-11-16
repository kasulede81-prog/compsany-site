import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  service: text("service").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Idea"),
  owner: text("owner").notNull().default(""),
  market: text("market").notNull().default("Both"),
  notes: text("notes").notNull().default(""),
  pricing: text("pricing").notNull().default(""),
  technicalLink: text("technical_link").notNull().default(""),
  customerFollowUp: text("customer_follow_up").notNull().default(""),
  readiness: text("readiness").notNull().default("Not started"),
  nextAction: text("next_action").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  updatedAt: integer("updated_at").notNull(),
});

export const serviceProfiles = sqliteTable("service_profiles", {
  service: text("service").primaryKey(),
  status: text("status").notNull().default("Planning"),
  owner: text("owner").notNull().default(""),
  notes: text("notes").notNull().default(""),
  pricing: text("pricing").notNull().default(""),
  technicalLink: text("technical_link").notNull().default(""),
  customerFollowUp: text("customer_follow_up").notNull().default(""),
  readiness: text("readiness").notNull().default("Not started"),
  updatedAt: integer("updated_at").notNull(),
});
