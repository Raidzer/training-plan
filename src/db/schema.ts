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
  bigint,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  login: varchar("login", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("athlete"),
  name: varchar("name", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  nextResendAt: timestamp("next_resend_at").notNull(),
  consumedAt: timestamp("consumed_at"),
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

export const planEntries = pgTable(
  "plan_entries",
  {
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
  },
  (table) => ({
    planEntriesUserDateIdx: index("plan_entries_user_date_idx").on(
      table.userId,
      table.date
    ),
  })
);

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

export const telegramLinkCodes = pgTable("telegram_link_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const telegramAccounts = pgTable("telegram_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  chatId: bigint("chat_id", { mode: "number" }).notNull().unique(),
  username: varchar("username", { length: 64 }),
  firstName: varchar("first_name", { length: 128 }),
  linkedAt: timestamp("linked_at").notNull().defaultNow(),
});

export const telegramSubscriptions = pgTable("telegram_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  timezone: varchar("timezone", { length: 64 }),
  sendTime: varchar("send_time", { length: 5 }),
  enabled: boolean("enabled").notNull().default(false),
  lastSentOn: date("last_sent_on"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date").notNull(),
    period: varchar("period", { length: 16 }).notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    weightEntriesUserDatePeriodIdx: uniqueIndex(
      "weight_entries_user_date_period_idx"
    ).on(table.userId, table.date, table.period),
  })
);

export const workoutReports = pgTable(
  "workout_reports",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    planEntryId: integer("plan_entry_id")
      .notNull()
      .references(() => planEntries.id),
    date: date("date").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    resultText: text("result_text").notNull(),
    commentText: text("comment_text"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workoutReportsUserPlanIdx: uniqueIndex(
      "workout_reports_user_plan_entry_idx"
    ).on(table.userId, table.planEntryId),
  })
);
