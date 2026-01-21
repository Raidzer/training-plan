import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { planEntries } from "@/db/schema";

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
