import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, isValidDateStringMock, upsertRecoveryEntryMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    upsertRecoveryEntryMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    isValidDateString: isValidDateStringMock,
  };
});

vi.mock("@/server/recoveryEntries", () => {
  return {
    upsertRecoveryEntry: upsertRecoveryEntryMock,
  };
});

import { POST } from "@/app/api/diary/recovery/route";

describe("POST /api/diary/recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "12" }));
    isValidDateStringMock.mockReturnValue(true);
    upsertRecoveryEntryMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/recovery",
      body: {
        date: "2026-01-02",
        hasBath: true,
        hasMfr: false,
        hasMassage: false,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидной дате", async () => {
    isValidDateStringMock.mockReturnValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/recovery",
      body: {
        date: "bad-date",
        hasBath: true,
        hasMfr: false,
        hasMassage: false,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_date");
  });

  it("должен возвращать 400 при невалидном payload", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/recovery",
      body: {
        date: "2026-01-02",
        hasBath: "invalid",
        hasMfr: false,
        hasMassage: false,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_payload");
  });

  it("должен валидировать границы optional значений", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/recovery",
      body: {
        date: "2026-01-02",
        hasBath: true,
        hasMfr: false,
        hasMassage: false,
        overallScore: 11,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_payload");
  });

  it("должен сохранять восстановление и прокидывать нормализованные optional поля", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/recovery",
      body: {
        date: "2026-01-02",
        hasBath: "true",
        hasMfr: false,
        hasMassage: "false",
        overallScore: "8",
        functionalScore: "",
        muscleScore: null,
        sleepHours: "7.5",
      },
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ ok: boolean }>(response, 200);

    expect(payload.ok).toBe(true);
    expect(upsertRecoveryEntryMock).toHaveBeenCalledWith({
      userId: 12,
      date: "2026-01-02",
      hasBath: true,
      hasMfr: false,
      hasMassage: false,
      overallScore: 8,
      functionalScore: null,
      muscleScore: null,
      sleepHours: 7.5,
    });
  });
});
