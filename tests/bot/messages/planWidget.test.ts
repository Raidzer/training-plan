import { describe, expect, it, vi } from "vitest";
import {
  buildPlanWidgetHtml,
  buildPlanWidgetPayload,
  sendLongPlanText,
  splitTelegramText,
  sendPlanPresentation,
} from "@/bot/messages/planWidget";
import type { PlanEntries } from "@/bot/messages/planMessage";

const entries: PlanEntries = [
  {
    id: 1,
    date: "2026-04-18",
    sessionOrder: 1,
    taskText: "<b>Легкий бег &amp; разминка</b>",
    commentText: "Стадион\n6 ускорений",
    isWorkload: true,
  },
];

describe("bot/messages/planWidget", () => {
  it("строит карточку в стиле сайта и экранирует содержимое плана", () => {
    const html = buildPlanWidgetHtml({ date: "2026-04-18", entries });

    expect(html).toContain("#212121");
    expect(html).toContain("Легкий бег &amp; разминка");
    expect(html).toContain("Стадион<br>6 ускорений");
    expect(html).not.toContain("<b>Легкий");
  });

  it("добавляет кнопку полного текста с датой в callback", () => {
    const payload = buildPlanWidgetPayload({
      chatId: 42,
      date: "2026-04-18",
      entries,
    });

    expect(payload?.caption).toContain("План на 18-04-2026");
    expect(payload?.reply_markup.inline_keyboard[0][0].callback_data).toBe("plan:text:2026-04-18");
  });

  it("переключается на полный текст при недоступном виджете", async () => {
    const sendText = vi.fn().mockResolvedValue(undefined);
    const result = await sendPlanPresentation({
      chatId: 42,
      date: "2026-04-18",
      entries,
      sendText,
    });

    expect(result.type).toBe("text");
    expect(sendText).toHaveBeenCalledWith(expect.stringContaining("План на 18-04-2026:"));
  });

  it("отправляет виджет с карточкой и кнопкой при доступном API", async () => {
    const sendText = vi.fn().mockResolvedValue(undefined);
    const sendWidget = vi.fn().mockResolvedValue(undefined);

    const result = await sendPlanPresentation({
      chatId: 42,
      date: "2026-04-18",
      entries,
      sendText,
      sendWidget,
    });

    expect(result.type).toBe("widget");
    expect(sendWidget).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 42,
        caption: expect.stringContaining("План на 18-04-2026"),
      })
    );
    expect(sendText).not.toHaveBeenCalled();
  });

  it("делит длинный текст на сообщения Telegram", async () => {
    const sendText = vi.fn().mockResolvedValue(undefined);
    const text = "а".repeat(4_100);

    await sendLongPlanText(sendText, text);

    expect(splitTelegramText(text)).toHaveLength(2);
    expect(sendText).toHaveBeenCalledTimes(2);
    expect(sendText.mock.calls.every(([chunk]) => chunk.length <= 4096)).toBe(true);
  });
});
