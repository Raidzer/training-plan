import { act, renderHook, waitFor } from "@testing-library/react";
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

describe("usePlanEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("loads entries and groups workouts by day", async () => {
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
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]).toMatchObject({
      date: "2026-05-10",
      taskText: "1) Intervals\n2) Cooldown",
      commentText: "1) Track\n2) Easy",
      hasReport: false,
    });
  });

  it("filters grouped days without reports", async () => {
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
            date: "2026-05-11",
            hasReport: false,
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
      result.current.setOnlyWithoutReports(true);
    });

    await waitFor(() => {
      expect(result.current.filteredEntries.map((entry) => entry.date)).toEqual(["2026-05-11"]);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it("shows load error and clears loading state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ error: "Нет доступа" }, 403));
    global.fetch = fetchMock as unknown as typeof fetch;
    const msgApi = createMessageApi();

    const { result } = renderHook(() => usePlanEntries({ msgApi }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toEqual([]);
    expect(msgApi.error).toHaveBeenCalledWith("Нет доступа");
    expect(msgApi.error).not.toHaveBeenCalledWith(PLAN_TEXT.messages.loadFailed);
  });
});
