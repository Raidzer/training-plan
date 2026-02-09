import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, expectJsonSuccess, readJsonResponse } from "@tests/helpers";

const {
  getUserIdByAliceIdMock,
  linkAliceAccountMock,
  parseWeightCommandMock,
  upsertWeightEntryMock,
  formatDateInTimeZoneMock,
  formatDateLocalMock,
  isValidTimeZoneMock,
} = vi.hoisted(() => {
  return {
    getUserIdByAliceIdMock: vi.fn(),
    linkAliceAccountMock: vi.fn(),
    parseWeightCommandMock: vi.fn(),
    upsertWeightEntryMock: vi.fn(),
    formatDateInTimeZoneMock: vi.fn(),
    formatDateLocalMock: vi.fn(),
    isValidTimeZoneMock: vi.fn(),
  };
});

vi.mock("@/server/alice", () => {
  return {
    getUserIdByAliceId: getUserIdByAliceIdMock,
    linkAliceAccount: linkAliceAccountMock,
    parseWeightCommand: parseWeightCommandMock,
  };
});

vi.mock("@/server/weightEntries", () => {
  return {
    upsertWeightEntry: upsertWeightEntryMock,
  };
});

vi.mock("@/bot/utils/dateTime", () => {
  return {
    formatDateInTimeZone: formatDateInTimeZoneMock,
    formatDateLocal: formatDateLocalMock,
    isValidTimeZone: isValidTimeZoneMock,
  };
});

import { POST } from "@/app/api/alice/webhook/route";

type AliceRequestOverrides = {
  command?: string;
  originalUtterance?: string;
  sessionId?: string;
  isNewSession?: boolean;
  stateExpectedPeriod?: "morning" | "evening";
};

function createAliceRequestBody(overrides: AliceRequestOverrides = {}) {
  return {
    meta: {
      client_id: "client",
      locale: "ru-RU",
      timezone: "Europe/Moscow",
    },
    session: {
      message_id: 1,
      session_id: overrides.sessionId ?? "session-1",
      skill_id: "skill",
      user: {
        user_id: "alice-user-1",
      },
      new: overrides.isNewSession ?? false,
    },
    request: {
      command: overrides.command ?? "",
      original_utterance: overrides.originalUtterance ?? "",
      nlu: {
        tokens: [],
        entities: [],
        intents: {},
      },
    },
    ...(overrides.stateExpectedPeriod
      ? {
          state: {
            session: {
              expected_period: overrides.stateExpectedPeriod,
            },
          },
        }
      : {}),
    version: "1.0",
  };
}

describe("POST /api/alice/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = (globalThis as { sessionStore?: Map<string, unknown> }).sessionStore;
    store?.clear();

    getUserIdByAliceIdMock.mockResolvedValue(null);
    linkAliceAccountMock.mockResolvedValue(false);
    parseWeightCommandMock.mockReturnValue(null);
    upsertWeightEntryMock.mockResolvedValue(undefined);
    formatDateInTimeZoneMock.mockReturnValue("2026-02-09");
    formatDateLocalMock.mockReturnValue("2026-02-09");
    isValidTimeZoneMock.mockReturnValue(true);
  });

  it("должен отвечать pong на ping-команду", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ originalUtterance: "ping" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
    }>(response, 200);

    expect(payload.response).toEqual({
      text: "pong",
      end_session: true,
    });
  });

  it("должен возвращать текст помощи для несвязанного пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "помощь" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string } }>(response, 200);

    expect(payload.response.text).toContain("Сначала нужно связать аккаунт");
  });

  it("должен связывать аккаунт, когда передан код", async () => {
    linkAliceAccountMock.mockResolvedValue(true);
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "код 123456" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string; end_session: boolean } }>(
      response,
      200
    );

    expect(payload.response.end_session).toBe(true);
    expect(payload.response.text).toContain("Аккаунт успешно привязан");
    expect(linkAliceAccountMock).toHaveBeenCalledWith("alice-user-1", "123456");
  });

  it("должен возвращать текст ошибки, когда link-код невалидный", async () => {
    linkAliceAccountMock.mockResolvedValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "связать 123456" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string; end_session: boolean } }>(
      response,
      200
    );

    expect(payload.response.end_session).toBe(true);
    expect(payload.response.text).toContain("Неверный код");
  });

  it("должен запрашивать код, когда команда связывания не содержит код", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "связать аккаунт" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string } }>(response, 200);

    expect(payload.response.text).toContain("6-значный код");
  });

  it("должен возвращать сообщение о несвязанном аккаунте для неизвестного пользователя", async () => {
    getUserIdByAliceIdMock.mockResolvedValue(null);
    parseWeightCommandMock.mockReturnValue({ weight: 75.5, period: "morning" });
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "вес 75.5" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string } }>(response, 200);

    expect(payload.response.text).toContain("Я вас пока не знаю");
    expect(upsertWeightEntryMock).not.toHaveBeenCalled();
  });

  it("должен сохранять вес, используя дату с учетом часового пояса", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    parseWeightCommandMock.mockReturnValue({ weight: 75.5, period: "morning" });
    isValidTimeZoneMock.mockReturnValue(true);
    formatDateInTimeZoneMock.mockReturnValue("2026-02-09");
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "вес утро 75.5" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string; end_session: boolean } }>(
      response,
      200
    );

    expect(payload.response.end_session).toBe(true);
    expect(payload.response.text).toContain("утренний вес: 75.5");
    expect(upsertWeightEntryMock).toHaveBeenCalledWith({
      userId: 9,
      date: "2026-02-09",
      period: "morning",
      weightKg: 75.5,
    });
  });

  it("должен использовать ожидаемый вечерний период из состояния, когда команда неоднозначна", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "invalid-zone",
    });
    parseWeightCommandMock.mockReturnValue({ weight: 76, period: "morning" });
    isValidTimeZoneMock.mockReturnValue(false);
    formatDateLocalMock.mockReturnValue("2026-02-09");
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "вес 76",
        stateExpectedPeriod: "evening",
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string } }>(response, 200);

    expect(payload.response.text).toContain("вечерний вес: 76");
    expect(upsertWeightEntryMock).toHaveBeenCalledWith({
      userId: 9,
      date: "2026-02-09",
      period: "evening",
      weightKg: 76,
    });
  });

  it("должен устанавливать ожидаемый период в состояние сессии при приветственной команде", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "привет, нужен вечерний вес",
        isNewSession: true,
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
      session_state?: { expected_period?: string };
    }>(response, 200);

    expect(payload.response.text).toContain("Диктуйте вечерний вес");
    expect(payload.response.end_session).toBe(false);
    expect(payload.session_state?.expected_period).toBe("evening");
  });

  it("должен возвращать резервное сообщение для неизвестной команды", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ command: "абракадабра" }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string } }>(response, 200);

    expect(payload.response.text).toContain("Не поняла команду");
  });

  it("должен возвращать общий ответ об ошибке, когда парсинг тела завершается ошибкой", async () => {
    const brokenRequest = {
      json: vi.fn().mockRejectedValue(new Error("broken-json")),
    } as any;

    const response = await POST(brokenRequest);
    expect(response.status).toBe(200);
    const payload = await readJsonResponse<{
      version: string;
      response: { text: string; end_session: boolean };
    }>(response);

    expect(payload.version).toBe("1.0");
    expect(payload.response).toEqual({
      text: "Произошла ошибка на сервере.",
      end_session: true,
    });
  });
});
