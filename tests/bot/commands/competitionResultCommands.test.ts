import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequest: vi.fn(),
  setPrompt: vi.fn(),
  findByPrompt: vi.fn(),
  skip: vi.fn(),
  save: vi.fn(),
  confirm: vi.fn(),
  getRecords: vi.fn(),
  getPending: vi.fn(),
}));

vi.mock("@/server/competitionResultRequests", () => ({
  getCompetitionResultRequest: mocks.getRequest,
  setCompetitionResultPrompt: mocks.setPrompt,
  findCompetitionResultRequestByPrompt: mocks.findByPrompt,
  skipCompetitionResult: mocks.skip,
  saveCompetitionResult: mocks.save,
  confirmCompetitionResultRecord: mocks.confirm,
}));
vi.mock("@/server/personalRecords", () => ({ getPersonalRecords: mocks.getRecords }));
vi.mock("@/bot/menu/menuState", () => ({ getPendingInput: mocks.getPending }));

import { registerCompetitionResultCommands } from "@/bot/commands/handlers/competitionResultCommands";

const competition = {
  id: 20,
  blockId: 2,
  date: "2026-10-28",
  nameLocation: "Осенний старт",
  distanceLabel: "10 км",
  distanceMeters: 10000,
  result: null,
  isSkipped: false,
  priority: "regular",
  sortOrder: 0,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-01T00:00:00Z"),
};
const request = {
  id: 7,
  userId: 10,
  chatId: 100,
  competition,
  sentAt: new Date("2026-10-29T07:00:00Z"),
  promptMessageId: 42,
  savedResult: null,
};

function createContext(action = "result") {
  return {
    chat: { id: 100, type: "private" },
    me: { id: 999 },
    match: [`competition:7:${action}`, "7", action],
    message: {
      text: "39:30,1",
      reply_to_message: {
        message_id: 42,
        from: { id: 999, is_bot: true },
        text: "Введите результат соревнования «Осенний старт».",
      },
    },
    reply: vi.fn().mockResolvedValue({ message_id: 42 }),
    answerCallbackQuery: vi.fn().mockResolvedValue(true),
    editMessageReplyMarkup: vi.fn().mockResolvedValue(true),
  };
}

function createHarness() {
  let callback: (ctx: any) => Promise<void>;
  let reply: (ctx: any, next: () => Promise<void>) => Promise<void>;
  registerCompetitionResultCommands({
    callbackQuery: vi.fn((_match, handler) => {
      callback = handler;
    }),
    on: vi.fn((_filter, handler) => {
      reply = handler;
    }),
  } as any);
  return { callback: callback!, reply: reply! };
}

