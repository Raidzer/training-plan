import { describe, expect, it } from "vitest";
import {
  buildCompetitionResultKeyboard,
  buildCompetitionRecordKeyboard,
  formatCompetitionResultPrompt,
  formatCompetitionResultRequest,
  formatCompetitionRecordOffer,
} from "@/bot/messages/competitionResultMessage";

const competition = {
  date: "2026-10-28",
  nameLocation: "Осенний старт",
  distanceLabel: "10 км",
};

describe("сообщения результата соревнования", () => {
  it("показывает конкретный старт, дистанцию и дату в запросе и приглашении ввода", () => {
    for (const text of [
      formatCompetitionResultRequest(competition),
      formatCompetitionResultPrompt(competition),
    ]) {
      expect(text).toContain("Осенний старт");
      expect(text).toContain("10 км");
      expect(text).toContain("28.10.2026");
    }
    expect(formatCompetitionResultPrompt(competition)).toContain("ответ");
    expect(formatCompetitionResultPrompt(competition)).toContain("MM:SS");
  });

  it("привязывает действия результата и рекорда к разным запросам", () => {
    expect(buildCompetitionResultKeyboard(17).inline_keyboard.flat()).toEqual([
      { text: "Указать результат", callback_data: "competition:17:result" },
      { text: "Пропустил", callback_data: "competition:17:skip" },
    ]);
    expect(buildCompetitionRecordKeyboard(18).inline_keyboard.flat()).toEqual([
      { text: "Сохранить рекорд", callback_data: "competition:18:record" },
      { text: "Не сейчас", callback_data: "competition:18:dismiss" },
    ]);
  });

  it("различает первый рекорд и улучшение и предупреждает об очистке метаданных", () => {
    const first = formatCompetitionRecordOffer({
      competition,
      timeText: "00:39:30",
      previousTimeText: null,
    });
    expect(first).toContain("первый");
    expect(first).toContain("00:39:30");
    expect(first).toContain("28.10.2026");

    const improved = formatCompetitionRecordOffer({
      competition,
      timeText: "00:39:30",
      previousTimeText: "00:40:00",
    });
    expect(improved).toContain("Поздравляем");
    expect(improved).toContain("00:40:00 → 00:39:30");
    expect(improved).toContain("город");
    expect(improved).toContain("протокол");
  });
});
