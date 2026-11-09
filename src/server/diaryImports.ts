import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { planEntries, recoveryEntries, weightEntries, workoutReports } from "@/server/db/schema";
import {
  parseDiaryWorkbook,
  type DiaryImportIssue,
  type ParsedDiaryImportRow,
} from "@/server/diaryImportParser";
import { lockTrainingData } from "@/server/trainingDataLock";
import { IMPORT_BATCH_SIZE } from "@/server/spreadsheetLimits";

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

type DiaryImportTransaction = Pick<typeof db, "insert" | "select" | "execute">;

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
  const now = new Date();
  const reports: (typeof workoutReports.$inferInsert)[] = [];
  const weightsByKey = new Map<string, typeof weightEntries.$inferInsert>();
  const recoveryByDate = new Map<string, typeof recoveryEntries.$inferInsert>();

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
      reports.push({
        userId: params.userId,
        planEntryId: matchedPlanEntry.id,
        date: row.date,
        startTime: row.startTime,
        resultText: row.resultText.trim() || "-",
        commentText: row.commentText?.trim() || null,
        distanceKm: row.distanceKm === null ? null : formatDecimal(row.distanceKm, 2),
        overallScore: row.overallScore,
        functionalScore: row.functionalScore,
        muscleScore: row.muscleScore,
        createdAt: now,
        updatedAt: now,
      });
    }
    for (const weight of [
      { period: "morning", weightKg: row.morningWeightKg },
      { period: "evening", weightKg: row.eveningWeightKg },
    ]) {
      if (weight.weightKg === null) {
        continue;
      }
      weightsByKey.set(`${row.date}:${weight.period}`, {
        userId: params.userId,
        date: row.date,
        period: weight.period,
        weightKg: formatDecimal(weight.weightKg, 1),
        createdAt: now,
        updatedAt: now,
      });
      accumulator.weightEntriesUpserted += 1;
    }
    if (hasRecoveryPayload(row)) {
      recoveryByDate.set(row.date, {
        userId: params.userId,
        date: row.date,
        hasBath: row.hasBath,
        hasMfr: row.hasMfr,
        hasMassage: row.hasMassage,
        sleepHours:
          row.sleepHours === null
            ? (recoveryByDate.get(row.date)?.sleepHours ?? null)
            : String(row.sleepHours),
        createdAt: now,
        updatedAt: now,
      });
      accumulator.recoveryEntriesUpserted += 1;
    }
  }

  for (let offset = 0; offset < reports.length; offset += IMPORT_BATCH_SIZE) {
    const insertedRows = await params.tx
      .insert(workoutReports)
      .values(reports.slice(offset, offset + IMPORT_BATCH_SIZE))
      .onConflictDoNothing({ target: [workoutReports.userId, workoutReports.planEntryId] })
      .returning({ id: workoutReports.id });
    accumulator.reportsUpserted += insertedRows.length;
  }
  const weights = Array.from(weightsByKey.values());
  for (let offset = 0; offset < weights.length; offset += IMPORT_BATCH_SIZE) {
    await params.tx
      .insert(weightEntries)
      .values(weights.slice(offset, offset + IMPORT_BATCH_SIZE))
      .onConflictDoNothing({
        target: [weightEntries.userId, weightEntries.date, weightEntries.period],
      });
  }
  const recovery = Array.from(recoveryByDate.values());
  for (let offset = 0; offset < recovery.length; offset += IMPORT_BATCH_SIZE) {
    await params.tx
      .insert(recoveryEntries)
      .values(recovery.slice(offset, offset + IMPORT_BATCH_SIZE))
      .onConflictDoNothing({ target: [recoveryEntries.userId, recoveryEntries.date] });
  }

  return accumulator;
};

const getExistingFilledDates = async (params: {
  database: Pick<typeof db, "select">;
  userId: number;
  dates: string[];
}) => {
  if (params.dates.length === 0) {
    return new Set<string>();
  }

  const existingReportRows = await params.database
    .select({
      date: workoutReports.date,
    })
    .from(workoutReports)
    .where(
      and(eq(workoutReports.userId, params.userId), inArray(workoutReports.date, params.dates))
    );
  const existingWeightRows = await params.database
    .select({
      date: weightEntries.date,
    })
    .from(weightEntries)
    .where(and(eq(weightEntries.userId, params.userId), inArray(weightEntries.date, params.dates)));
  const existingRecoveryRows = await params.database
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
  const importResult = await db.transaction(async (tx) => {
    await lockTrainingData(tx, params.userId);
    const planRows = await tx
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
      database: tx,
      userId: params.userId,
      dates,
    });
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
