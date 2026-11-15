import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { planEntries } from "@/server/db/schema";

export type PlanEntrySummary = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
};

export const getPlanEntriesByDate = async (params: {
  userId: number;
  date: string;
}): Promise<PlanEntrySummary[]> => {
  return db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
      commentText: planEntries.commentText,
      isWorkload: planEntries.isWorkload,
    })
    .from(planEntries)
    .where(and(eq(planEntries.userId, params.userId), eq(planEntries.date, params.date)))
    .orderBy(asc(planEntries.sessionOrder));
};

const getMonthBounds = (month: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return null;
  }

  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${match[1]}-${match[2]}-01`,
    to: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, "0")}`,
  };
};

export const getPlanDatesByMonth = async (params: {
  userId: number;
  month: string;
}): Promise<string[]> => {
  const bounds = getMonthBounds(params.month);
  if (!bounds) {
    return [];
  }

  const rows = await db
    .selectDistinct({ date: planEntries.date })
    .from(planEntries)
    .where(
      and(
        eq(planEntries.userId, params.userId),
        gte(planEntries.date, bounds.from),
        lte(planEntries.date, bounds.to)
      )
    )
    .orderBy(asc(planEntries.date));

  return rows.map((row: { date: string }) => row.date);
};
