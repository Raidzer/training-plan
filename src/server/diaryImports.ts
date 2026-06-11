import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { planEntries, recoveryEntries, weightEntries, workoutReports } from "@/server/db/schema";
import {
  parseDiaryWorkbook,
  type DiaryImportIssue,
  type ParsedDiaryImportRow,
} from "@/server/diaryImportParser";

export type DiaryImportResult = {
  sheetName: string;
  parsedRows: number;
  matchedRows: number;
  reportsUpserted: number;
  reportsSkipped: number;
  weightEntriesUpserted: number;
  recoveryEntriesUpserted: number;
  skippedRows: number;
  errors: DiaryImportIssue[];
  warnings: DiaryImportIssue[];
};

type PlanEntryMatch = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
};

type ImportAccumulator = {
  matchedRows: number;
  reportsUpserted: number;
  reportsSkipped: number;
  weightEntriesUpserted: number;
  recoveryEntriesUpserted: number;
  skippedRows: number;
  warnings: DiaryImportIssue[];
};

type DiaryImportTransaction = Pick<typeof db, "insert">;

const formatDecimal = (value: number, digits: number) => {
  return (Math.round(value * 10 ** digits) / 10 ** digits).toFixed(digits);
};

const hasWorkoutReportPayload = (row: ParsedDiaryImportRow) => {
  const hasScore =
    row.overallScore !== null || row.functionalScore !== null || row.muscleScore !== null;

  return Boolean(
    row.resultText.trim() || row.commentText?.trim() || row.distanceKm !== null || hasScore
  );
};

const hasRecoveryPayload = (row: ParsedDiaryImportRow) => {
  return row.sleepHours !== null || row.hasBath || row.hasMfr || row.hasMassage;
};

const hasWeightPayload = (row: ParsedDiaryImportRow) => {
  return row.morningWeightKg !== null || row.eveningWeightKg !== null;
};

const buildPlanEntryMap = (entries: PlanEntryMatch[]) => {
  const planEntryMap = new Map<string, PlanEntryMatch[]>();
  for (const entry of entries) {
    const dayEntries = planEntryMap.get(entry.date);
    if (!dayEntries) {
      planEntryMap.set(entry.date, [entry]);
    } else {
      dayEntries.push(entry);
    }
  }
  return planEntryMap;
};

const getMatchedPlanEntry = (params: {
  row: ParsedDiaryImportRow;
  planEntryMap: Map<string, PlanEntryMatch[]>;
}) => {
  const dayEntries = params.planEntryMap.get(params.row.date) ?? [];
  if (dayEntries.length === 0) {
    return null;
  }

  return dayEntries.find((entry) => entry.sessionOrder === params.row.sessionOrder) ?? null;
};

const insertWorkoutReportFromDiary = async (params: {
  tx: DiaryImportTransaction;
  userId: number;
  planEntryId: number;
  row: ParsedDiaryImportRow;
}) => {
  const now = new Date();
  const distanceKm =
    params.row.distanceKm === null ? null : formatDecimal(params.row.distanceKm, 2);
  const commentText = params.row.commentText?.trim() ? params.row.commentText.trim() : null;

  await params.tx
    .insert(workoutReports)
    .values({
      userId: params.userId,
      planEntryId: params.planEntryId,
      date: params.row.date,
      startTime: params.row.startTime,
      resultText: params.row.resultText.trim() || "-",
      commentText,
      distanceKm,
      overallScore: params.row.overallScore,
      functionalScore: params.row.functionalScore,
      muscleScore: params.row.muscleScore,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [workoutReports.userId, workoutReports.planEntryId],
    });
};

const upsertWeightFromDiary = async (params: {
  tx: DiaryImportTransaction;
  userId: number;
  row: ParsedDiaryImportRow;
}) => {
  const now = new Date();
  const weights: Array<{ period: "morning" | "evening"; weightKg: number }> = [];
  if (params.row.morningWeightKg !== null) {
    weights.push({ period: "morning", weightKg: params.row.morningWeightKg });
  }
  if (params.row.eveningWeightKg !== null) {
    weights.push({ period: "evening", weightKg: params.row.eveningWeightKg });
  }

  for (const weight of weights) {
    const weightText = formatDecimal(weight.weightKg, 1);
    await params.tx
      .insert(weightEntries)
      .values({
        userId: params.userId,
        date: params.row.date,
        period: weight.period,
        weightKg: weightText,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [weightEntries.userId, weightEntries.date, weightEntries.period],
        set: {
          weightKg: weightText,
          updatedAt: now,
        },
      });
  }

  return weights.length;
};

const upsertRecoveryFromDiary = async (params: {
  tx: DiaryImportTransaction;
  userId: number;
  row: ParsedDiaryImportRow;
}) => {
  const now = new Date();
  const sleepHours = params.row.sleepHours === null ? null : String(params.row.sleepHours);
  const recoverySet: {
    hasBath: boolean;
    hasMfr: boolean;
    hasMassage: boolean;
    updatedAt: Date;
    sleepHours?: string | null;
  } = {
    hasBath: params.row.hasBath,
    hasMfr: params.row.hasMfr,
    hasMassage: params.row.hasMassage,
    updatedAt: now,
  };
  if (params.row.sleepHours !== null) {
    recoverySet.sleepHours = sleepHours;
  }

  await params.tx
    .insert(recoveryEntries)
    .values({
      userId: params.userId,
      date: params.row.date,
      hasBath: params.row.hasBath,
      hasMfr: params.row.hasMfr,
      hasMassage: params.row.hasMassage,
      sleepHours,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [recoveryEntries.userId, recoveryEntries.date],
      set: recoverySet,
    });
};

