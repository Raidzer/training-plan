import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest as createJsonRequestBase,
  expectJsonSuccess,
  readJsonResponse,
} from "@tests/helpers";

const {
  getUserIdByAliceIdMock,
  linkAliceAccountMock,
  getRecoveryEntryByDateMock,
  parseSleepCommandMock,
  parseWeightCommandMock,
  upsertRecoveryEntryMock,
  upsertWeightEntryMock,
  formatDateInTimeZoneMock,
  formatDateLocalMock,
  isValidTimeZoneMock,
} = vi.hoisted(() => {
  return {
    getUserIdByAliceIdMock: vi.fn(),
    linkAliceAccountMock: vi.fn(),
    getRecoveryEntryByDateMock: vi.fn(),
    parseSleepCommandMock: vi.fn(),
    parseWeightCommandMock: vi.fn(),
    upsertRecoveryEntryMock: vi.fn(),
    upsertWeightEntryMock: vi.fn(),
    formatDateInTimeZoneMock: vi.fn(),
    formatDateLocalMock: vi.fn(),
    isValidTimeZoneMock: vi.fn(),
  };
});

vi.mock("@/alice/accounts", () => {
  return {
    getUserIdByAliceId: getUserIdByAliceIdMock,
    linkAliceAccount: linkAliceAccountMock,
  };
});

vi.mock("@/alice/parser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/alice/parser")>();

  return {
    ...actual,
    parseSleepCommand: parseSleepCommandMock,
    parseWeightCommand: parseWeightCommandMock,
  };
});

