import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, isValidDateStringMock, upsertWeightEntryMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    upsertWeightEntryMock: vi.fn(),
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

vi.mock("@/server/weightEntries", () => {
  return {
    upsertWeightEntry: upsertWeightEntryMock,
  };
});

import { POST } from "@/app/api/diary/weight/route";

describe("POST /api/diary/weight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "11" }));
    isValidDateStringMock.mockReturnValue(true);
    upsertWeightEntryMock.mockResolvedValue(undefined);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/weight",
      body: {
        date: "2026-01-02",
        period: "morning",
        weightKg: 70.2,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при невалидной дате", async () => {
    isValidDateStringMock.mockReturnValue(false);
    const request = createJsonRequest({
      url: "http://localhost/api/diary/weight",
      body: {
        date: "bad-date",
        period: "morning",
        weightKg: 70.2,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_date");
  });

  it("должен возвращать 400 при невалидном периоде", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/weight",
      body: {
        date: "2026-01-02",
        period: "night",
        weightKg: 70.2,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_period");
  });

  it("должен возвращать 400 при невалидном весе", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/weight",
      body: {
        date: "2026-01-02",
        period: "morning",
        weightKg: -1,
      },
    });

    const response = await POST(request);
    await expectJsonError(response, 400, "invalid_weight");
  });

  it("должен округлять вес и вызывать upsertWeightEntry", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/diary/weight",
      body: {
        date: "2026-01-02",
        period: "evening",
        weightKg: "70.26",
      },
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ ok: boolean }>(response, 200);

    expect(payload.ok).toBe(true);
    expect(upsertWeightEntryMock).toHaveBeenCalledWith({
      userId: 11,
      date: "2026-01-02",
      period: "evening",
      weightKg: 70.3,
    });
  });
});
