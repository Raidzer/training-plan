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
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("athlete"), // athlete|coach|admin
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

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  hrRest: integer("hr_rest"),
  hrv: integer("hrv"),
  sleepH: numeric("sleep_h", { precision: 4, scale: 2 }),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  soreness: integer("soreness"),
  mood: integer("mood"),
});

export const shoes = pgTable("shoes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 128 }).notNull(),
  startKm: numeric("start_km", { precision: 6, scale: 2 }).default("0"),
  retired: boolean("retired").notNull().default(false),
});
