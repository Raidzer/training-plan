import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";

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

function PlanEntriesHarness({ msgApi }: { msgApi: MessageInstance }) {
  const { filteredEntries } = usePlanEntries({ msgApi });

  return filteredEntries.map((entry) => (
    <div key={entry.date} data-plan-entry-key={entry.date}>
      {entry.date}
    </div>
  ));
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

  it("повторяет плавную прокрутку, если мобильный браузер остановился до текущего дня", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const entries = Array.from({ length: 20 }, (_, index) =>
      createPlanEntry({
        id: index + 1,
        date: dayjs(today)
          .subtract(19 - index, "day")
          .format("YYYY-MM-DD"),
      })
    );
    global.fetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ entries })) as unknown as typeof fetch;

    let correctionApplied = false;
    const scrollIntoViewMock = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation((options?: boolean | ScrollIntoViewOptions) => {
        if (
          typeof options === "object" &&
          options.behavior === "smooth" &&
          scrollIntoViewMock.mock.calls.length === 2
        ) {
          correctionApplied = true;
        }
      });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
      const top = correctionApplied ? 200 : 900;
      const bottom = correctionApplied ? 500 : 1200;

      return {
        x: 0,
        y: top,
        width: 320,
        height: bottom - top,
        top,
        right: 320,
        bottom,
        left: 0,
        toJSON: () => ({}),
      };
    });

    const hadScrollEndSupport = "onscrollend" in window;
    if (!hadScrollEndSupport) {
      Object.defineProperty(window, "onscrollend", {
        configurable: true,
        value: null,
      });
    }

    try {
      render(<PlanEntriesHarness msgApi={createMessageApi()} />);

      await screen.findByText(today);
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledOnce();
      });
      expect(scrollIntoViewMock).toHaveBeenNthCalledWith(1, {
        block: "center",
        behavior: "smooth",
      });

      document.dispatchEvent(new Event("scrollend"));

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
      });
      expect(scrollIntoViewMock).toHaveBeenNthCalledWith(2, {
        block: "center",
        behavior: "smooth",
      });

      document.dispatchEvent(new Event("scrollend"));
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    } finally {
      if (!hadScrollEndSupport) {
        Reflect.deleteProperty(window, "onscrollend");
      }
    }
  });
});
