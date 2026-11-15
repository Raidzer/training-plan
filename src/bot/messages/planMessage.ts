import { getPlanEntriesByDate } from "@/server/planEntries";
import { formatDateForDisplay } from "@/bot/utils/dateTime";

const decodeCodePoint = (value: string, radix: number) => {
  const codePoint = parseInt(value, radix);
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    return "";
  }
  return String.fromCodePoint(codePoint);
};

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(code, 10))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => decodeCodePoint(code, 16));
};

export const stripHtml = (html: string) => {
  return decodeHtmlEntities(
    html
      .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
      .replace(/<\s*li\b[^>]*>/gi, "• ")
      .replace(/<[^>]*>/g, "")
      .replace(/\u0000/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export type PlanEntries = Awaited<ReturnType<typeof getPlanEntriesByDate>>;

export const formatPlanMessage = (params: {
  date: string;
  entries: PlanEntries;
  sendTime?: string | null | undefined;
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
