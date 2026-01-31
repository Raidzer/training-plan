import { getPlanEntriesByDate } from "@/server/planEntries";
import { formatDateForDisplay } from "@/bot/utils/dateTime";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

export type PlanEntries = Awaited<ReturnType<typeof getPlanEntriesByDate>>;

export const formatPlanMessage = (params: {
  date: string;
  entries: PlanEntries;
  sendTime?: string | null;
}) => {
  const displayDate = formatDateForDisplay(params.date);
  const sendTimeText = params.sendTime ? `Время рассылки: ${params.sendTime}.` : "";
  if (!params.entries.length) {
    return [`На ${displayDate} нет тренировок.`, sendTimeText].filter(Boolean).join("\n");
  }

  const lines = params.entries.map((entry) => {
    const flags = entry.isWorkload ? "нагрузка" : "";
    const comment = entry.commentText ? `комментарий: ${stripHtml(entry.commentText)}` : "";
    const parts = [stripHtml(entry.taskText), flags].filter(Boolean).join(" ");
    return `${entry.sessionOrder}. ${parts}${comment ? `\n${comment}` : ""}`;
  });

  return [`План на ${displayDate}:`, ...lines, sendTimeText].filter(Boolean).join("\n");
};
