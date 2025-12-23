import { getPlanEntriesByDate } from "@/lib/planEntries";

export type PlanEntries = Awaited<ReturnType<typeof getPlanEntriesByDate>>;

export const formatPlanMessage = (params: {
  date: string;
  entries: PlanEntries;
}) => {
  if (!params.entries.length) {
    return `На ${params.date} нет тренировки.`;
  }

  const lines = params.entries.map((entry) => {
    const flags = entry.isWorkload ? "нагрузка" : "";
    const comment = entry.commentText ? `Комментарий: ${entry.commentText}` : "";
    const parts = [entry.taskText, flags].filter(Boolean).join(" ");
    return `${entry.sessionOrder}. ${parts}${comment ? `\n${comment}` : ""}`;
  });

  return [`План на ${params.date}:`, ...lines].join("\n");
};