vi.mock("@/server/recoveryEntries", () => {
  return {
    getRecoveryEntryByDate: getRecoveryEntryByDateMock,
    upsertRecoveryEntry: upsertRecoveryEntryMock,
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
  messageId?: number;
  isNewSession?: boolean;
  stateExpectedEntry?: "sleep";
  stateExpectedPeriod?: "morning" | "evening";
};

function createAliceRequestBody(overrides: AliceRequestOverrides = {}) {
  const sessionState = {
    ...(overrides.stateExpectedEntry
      ? {
          expected_entry: overrides.stateExpectedEntry,
        }
      : {}),
    ...(overrides.stateExpectedPeriod
      ? {
          expected_period: overrides.stateExpectedPeriod,
        }
      : {}),
  };

  return {
    meta: {
      client_id: "client",
      locale: "ru-RU",
      timezone: "Europe/Moscow",
    },
    session: {
      message_id: overrides.messageId ?? 1,
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
    ...(Object.keys(sessionState).length > 0
      ? {
          state: {
            session: sessionState,
          },
        }
      : {}),
    version: "1.0",
  };
}

function createJsonRequest(options: Parameters<typeof createJsonRequestBase>[0]) {
  const headers = new Headers(options.headers);
  headers.set("x-alice-webhook-secret", "test-alice-secret");
  return createJsonRequestBase({ ...options, headers });
}

describe("POST /api/alice/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ALICE_WEBHOOK_SECRET", "test-alice-secret");
    vi.stubEnv("ALICE_SKILL_ID", "skill");
    const store = (globalThis as { sessionStore?: Map<string, unknown> }).sessionStore;
    store?.clear();
    const replayCache = (globalThis as { aliceReplayCache?: Map<string, unknown> })
      .aliceReplayCache;
    replayCache?.clear();

    getUserIdByAliceIdMock.mockResolvedValue(null);
    linkAliceAccountMock.mockResolvedValue(false);
    getRecoveryEntryByDateMock.mockResolvedValue(null);
    parseSleepCommandMock.mockReturnValue(null);
    parseWeightCommandMock.mockReturnValue(null);
    upsertRecoveryEntryMock.mockResolvedValue(undefined);
    upsertWeightEntryMock.mockResolvedValue(undefined);
    formatDateInTimeZoneMock.mockReturnValue("2026-02-09");
    formatDateLocalMock.mockReturnValue("2026-02-09");
    isValidTimeZoneMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("должен отклонять запрос без серверного заголовка до обработки тела", async () => {
    const request = { headers: new Headers(), json: vi.fn() };

    const response = await POST(request as any);

    expect(response.status).toBe(401);
    expect(request.json).not.toHaveBeenCalled();
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
  });

  it.each(["ALICE_WEBHOOK_SECRET", "ALICE_SKILL_ID"])(
    "не принимает запрос без настройки %s",
    async (name) => {
      vi.stubEnv(name, "");
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/alice/webhook",
          body: createAliceRequestBody({ originalUtterance: "ping" }),
        }) as any
      );

      expect(response.status).toBe(401);
      expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
    }
  );

  it("должен отклонять запрос с неверным серверным секретом", async () => {
    const request = createJsonRequestBase({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({ originalUtterance: "ping" }),
      headers: { "x-alice-webhook-secret": "wrong-secret" },
    });

    const response = await POST(request as any);

    expect(response.status).toBe(401);
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
  });

  it("отклоняет запрос от другого навыка даже с секретом ingress", async () => {
    vi.stubEnv("ALICE_SKILL_ID", "another-skill");
    const response = await POST(
      createJsonRequest({
        url: "http://localhost/api/alice/webhook",
        body: createAliceRequestBody({ command: "помощь" }),
      }) as any
    );

    expect(response.status).toBe(401);
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
  });

  it("должен вернуть сохраненный ответ и не повторить side effect для replay сообщения", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({ userId: 9, timezone: "Europe/Moscow" });
    parseWeightCommandMock.mockReturnValue({ weight: 75.5, period: "morning" });
    const body = createAliceRequestBody({ command: "вес утро 75.5", messageId: 7 });

    const firstResponse = await POST(
      createJsonRequest({ url: "http://localhost/api/alice/webhook", body }) as any
    );
    const replayResponse = await POST(
      createJsonRequest({
        url: "http://localhost/api/alice/webhook",
        body: createAliceRequestBody({ command: "вес утро 99", messageId: 7 }),
      }) as any
    );

    expect(firstResponse.status).toBe(200);
    expect(
      (await readJsonResponse<{ response: { text: string } }>(replayResponse)).response.text
    ).toContain("75.5");
    expect(upsertWeightEntryMock).toHaveBeenCalledTimes(1);
  });

  it("должен отклонять невалидный JSON-контракт", async () => {
    const response = await POST(
      createJsonRequest({ url: "http://localhost/api/alice/webhook", body: null }) as any
    );

    expect(response.status).toBe(400);
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
  });

  it("не должен использовать устаревший session.user_id без session.user", async () => {
    const body: any = createAliceRequestBody({ command: "связать 123456" });
    delete body.session.user;
    body.session.user_id = "alice-user-1";

    const response = await POST(
      createJsonRequest({ url: "http://localhost/api/alice/webhook", body }) as any
    );
    const payload = await readJsonResponse<{ response: { text: string } }>(response);

    expect(response.status).toBe(200);
    expect(payload.response.text).toContain("Не удалось определить пользователя");
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
    expect(linkAliceAccountMock).not.toHaveBeenCalled();
  });

  it("должен отвечать pong на ping-команду", async () => {
    const { session, version } = createAliceRequestBody();
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: {
        version,
        session: { ...session, user: undefined },
        request: { command: "ping", original_utterance: "ping", type: "SimpleUtterance" },
      },
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
    }>(response, 200);

    expect(payload.response).toEqual({
      text: "pong",
      end_session: true,
    });
    expect(getUserIdByAliceIdMock).not.toHaveBeenCalled();
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
    expect(payload.response.text).toContain("вес и сон");
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

  it("должен устанавливать ожидание ввода сна при команде записи сна", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "запиши сон",
        isNewSession: true,
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
      session_state?: { expected_entry?: string };
    }>(response, 200);

    expect(payload.response.text).toContain("Диктуйте сегодняшний сон");
    expect(payload.response.end_session).toBe(false);
    expect(payload.session_state?.expected_entry).toBe("sleep");
  });

  it("должен устанавливать ожидание ввода сна при команде записи количества сна", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "запиши количество сна",
        isNewSession: true,
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
      session_state?: { expected_entry?: string };
    }>(response, 200);

    expect(payload.response.text).toContain("Диктуйте сегодняшний сон");
    expect(payload.response.end_session).toBe(false);
    expect(payload.session_state?.expected_entry).toBe("sleep");
  });

  it("должен сразу сохранять сон, когда значение передано в одной команде", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    parseSleepCommandMock.mockReturnValue({ sleepHours: 8.53 });
    formatDateInTimeZoneMock.mockReturnValue("2026-02-09");
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "запиши сон 8 и 32",
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string; end_session: boolean } }>(
      response,
      200
    );

    expect(payload.response.text).toContain("Записала сегодняшний сон: 08:32");
    expect(payload.response.end_session).toBe(true);
    expect(parseSleepCommandMock).toHaveBeenCalledWith("запиши сон 8 и 32");
    expect(upsertRecoveryEntryMock).toHaveBeenCalledWith({
      userId: 9,
      date: "2026-02-09",
      sleepHours: 8.53,
    });
    expect(getRecoveryEntryByDateMock).not.toHaveBeenCalled();
    expect(upsertWeightEntryMock).not.toHaveBeenCalled();
  });

  it("должен сохранять сон из ожидаемой реплики с часами и минутами и не затирать восстановление", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    parseSleepCommandMock.mockReturnValue({ sleepHours: 7.63 });
    getRecoveryEntryByDateMock.mockResolvedValue({
      id: 3,
      date: "2026-02-09",
      hasBath: true,
      hasMfr: false,
      hasMassage: true,
      sleepHours: "8",
    });
    formatDateInTimeZoneMock.mockReturnValue("2026-02-09");
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "7 часов 38 минут",
        stateExpectedEntry: "sleep",
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{ response: { text: string; end_session: boolean } }>(
      response,
      200
    );

    expect(payload.response.text).toContain("Записала сегодняшний сон: 07:38");
    expect(payload.response.end_session).toBe(true);
    expect(parseSleepCommandMock).toHaveBeenCalledWith("7 часов 38 минут", {
      allowNumericOnly: true,
    });
    expect(getRecoveryEntryByDateMock).not.toHaveBeenCalled();
    expect(upsertRecoveryEntryMock).toHaveBeenCalledWith({
      userId: 9,
      date: "2026-02-09",
      sleepHours: 7.63,
    });
    expect(upsertWeightEntryMock).not.toHaveBeenCalled();
  });

  it("должен сохранять ожидание сна, когда числовая реплика не распознана", async () => {
    getUserIdByAliceIdMock.mockResolvedValue({
      userId: 9,
      timezone: "Europe/Moscow",
    });
    parseSleepCommandMock.mockReturnValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/alice/webhook",
      body: createAliceRequestBody({
        command: "много",
        stateExpectedEntry: "sleep",
      }),
    });

    const response = await POST(request as any);
    const payload = await expectJsonSuccess<{
      response: { text: string; end_session: boolean };
      session_state?: { expected_entry?: string };
    }>(response, 200);

    expect(payload.response.text).toContain("Не поняла сон");
    expect(payload.response.end_session).toBe(false);
    expect(payload.session_state?.expected_entry).toBe("sleep");
    expect(upsertRecoveryEntryMock).not.toHaveBeenCalled();
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
      headers: new Headers({ "x-alice-webhook-secret": "test-alice-secret" }),
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
