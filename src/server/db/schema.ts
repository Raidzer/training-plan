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

import { ROLES } from "@/shared/constants";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  login: varchar("login", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default(ROLES.ATHLETE),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Europe/Moscow"),
  isActive: boolean("is_active").notNull().default(true),
  name: varchar("name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  gender: varchar("gender", { length: 16 }).notNull().default("male"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  emailVerified: timestamp("email_verified"),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: serial("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
    type: varchar("type", { length: 32 }).notNull(), // 'verify-email', 'reset-password'
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    verificationTokensIdentifierTokenIdx: uniqueIndex(
      "verification_tokens_identifier_token_idx"
    ).on(table.identifier, table.token),
  })
);

export const registrationInvites = pgTable(
  "registration_invites",
  {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    usedByUserId: integer("used_by_user_id").references(() => users.id),
    usedAt: timestamp("used_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    registrationInvitesTokenHashIdx: uniqueIndex("registration_invites_token_hash_idx").on(
      table.tokenHash
    ),
    registrationInvitesExpiresAtIdx: index("registration_invites_expires_at_idx").on(
      table.expiresAt
    ),
  })
);

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
    planEntriesUserDateIdx: index("plan_entries_user_date_idx").on(table.userId, table.date),
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

export const personalRecords = pgTable(
  "personal_records",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    distanceKey: varchar("distance_key", { length: 16 }).notNull(),
    timeText: varchar("time_text", { length: 16 }).notNull(),
    recordDate: date("record_date").notNull(),
    raceName: varchar("race_name", { length: 255 }),
    raceCity: varchar("race_city", { length: 255 }),
    protocolUrl: text("protocol_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    personalRecordsUserDistanceIdx: uniqueIndex("personal_records_user_distance_idx").on(
      table.userId,
      table.distanceKey
    ),
    personalRecordsUserIdx: index("personal_records_user_idx").on(table.userId),
  })
);

export const shoes = pgTable(
  "shoes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    shoesUserIdIdx: index("shoes_user_id_idx").on(table.userId),
  })
);

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
    weightEntriesUserDatePeriodIdx: uniqueIndex("weight_entries_user_date_period_idx").on(
      table.userId,
      table.date,
      table.period
    ),
  })
);

export const recoveryEntries = pgTable(
  "recovery_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date").notNull(),
    hasBath: boolean("has_bath").notNull().default(false),
    hasMfr: boolean("has_mfr").notNull().default(false),
    hasMassage: boolean("has_massage").notNull().default(false),
    overallScore: integer("overall_score"),
    functionalScore: integer("functional_score"),
    muscleScore: integer("muscle_score"),
    sleepHours: numeric("sleep_hours", { precision: 4, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    recoveryEntriesUserDateIdx: uniqueIndex("recovery_entries_user_date_idx").on(
      table.userId,
      table.date
    ),
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
    distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
    overallScore: integer("overall_score"),
    functionalScore: integer("functional_score"),
    muscleScore: integer("muscle_score"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workoutReportsUserPlanIdx: uniqueIndex("workout_reports_user_plan_entry_idx").on(
      table.userId,
      table.planEntryId
    ),
  })
);

export const workoutReportConditions = pgTable(
  "workout_report_conditions",
  {
    id: serial("id").primaryKey(),
    workoutReportId: integer("workout_report_id")
      .notNull()
      .references(() => workoutReports.id),
    weather: varchar("weather", { length: 255 }),
    hasWind: boolean("has_wind"),
    temperatureC: numeric("temperature_c", { precision: 5, scale: 1 }),
    surface: varchar("surface", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workoutReportConditionsReportIdx: uniqueIndex("workout_report_conditions_report_idx").on(
      table.workoutReportId
    ),
  })
);

export const workoutReportShoes = pgTable(
  "workout_report_shoes",
  {
    id: serial("id").primaryKey(),
    workoutReportId: integer("workout_report_id")
      .notNull()
      .references(() => workoutReports.id),
    shoeId: integer("shoe_id")
      .notNull()
      .references(() => shoes.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    workoutReportShoesReportIdx: index("workout_report_shoes_report_idx").on(table.workoutReportId),
    workoutReportShoesShoeIdx: index("workout_report_shoes_shoe_idx").on(table.shoeId),
    workoutReportShoesUniqueIdx: uniqueIndex("workout_report_shoes_unique_idx").on(
      table.workoutReportId,
      table.shoeId
    ),
  })
);

export const aliceAccounts = pgTable("alice_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  aliceUserId: text("alice_user_id").notNull().unique(),
  linkedAt: timestamp("linked_at").notNull().defaultNow(),
});

export const aliceLinkCodes = pgTable(
  "alice_link_codes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    code: varchar("code", { length: 16 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    aliceLinkCodesCodeIdx: uniqueIndex("alice_link_codes_code_idx").on(table.code),
  })
);

export const diaryResultTemplates = pgTable("diary_result_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }),
  matchPattern: text("match_pattern"),
  schema: jsonb("schema").notNull(),
  outputTemplate: text("output_template").notNull(),
  isInline: boolean("is_inline").notNull().default(false),
  calculations: jsonb("calculations"),
  sortOrder: integer("sort_order").notNull().default(0),
  type: varchar("type", { length: 32 }).notNull().default("common"),
  level: varchar("level", { length: 32 }).notNull().default("general"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
