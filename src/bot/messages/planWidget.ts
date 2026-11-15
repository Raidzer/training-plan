import { formatDateForDisplay } from "@/bot/utils/dateTime";
import { formatPlanMessage, stripHtml, type PlanEntries } from "@/bot/messages/planMessage";
import { deflateSync } from "node:zlib";

const MAX_WIDGET_HTML_BYTES = 28_000;
const MAX_WIDGET_COMPRESSED_BYTES = 3_700;
const MAX_WIDGET_LINES = 18;

export const PLAN_TEXT_CALLBACK_PREFIX = "plan:text:";

type WidgetPayload = {
  chat_id: number;
  html: string;
  caption: string;
  reply_markup: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
};

type WidgetApi = {
  sendWidget: (payload: WidgetPayload) => Promise<unknown>;
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const countWrappedLines = (value: string, width = 42) => {
  return value.split("\n").reduce((total, line) => {
    return total + Math.max(1, Math.ceil(Array.from(line).length / width));
  }, 0);
};

const estimateWidgetLines = (entries: PlanEntries) => {
  return entries.reduce((total, entry) => {
    const taskText = stripHtml(entry.taskText);
    const commentText = entry.commentText ? stripHtml(entry.commentText) : "";
    return (
      total +
      2 +
      (entry.isWorkload ? 1 : 0) +
      countWrappedLines(taskText) +
      (commentText ? 1 + countWrappedLines(commentText) : 0)
    );
  }, 3);
};

const buildWidgetBody = (params: { date: string; entries: PlanEntries }) => {
  const displayDate = escapeHtml(formatDateForDisplay(params.date));
  const weekday = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${params.date}T00:00:00Z`));
  const workoutBlocks = params.entries
    .map((entry) => {
      const taskText = escapeHtml(stripHtml(entry.taskText)).replace(/\n/g, "<br>");
      const commentText = entry.commentText
        ? escapeHtml(stripHtml(entry.commentText)).replace(/\n/g, "<br>")
        : "—";
      const workload = entry.isWorkload ? '<span class="workload">Нагрузка</span>' : "";
      return [
        '<section class="workout">',
        `<h2>${entry.sessionOrder}. ${workload}</h2>`,
        `<p class="task">${taskText || "—"}</p>`,
        `<p class="comment"><span>Комментарий</span>${commentText}</p>`,
        "</section>",
      ].join("");
    })
    .join("");

  return [
    '<main class="plan">',
    `<header><p class="eyebrow">ТРЕНИРОВОЧНЫЙ ПЛАН</p><h1>${displayDate}</h1><p class="weekday">${escapeHtml(weekday)}</p></header>`,
    `<div class="workouts">${workoutBlocks}</div>`,
    "</main>",
  ].join("");
};

export const buildPlanWidgetHtml = (params: { date: string; entries: PlanEntries }) => {
  // shortcut: line estimation is conservative, replace with client rendering if widgets gain measured height.
  if (!params.entries.length || estimateWidgetLines(params.entries) > MAX_WIDGET_LINES) {
    return null;
  }

  const body = buildWidgetBody(params);
  const html = [
    "<style>",
    ":root{color-scheme:dark;font-family:system-ui,sans-serif;color:#f5f5f5;background:#212121}",
    "body{margin:0;padding:0 14px 14px;background:#212121}",
    ".plan{border:1px solid #3a3a3a;border-radius:6px;background:#292929;overflow:hidden}",
    "header{padding:14px 16px 12px;border-bottom:1px solid #3a3a3a;background:#303030}",
    ".eyebrow{margin:0 0 5px;color:#a6a6a6;font-size:.62em;font-weight:600;letter-spacing:.1em}",
    "h1{margin:0;color:#f5f5f5;font-size:1.25em;line-height:1.2}",
    ".weekday{margin:3px 0 0;color:#b8b8b8;font-size:.82em}",
    ".workouts{padding:4px 16px}",
    ".workout{padding:11px 0;border-bottom:1px solid #3a3a3a}",
    ".workout:last-child{border-bottom:0}",
    "h2{margin:0 0 5px;color:#f5f5f5;font-size:.9em;line-height:1.3}",
    ".task{margin:0;color:#f5f5f5;font-size:.92em;line-height:1.4;overflow-wrap:anywhere}",
    ".comment{margin:7px 0 0;color:#b8b8b8;font-size:.8em;line-height:1.35;overflow-wrap:anywhere}",
    ".comment span{display:block;margin-bottom:2px;color:#9b9b9b;font-size:.78em;font-weight:600;letter-spacing:.04em}",
    ".workload{display:inline-block;margin-left:5px;padding:2px 6px;border:1px solid #737373;border-radius:4px;color:#d0d0d0;font-size:.72em;font-weight:500}",
    "</style>",
    body,
  ].join("");

  const htmlBytes = Buffer.byteLength(html, "utf8");
  const compressedBytes = deflateSync(Buffer.from(html, "utf8"), { level: 9 }).byteLength;
  if (htmlBytes > MAX_WIDGET_HTML_BYTES || compressedBytes > MAX_WIDGET_COMPRESSED_BYTES) {
    return null;
  }

  return html;
};

export const buildPlanWidgetPayload = (params: {
  chatId: number;
  date: string;
  entries: PlanEntries;
  sendTime?: string | null | undefined;
}): WidgetPayload | null => {
  const html = buildPlanWidgetHtml(params);
  if (!html) {
    return null;
  }

  const displayDate = formatDateForDisplay(params.date);
  const timeText = params.sendTime ? ` · ${params.sendTime}` : "";
  return {
    chat_id: params.chatId,
    html,
    caption: `План на ${displayDate}${timeText}. Полный текст — по кнопке ниже.`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📄 План текстом",
            callback_data: `${PLAN_TEXT_CALLBACK_PREFIX}${params.date}`,
          },
        ],
      ],
    },
  };
};

export const sendPlanPresentation = async (params: {
  chatId: number;
  date: string;
  entries: PlanEntries;
  sendText: (text: string) => Promise<unknown>;
  sendWidget?: WidgetApi["sendWidget"] | undefined;
  sendTime?: string | null | undefined;
}) => {
  const plainText = formatPlanMessage({
    date: params.date,
    entries: params.entries,
    sendTime: params.sendTime,
  });
  const payload = buildPlanWidgetPayload(params);
  if (!payload) {
    await sendLongPlanText(params.sendText, plainText);
    return { type: "text" as const, text: plainText };
  }

  if (!params.sendWidget) {
    await sendLongPlanText(params.sendText, plainText);
    return { type: "text" as const, text: plainText };
  }

  try {
    await params.sendWidget(payload);
    return { type: "widget" as const, text: plainText };
  } catch (error) {
    console.error("Не удалось отправить карточку плана, отправляю текст", error);
    await sendLongPlanText(params.sendText, plainText);
    return { type: "text" as const, text: plainText };
  }
};

export const sendPlanFromContext = async (params: {
  ctx: any;
  chatId: number;
  date: string;
  entries: PlanEntries;
  sendTime?: string | null;
  sendText?: (text: string) => Promise<unknown>;
}) => {
  const sendText = params.sendText ?? ((text: string) => params.ctx.reply(text));
  const sendWidget = params.ctx.api?.raw?.sendWidget;
  if (typeof sendWidget !== "function") {
    await sendLongPlanText(sendText, formatPlanMessage(params));
    return { type: "text" as const, text: formatPlanMessage(params) };
  }

  return sendPlanPresentation({
    chatId: params.chatId,
    date: params.date,
    entries: params.entries,
    sendTime: params.sendTime,
    sendText,
    sendWidget: (payload) => params.ctx.api.raw.sendWidget(payload),
  });
};

export const sendLongPlanText = async (
  sendText: (text: string) => Promise<unknown>,
  text: string
) => {
  const chunks = splitTelegramText(text);
  for (const chunk of chunks) {
    await sendText(chunk);
  }
};

export const splitTelegramText = (text: string, maxLength = 4096) => {
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    const parts = Array.from(line).length > maxLength ? splitLongLine(line, maxLength) : [line];
    for (const part of parts) {
      const separator = current ? "\n" : "";
      if (Array.from(current).length + separator.length + Array.from(part).length > maxLength) {
        chunks.push(current);
        current = part;
      } else {
        current += separator + part;
      }
    }
  }
  if (current || !chunks.length) {
    chunks.push(current);
  }
  return chunks;
};

const splitLongLine = (line: string, maxLength: number) => {
  const parts: string[] = [];
  const characters = Array.from(line);
  for (let index = 0; index < characters.length; index += maxLength) {
    parts.push(characters.slice(index, index + maxLength).join(""));
  }
  return parts;
};