describe("Telegram: результат соревнования", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getRequest.mockResolvedValue(request);
    mocks.findByPrompt.mockResolvedValue({ id: 7, request });
    mocks.setPrompt.mockResolvedValue(true);
    mocks.skip.mockResolvedValue({ ...competition, isSkipped: true });
    mocks.save.mockResolvedValue({
      ...request,
      savedResult: "00:39:30.10",
      competition: { ...competition, result: "00:39:30.10" },
    });
    mocks.getRecords.mockResolvedValue([]);
    mocks.getPending.mockReturnValue(null);
    mocks.confirm.mockResolvedValue("updated");
  });

  it("просит ответить на отдельное сообщение и сохраняет привязку приглашения", async () => {
    const ctx = createContext();
    await createHarness().callback(ctx);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Осенний старт"), {
      reply_markup: expect.objectContaining({ force_reply: true }),
    });
    expect(mocks.setPrompt).toHaveBeenCalledWith({
      requestId: 7,
      chatId: 100,
      promptMessageId: 42,
    });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("не заменяет открытый ввод веса новым вводом результата", async () => {
    mocks.getPending.mockReturnValue("weightValue");
    const ctx = createContext();
    await createHarness().callback(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Сначала завершите"));
    expect(mocks.setPrompt).not.toHaveBeenCalled();
  });

  it("сохраняет пропуск только своего запроса и убирает его кнопки", async () => {
    const ctx = createContext("skip");
    await createHarness().callback(ctx);
    expect(mocks.skip).toHaveBeenCalledWith({ requestId: 7, chatId: 100 });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Пропущено"));
    expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith({
      reply_markup: { inline_keyboard: [] },
    });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("не принимает кнопку в группе или неактуальный запрос", async () => {
    const ctx = createContext("skip");
    ctx.chat.type = "group";
    const { callback } = createHarness();
    await callback(ctx);
    expect(mocks.getRequest).not.toHaveBeenCalled();
    ctx.chat.type = "private";
    mocks.getRequest.mockResolvedValue(null);
    await callback(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("неактуален"));
    expect(mocks.skip).not.toHaveBeenCalled();
  });

  it("старая кнопка пропуска не меняет уже заполненный результат", async () => {
    mocks.getRequest.mockResolvedValue({
      ...request,
      competition: { ...competition, result: "40:00" },
    });
    const ctx = createContext("skip");
    await createHarness().callback(ctx);
    expect(mocks.skip).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("неактуален"));
  });

  it("сохраняет ответ в правильный старт и отдельно предлагает первый рекорд", async () => {
    const ctx = createContext();
    const next = vi.fn();
    await createHarness().reply(ctx, next);
    expect(mocks.save).toHaveBeenCalledWith({ requestId: 7, chatId: 100, result: "00:39:30.10" });
    expect(ctx.reply).toHaveBeenNthCalledWith(1, expect.stringContaining("сохранён"));
    expect(ctx.reply).toHaveBeenNthCalledWith(2, expect.stringContaining("первый"), {
      reply_markup: expect.objectContaining({
        inline_keyboard: [
          [{ text: "Сохранить рекорд", callback_data: "competition:7:record" }],
          [{ text: "Не сейчас", callback_data: "competition:7:dismiss" }],
        ],
      }),
    });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("поздравляет только при строгом улучшении с учётом сотых", async () => {
    mocks.getRecords.mockResolvedValue([{ distanceKey: "10k", timeText: "00:39:30.11" }]);
    const ctx = createContext();
    await createHarness().reply(ctx, vi.fn());
    expect(ctx.reply).toHaveBeenLastCalledWith(
      expect.stringContaining("00:39:30.11 → 00:39:30.10"),
      expect.any(Object)
    );
  });

  it.each(["39:30.10", "00:39:30.09"])(
    "не предлагает равный или худший рекорд относительно %s",
    async (timeText) => {
      mocks.getRecords.mockResolvedValue([{ distanceKey: "10k", timeText }]);
      const ctx = createContext();
      await createHarness().reply(ctx, vi.fn());
      expect(ctx.reply).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["0", "00:00", "39:61", "DNF"])(
    "не сохраняет неправильное время %s и оставляет приглашение доступным",
    async (text) => {
      const ctx = createContext();
      ctx.message.text = text;
      await createHarness().reply(ctx, vi.fn());
      expect(mocks.save).not.toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("MM:SS"));
    }
  );

  it("ответ на другое сообщение передаёт обычному диалогу", async () => {
    const ctx = createContext();
    ctx.message.reply_to_message.text = "Сколько вы весите?";
    const next = vi.fn().mockResolvedValue(undefined);
    await createHarness().reply(ctx, next);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("узнаёт собственное старое приглашение после удаления запроса и не отдаёт ответ вводу веса", async () => {
    mocks.findByPrompt.mockResolvedValue(null);
    mocks.getPending.mockReturnValue("weightValue");
    const ctx = createContext();
    const next = vi.fn();
    await createHarness().reply(ctx, next);
    expect(next).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("неактуален"));
  });

  it("не направляет устаревший ответ в обычный диалог", async () => {
    mocks.findByPrompt.mockResolvedValue({ id: 7, request: null });
    const ctx = createContext();
    const next = vi.fn();
    await createHarness().reply(ctx, next);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("неактуален"));
  });

  it("сбой сравнения рекорда не отменяет сохранённый результат", async () => {
    mocks.getRecords.mockRejectedValue(new Error("record-read-failed"));
    const ctx = createContext();
    await createHarness().reply(ctx, vi.fn());
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenNthCalledWith(1, expect.stringContaining("сохранён"));
    expect(ctx.reply).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("проверить личный рекорд не удалось")
    );
  });

  it("подтверждает рекорд только отдельной кнопкой, отказ не вызывает запись", async () => {
    const { callback } = createHarness();
    const ctx = createContext("record");
    await callback(ctx);
    expect(mocks.confirm).toHaveBeenCalledWith({ requestId: 7, chatId: 100 });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Личный рекорд сохранён"));
    mocks.confirm.mockClear();
    await callback(createContext("dismiss"));
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("после ошибки записи рекорда оставляет кнопку для повтора", async () => {
    mocks.confirm.mockRejectedValueOnce(new Error("record-write-failed"));
    const ctx = createContext("record");
    const { callback } = createHarness();
    await callback(ctx);
    expect(ctx.editMessageReplyMarkup).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Попробуйте ещё раз"));
    await callback(ctx);
    expect(ctx.reply).toHaveBeenLastCalledWith(expect.stringContaining("Личный рекорд сохранён"));
  });

  it.each([
    ["not_better", "равный или более быстрый"],
    ["conflict", "изменился"],
    ["invalid_current_record", "не удалось распознать"],
    ["stale", "неактуален"],
  ])("объясняет результат серверной проверки %s", async (status, text) => {
    mocks.confirm.mockResolvedValue(status);
    const ctx = createContext("record");
    await createHarness().callback(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining(text));
    expect(ctx.editMessageReplyMarkup).toHaveBeenCalledOnce();
  });
});
