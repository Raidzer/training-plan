import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  date,
  numeric,
  varchar,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("athlete"),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  targetDistanceKm: numeric("target_distance_km", { precision: 6, scale: 2 }),
  targetTimeSec: integer("target_time_sec"),
  targetPace: varchar("target_pace", { length: 16 }),
  targetZone: varchar("target_zone", { length: 16 }),
  comment: text("comment"),
});

export const planImports = pgTable("plan_imports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  filename: varchar("filename", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  rowCount: integer("row_count"),
  insertedCount: integer("inserted_count"),
  skippedCount: integer("skipped_count"),
  error: text("error"),
});

export const planEntries = pgTable("plan_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  importId: integer("import_id").references(() => planImports.id),
  date: date("date").notNull(),
  sessionOrder: integer("session_order").notNull().default(1),
  taskText: text("task_text").notNull(),
  commentText: text("comment_text"),
  isWorkload: boolean("is_workload").notNull().default(false),
  rawRow: jsonb("raw_row"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
  timeSec: integer("time_sec"),
  avgHr: integer("avg_hr"),
  rpe: integer("rpe"),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
