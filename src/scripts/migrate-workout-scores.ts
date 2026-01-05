import "dotenv/config";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { planEntries, recoveryEntries, workoutReports } from "../db/schema";

type RecoveryScoreRow = {
  userId: number;
  date: string;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
};

const hasAnyScore = (row: RecoveryScoreRow) =>
  row.overallScore !== null ||
  row.functionalScore !== null ||
  row.muscleScore !== null;

const run = async () => {
  const recoveryRows = await db
    .select({
      userId: recoveryEntries.userId,
      date: recoveryEntries.date,
      overallScore: recoveryEntries.overallScore,
      functionalScore: recoveryEntries.functionalScore,
      muscleScore: recoveryEntries.muscleScore,
    })
    .from(recoveryEntries);

  const candidates = recoveryRows.filter(hasAnyScore);
  let updated = 0;
  let skippedNoPlan = 0;
  let skippedNoReport = 0;
  let skippedNoChanges = 0;

  for (const row of candidates) {
    const [firstEntry] = await db
      .select({ id: planEntries.id })
      .from(planEntries)
      .where(and(eq(planEntries.userId, row.userId), eq(planEntries.date, row.date)))
      .orderBy(asc(planEntries.sessionOrder), asc(planEntries.id))
      .limit(1);

    if (!firstEntry) {
      skippedNoPlan += 1;
      continue;
    }

    const [report] = await db
      .select({
        id: workoutReports.id,
        overallScore: workoutReports.overallScore,
        functionalScore: workoutReports.functionalScore,
        muscleScore: workoutReports.muscleScore,
      })
      .from(workoutReports)
      .where(
        and(
          eq(workoutReports.userId, row.userId),
          eq(workoutReports.planEntryId, firstEntry.id)
        )
      );

    if (!report) {
      skippedNoReport += 1;
      continue;
    }

    const updates: {
      overallScore?: number;
      functionalScore?: number;
      muscleScore?: number;
      updatedAt?: Date;
    } = {};

    if (report.overallScore === null && row.overallScore !== null) {
      updates.overallScore = row.overallScore;
    }
    if (report.functionalScore === null && row.functionalScore !== null) {
      updates.functionalScore = row.functionalScore;
    }
    if (report.muscleScore === null && row.muscleScore !== null) {
      updates.muscleScore = row.muscleScore;
    }

    if (Object.keys(updates).length === 0) {
      skippedNoChanges += 1;
      continue;
    }

    updates.updatedAt = new Date();
    await db
      .update(workoutReports)
      .set(updates)
      .where(eq(workoutReports.id, report.id));
    updated += 1;
  }

  console.log(`[migrate] recovery rows: ${recoveryRows.length}`);
  console.log(`[migrate] with scores: ${candidates.length}`);
  console.log(`[migrate] updated reports: ${updated}`);
  console.log(`[migrate] skipped (no plan): ${skippedNoPlan}`);
  console.log(`[migrate] skipped (no report): ${skippedNoReport}`);
  console.log(`[migrate] skipped (no changes): ${skippedNoChanges}`);
  process.exit(0);
};

run().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
