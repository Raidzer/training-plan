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
    const lines = [`На ${displayDate} нет тренировок.`];
    if (sendTimeText) {
      lines.push("", sendTimeText);
    }
    return lines.join("\n");
  }

  const lines = params.entries.map((entry) => {
    const taskText = stripHtml(entry.taskText);
    const commentText = entry.commentText ? stripHtml(entry.commentText) : "";
    const parts = [String(entry.sessionOrder), "."];
    const linesByEntry = [`${parts[0]}${parts[1]}`];

    if (entry.isWorkload) {
      linesByEntry.push("🔥🔥🔥");
    }

    linesByEntry.push(taskText);

    if (commentText) {
      linesByEntry.push("");
      linesByEntry.push("Комментарий:");
      linesByEntry.push(commentText);
      linesByEntry.push("");
    }

    return linesByEntry.join("\n");
  });

  const messageLines = [`План на ${displayDate}:`, ...lines];
  if (sendTimeText) {
    messageLines.push("", sendTimeText);
  }
  return messageLines.join("\n");
};
