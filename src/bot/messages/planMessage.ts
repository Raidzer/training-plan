import { getPlanEntriesByDate } from "@/lib/planEntries";
import { formatDateForDisplay } from "@/bot/utils/dateTime";

export type PlanEntries = Awaited<ReturnType<typeof getPlanEntriesByDate>>;

export const formatPlanMessage = (params: {
  date: string;
  entries: PlanEntries;
  sendTime?: string | null;
}) => {
  const displayDate = formatDateForDisplay(params.date);
  const sendTimeText = params.sendTime
    ? `Время рассылки: ${params.sendTime}.`
    : "";
  if (!params.entries.length) {
    return [
      `На ${displayDate} нет тренировки.`,
      sendTimeText,
    ].filter(Boolean).join("\n");
  }

  const lines = params.entries.map((entry) => {
    const flags = entry.isWorkload ? "нагрузка" : "";
    const comment = entry.commentText ? `Комментарий: ${entry.commentText}` : "";
    const parts = [entry.taskText, flags].filter(Boolean).join(" ");
    return `${entry.sessionOrder}. ${parts}${comment ? `\n${comment}` : ""}`;
  });

  return [
    `План на ${displayDate}:`,
    ...lines,
    sendTimeText,
  ].filter(Boolean).join("\n");
};
