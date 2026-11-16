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

export const publicContent = sqliteTable("public_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const catalogItems = sqliteTable("catalog_items", {
  id: text("id").primaryKey(),
  service: text("service").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  condition: text("condition").notNull().default(""),
  summary: text("summary").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  status: text("status").notNull().default("Available"),
  featured: integer("featured").notNull().default(0),
  published: integer("published").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  interest: text("interest").notNull().default(""),
  market: text("market").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").notNull().default("New"),
  owner: text("owner").notNull().default(""),
  followUp: text("follow_up").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
