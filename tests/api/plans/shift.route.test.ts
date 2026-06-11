import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, shiftPlanEntriesFromDateMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    shiftPlanEntriesFromDateMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/plans", () => {
  return {
    shiftPlanEntriesFromDate: shiftPlanEntriesFromDateMock,
  };
});

import { POST } from "@/app/api/plans/shift/route";

describe("API /api/plans/shift route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "22" }));
    shiftPlanEntriesFromDateMock.mockResolvedValue({
      shifted: true,
      shiftedEntriesCount: 3,
      shiftedDaysCount: 2,
      fromDate: "2026-01-10",
      offsetDays: 2,
    });
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: "2026-01-10",
        offsetDays: 2,
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен валидировать дату", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: "bad",
        offsetDays: 2,
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 400, "invalid_date");
  });

  it("должен валидировать сдвиг", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: "2026-01-10",
        offsetDays: 0,
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 400, "invalid_shift");
  });

  it("должен маппить ошибки серверного слоя", async () => {
    shiftPlanEntriesFromDateMock.mockResolvedValueOnce({ error: "not_found" });
    shiftPlanEntriesFromDateMock.mockResolvedValueOnce({ error: "date_locked_by_report" });
    shiftPlanEntriesFromDateMock.mockResolvedValueOnce({ error: "target_date_exists" });
    shiftPlanEntriesFromDateMock.mockResolvedValueOnce({ error: "invalid_shift" });

    const requestBase = {
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: "2026-01-10",
        offsetDays: 2,
      },
    };

    const responseNotFound = await POST(createJsonRequest(requestBase));
    await expectJsonError(responseNotFound, 404, "not_found");

    const responseDateLocked = await POST(createJsonRequest(requestBase));
    await expectJsonError(responseDateLocked, 409, "date_locked_by_report");

    const responseTargetExists = await POST(createJsonRequest(requestBase));
    await expectJsonError(responseTargetExists, 409, "target_date_exists");

    const responseInvalidShift = await POST(createJsonRequest(requestBase));
    await expectJsonError(responseInvalidShift, 400, "invalid_shift");
  });

  it("должен возвращать server_error при неожиданной ошибке сервиса", async () => {
    shiftPlanEntriesFromDateMock.mockRejectedValue(new Error("db failed"));
    const request = createJsonRequest({
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: "2026-01-10",
        offsetDays: 2,
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 500, "server_error");
  });

  it("должен нормализовать payload и запускать сдвиг", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/shift",
      body: {
        fromDate: " 2026-01-10 ",
        offsetDays: "2",
      },
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ shifted: boolean; shiftedDaysCount: number }>(
      response,
      200
    );

    expect(payload.shifted).toBe(true);
    expect(payload.shiftedDaysCount).toBe(2);
    expect(shiftPlanEntriesFromDateMock).toHaveBeenCalledWith({
      userId: 22,
      fromDate: "2026-01-10",
      offsetDays: 2,
    });
  });
});