const importMatchedRows = async (params: {
  tx: DiaryImportTransaction;
  userId: number;
  rows: ParsedDiaryImportRow[];
  planEntryMap: Map<string, PlanEntryMatch[]>;
  existingFilledDates: Set<string>;
  initialWarnings: DiaryImportIssue[];
}) => {
  const accumulator: ImportAccumulator = {
    matchedRows: 0,
    reportsUpserted: 0,
    reportsSkipped: 0,
    weightEntriesUpserted: 0,
    recoveryEntriesUpserted: 0,
    skippedRows: 0,
    warnings: [...params.initialWarnings],
  };

  for (const row of params.rows) {
    const matchedPlanEntry = getMatchedPlanEntry({ row, planEntryMap: params.planEntryMap });
    if (!matchedPlanEntry) {
      accumulator.skippedRows += 1;
      accumulator.warnings.push({
        row: row.rowNumber,
        message: `Не найдена тренировка плана для даты ${row.date} и порядка ${row.sessionOrder}.`,
      });
      continue;
    }

    if (params.existingFilledDates.has(row.date)) {
      accumulator.skippedRows += 1;
      if (hasWorkoutReportPayload(row)) {
        accumulator.reportsSkipped += 1;
      }
      accumulator.warnings.push({
        row: row.rowNumber,
        message: `День ${row.date} уже заполнен, импорт строки пропущен.`,
      });
      continue;
    }

    accumulator.matchedRows += 1;
    if (hasWorkoutReportPayload(row)) {
      await insertWorkoutReportFromDiary({
        tx: params.tx,
        userId: params.userId,
        planEntryId: matchedPlanEntry.id,
        row,
      });
      accumulator.reportsUpserted += 1;
    }
    if (hasWeightPayload(row)) {
      accumulator.weightEntriesUpserted += await upsertWeightFromDiary({
        tx: params.tx,
        userId: params.userId,
        row,
      });
    }
    if (hasRecoveryPayload(row)) {
      await upsertRecoveryFromDiary({
        tx: params.tx,
        userId: params.userId,
        row,
      });
      accumulator.recoveryEntriesUpserted += 1;
    }
  }

  return accumulator;
};

const getExistingFilledDates = async (params: { userId: number; dates: string[] }) => {
  if (params.dates.length === 0) {
    return new Set<string>();
  }

  const existingReportRows = await db
    .select({
      date: workoutReports.date,
    })
    .from(workoutReports)
    .where(
      and(eq(workoutReports.userId, params.userId), inArray(workoutReports.date, params.dates))
    );
  const existingWeightRows = await db
    .select({
      date: weightEntries.date,
    })
    .from(weightEntries)
    .where(and(eq(weightEntries.userId, params.userId), inArray(weightEntries.date, params.dates)));
  const existingRecoveryRows = await db
    .select({
      date: recoveryEntries.date,
    })
    .from(recoveryEntries)
    .where(
      and(eq(recoveryEntries.userId, params.userId), inArray(recoveryEntries.date, params.dates))
    );

  return new Set([
    ...existingReportRows.map((row) => row.date),
    ...existingWeightRows.map((row) => row.date),
    ...existingRecoveryRows.map((row) => row.date),
  ]);
};

export async function importDiaryFromWorkbook(params: {
  userId: number;
  buffer: ArrayBuffer;
}): Promise<DiaryImportResult> {
  const parsed = await parseDiaryWorkbook(params.buffer);
  if (parsed.rows.length === 0) {
    return {
      sheetName: parsed.sheetName,
      parsedRows: 0,
      matchedRows: 0,
      reportsUpserted: 0,
      reportsSkipped: 0,
      weightEntriesUpserted: 0,
      recoveryEntriesUpserted: 0,
      skippedRows: parsed.errors.length,
      errors: parsed.errors,
      warnings: parsed.warnings,
    };
  }

  const dates = Array.from(new Set(parsed.rows.map((row) => row.date)));
  const planRows = await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
    })
    .from(planEntries)
    .where(and(eq(planEntries.userId, params.userId), inArray(planEntries.date, dates)))
    .orderBy(asc(planEntries.date), asc(planEntries.sessionOrder));
  const planEntryMap = buildPlanEntryMap(planRows);
  const existingFilledDates = await getExistingFilledDates({
    userId: params.userId,
    dates,
  });

  const importResult = await db.transaction(async (tx) => {
    return await importMatchedRows({
      tx,
      userId: params.userId,
      rows: parsed.rows,
      planEntryMap,
      existingFilledDates,
      initialWarnings: parsed.warnings,
    });
  });

  return {
    sheetName: parsed.sheetName,
    parsedRows: parsed.rows.length,
    matchedRows: importResult.matchedRows,
    reportsUpserted: importResult.reportsUpserted,
    reportsSkipped: importResult.reportsSkipped,
    weightEntriesUpserted: importResult.weightEntriesUpserted,
    recoveryEntriesUpserted: importResult.recoveryEntriesUpserted,
    skippedRows: importResult.skippedRows + parsed.errors.length,
    errors: parsed.errors,
    warnings: importResult.warnings,
  };
}
