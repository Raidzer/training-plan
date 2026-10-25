import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLAN_TEXT } from "@/app/(protected)/plan/PlanClient/constants/planText";
import { usePlanEntries } from "@/app/(protected)/plan/PlanClient/hooks/usePlanEntries";
import type { PlanEntry } from "@/app/(protected)/plan/PlanClient/types/planTypes";
import type { MessageInstance } from "antd/es/message/interface";

function createMessageApi() {
  return {
    error: vi.fn(),
  } as unknown as MessageInstance;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createPlanEntry(overrides: Partial<PlanEntry> = {}): PlanEntry {
  return {
    id: 1,
    date: "2026-05-10",
    sessionOrder: 1,
    taskText: "Run",
    commentText: null,
    importId: null,
    isWorkload: false,
    hasReport: false,
    ...overrides,
  };
}

function createPaginatedEntries(today: string): PlanEntry[] {
  return Array.from({ length: 61 }, (_, index) =>
    createPlanEntry({
      id: index + 1,
      date: dayjs(today)
        .add(40 - index, "day")
        .format("YYYY-MM-DD"),
      taskText: index < 21 ? "Бег" : "ОФП",
      hasReport: index >= 21,
    })
  );
}

describe("usePlanEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("загружает записи и группирует тренировки по дням", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        entries: [
          createPlanEntry({
            id: 2,
            sessionOrder: 2,
            taskText: "Cooldown",
            commentText: "Easy",
          }),
          createPlanEntry({
            id: 1,
            sessionOrder: 1,
            taskText: "Intervals",
            commentText: "Track",
          }),
        ],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();

    const { result } = renderHook(() => usePlanEntries({ msgApi }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/plans");
    expect(result.current.loadError).toBeNull();
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]).toMatchObject({
      date: "2026-05-10",
      hasAnyReport: false,
      hasAllReports: false,
      reportedWorkoutCount: 0,
      workoutCount: 2,
    });
    expect(result.current.filteredEntries[0].workouts.map((workout) => workout.taskText)).toEqual([
      "Intervals",
      "Cooldown",
    ]);
  });

  it("оставляет в фильтре незавершенные и частично заполненные дни", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        entries: [
          createPlanEntry({
            id: 1,
            date: "2026-05-10",
            hasReport: true,
          }),
          createPlanEntry({
            id: 2,
            date: "2026-05-10",
            sessionOrder: 2,
            hasReport: false,
          }),
          createPlanEntry({
            id: 3,
            date: "2026-05-11",
            hasReport: true,
          }),
          createPlanEntry({
            id: 4,
            date: "2026-05-12",
            hasReport: false,
          }),
        ],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();

    const { result } = renderHook(() => usePlanEntries({ msgApi }));

    await waitFor(() => {
      expect(result.current.filteredEntries).toHaveLength(3);
    });

    act(() => {
      result.current.setCurrentPage(3);
      result.current.setOnlyWithoutReports(true);
    });

    await waitFor(() => {
      expect(result.current.filteredEntries.map((entry) => entry.date)).toEqual([
        "2026-05-10",
        "2026-05-12",
      ]);
    });

    expect(result.current.filteredEntries[0].hasAnyReport).toBe(true);
    expect(result.current.filteredEntries[0].hasAllReports).toBe(false);
    expect(result.current.currentPage).toBe(1);
  });

  it("ищет тренировки и сбрасывает пагинацию", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        entries: [
          createPlanEntry({ id: 1, date: "2026-05-10", taskText: "Интервалы в горку" }),
          createPlanEntry({
            id: 2,
            date: "2026-05-11",
            taskText: "Легкий бег",
            commentText: "После тренировки ОФП",
            hasReport: true,
          }),
        ],
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();

    const { result } = renderHook(() => usePlanEntries({ msgApi }));

    await waitFor(() => {
      expect(result.current.filteredEntries).toHaveLength(2);
    });

    act(() => {
      result.current.setCurrentPage(3);
      result.current.setSearchQuery("ГОРКУ");
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.filteredEntries.map((entry) => entry.date)).toEqual(["2026-05-10"]);

    act(() => {
      result.current.setSearchQuery("офп");
    });

    expect(result.current.filteredEntries.map((entry) => entry.date)).toEqual(["2026-05-11"]);

    act(() => {
      result.current.setOnlyWithoutReports(true);
    });

    expect(result.current.filteredEntries).toEqual([]);
  });

  it("показывает ошибку загрузки и очищает состояние загрузки", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ error: "Нет доступа" }, 403));
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();

    const { result } = renderHook(() => usePlanEntries({ msgApi }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.loadError).toBe("Нет доступа");
    expect(msgApi.error).toHaveBeenCalledWith("Нет доступа");
    expect(msgApi.error).not.toHaveBeenCalledWith(PLAN_TEXT.messages.loadFailed);
  });

  it.each(["initial", "reload"] as const)(
    "сохраняет первую страницу поиска, введенного во время загрузки (%s)",
    async (loadType) => {
      const pendingResponse = Promise.withResolvers<Response>();
      const fetchMock = vi.fn();
      global.fetch = fetchMock as unknown as typeof fetch;
      const msgApi = createMessageApi();
      const entries = createPaginatedEntries(dayjs().format("YYYY-MM-DD"));

      if (loadType === "reload") {
        fetchMock.mockResolvedValueOnce(createJsonResponse({ entries }));
      }

      fetchMock.mockReturnValueOnce(pendingResponse.promise);
      const { result } = renderHook(() => usePlanEntries({ msgApi }));

      if (loadType === "reload") {
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
        expect(result.current.currentPage).toBe(3);

        act(() => {
          void result.current.loadEntries();
        });
      }

      act(() => {
        result.current.setSearchQuery("бег");
      });

      await act(async () => {
        pendingResponse.resolve(createJsonResponse({ entries }));
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredEntries).toHaveLength(21);
      expect(result.current.currentPage).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(loadType === "reload" ? 2 : 1);
    }
  );

  it.each([false, true])(
    "учитывает актуальный фильтр дней без отчетов при первой загрузке (%s)",
    async (onlyWithoutReports) => {
      const pendingResponse = Promise.withResolvers<Response>();
      const fetchMock = vi.fn().mockReturnValue(pendingResponse.promise);
      global.fetch = fetchMock as unknown as typeof fetch;
      const msgApi = createMessageApi();
      const { result } = renderHook(() => usePlanEntries({ msgApi }));
      const entries = createPaginatedEntries(result.current.today);

      act(() => {
        result.current.setOnlyWithoutReports(true);
      });

      if (!onlyWithoutReports) {
        act(() => {
          result.current.setOnlyWithoutReports(false);
        });
      }

      await act(async () => {
        pendingResponse.resolve(createJsonResponse({ entries }));
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredEntries).toHaveLength(onlyWithoutReports ? 21 : 61);
      expect(result.current.currentPage).toBe(onlyWithoutReports ? 1 : 3);
      expect(fetchMock).toHaveBeenCalledOnce();
    }
  );

  it.each(["initial", "reload"] as const)(
    "возвращается к сегодняшнему дню, если поиск очищен до ответа загрузки (%s)",
    async (loadType) => {
      const pendingResponse = Promise.withResolvers<Response>();
      const fetchMock = vi.fn();
      global.fetch = fetchMock as unknown as typeof fetch;
      const msgApi = createMessageApi();
      const entries = createPaginatedEntries(dayjs().format("YYYY-MM-DD"));

      if (loadType === "reload") {
        fetchMock.mockResolvedValueOnce(createJsonResponse({ entries }));
      }

      fetchMock.mockReturnValueOnce(pendingResponse.promise);
      const { result } = renderHook(() => usePlanEntries({ msgApi }));

      if (loadType === "reload") {
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
      }

      act(() => {
        result.current.setSearchQuery("бег");
      });

      if (loadType === "reload") {
        act(() => {
          void result.current.loadEntries();
        });
      }

      act(() => {
        result.current.setSearchQuery("");
      });

      await act(async () => {
        pendingResponse.resolve(createJsonResponse({ entries }));
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredEntries).toHaveLength(61);
      expect(result.current.currentPage).toBe(3);
    }
  );
});
