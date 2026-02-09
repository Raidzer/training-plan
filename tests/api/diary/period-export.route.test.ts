import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestWithQuery,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, isValidDateStringMock, getDiaryExportRowsMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getDiaryExportRowsMock: vi.fn(),
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
    getDiaryExportRows: getDiaryExportRowsMock,
  };
});

import { GET } from "@/app/api/diary/period-export/route";

describe("GET /api/diary/period-export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "55" }));
    isValidDateStringMock.mockReturnValue(true);
    getDiaryExportRowsMock.mockResolvedValue([
      {
        dateTime: "01.02.2026(Пн) 08:00",
        task: "<b>Интервалы</b>",
        result: "OK",
        comment: "Комментарий",
        score: "7-7-7",
        sleep: "08:00",
        weight: "70.0 / 70.5",
        recovery: "МФР",
        volume: "10.50",
        hasWorkload: true,
      },
      {
        dateTime: "07.02.2026(Вс) 08:00",
        task: "Легкий бег",
        result: "-",
        comment: "",
        score: "-",
        sleep: "-",
        weight: "-",
        recovery: "-",
        volume: "8.00",
        hasWorkload: false,
      },
    ]);
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-02-01", to: "2026-02-07" },
    });

    const response = await GET(request);

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен возвращать 400 при ввалидный диапазон", async () => {
    isValidDateStringMock.mockReturnValue(false);
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "bad", to: "2026-02-07" },
    });

    const response = await GET(request);

    await expectJsonError(response, 400, "invalid_range");
  });

  it("должен возвращать xlsx-файл при валидном диапазон", async () => {
    const request = createRequestWithQuery({
      path: "/api/diary/period-export",
      query: { from: "2026-02-01", to: "2026-02-07" },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("spreadsheetml.sheet");
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="diary_2026-02-01_2026-02-07.xlsx"'
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = await response.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
    expect(getDiaryExportRowsMock).toHaveBeenCalledWith({
      userId: 55,
      from: "2026-02-01",
      to: "2026-02-07",
    });
  });
});
