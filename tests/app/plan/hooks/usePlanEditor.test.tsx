import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_TEXT } from "@/app/plan/planText";
import type { PlanEntry } from "@/app/plan/planUtils";
import { usePlanEditor } from "@/app/plan/hooks/usePlanEditor";
import type { Dispatch, SetStateAction } from "react";

function createPlanEntry(overrides: Partial<PlanEntry> = {}): PlanEntry {
  return {
    id: 1,
    date: "2026-01-01",
    sessionOrder: 1,
    taskText: "Run",
    commentText: null,
    importId: null,
    isWorkload: false,
    hasReport: false,
    ...overrides,
  };
}

function createHookHarness(params: { entries?: PlanEntry[] }) {
  const setEntries = vi.fn();
  const msgApi = {
    error: vi.fn(),
    success: vi.fn(),
  };
  const modalApi = {
    confirm: vi.fn(),
  };

  const entries = params.entries ?? [];
  const hook = renderHook(() =>
    usePlanEditor({
      entries,
      setEntries: setEntries as unknown as Dispatch<SetStateAction<PlanEntry[]>>,
      msgApi: msgApi as any,
      modalApi: modalApi as any,
    })
  );

  return {
    hook,
    setEntries,
    msgApi,
    modalApi,
  };
}

describe("usePlanEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("должен открывать модалку создания с пустым draft", () => {
    const { hook } = createHookHarness({ entries: [] });

    act(() => {
      hook.result.current.openCreateModal();
    });

    expect(hook.result.current.editorOpen).toBe(true);
    expect(hook.result.current.draft).not.toBeNull();
    expect(hook.result.current.draft?.entries).toHaveLength(1);
    expect(hook.result.current.draft?.entries[0].taskText).toBe("");
    expect(hook.result.current.draft?.date).toBe(dayjs().format("YYYY-MM-DD"));
  });

  it("должен открывать модалку редактирования и сортировать тренировки по sessionOrder", () => {
    const entries = [
      createPlanEntry({
        id: 10,
        date: "2026-01-10",
        sessionOrder: 2,
        taskText: "Second",
        hasReport: true,
      }),
      createPlanEntry({
        id: 9,
        date: "2026-01-10",
        sessionOrder: 1,
        taskText: "First",
        hasReport: false,
      }),
    ];
    const { hook } = createHookHarness({ entries });

    act(() => {
      hook.result.current.openEditModal("2026-01-10");
    });

    expect(hook.result.current.editorOpen).toBe(true);
    expect(hook.result.current.draft?.originalDate).toBe("2026-01-10");
    expect(hook.result.current.draft?.entries).toHaveLength(2);
    expect(hook.result.current.draft?.entries[0].taskText).toBe("First");
    expect(hook.result.current.draft?.entries[1].taskText).toBe("Second");
    expect(hook.result.current.draft?.isWorkload).toBe(false);
  });

  it("должен показывать ошибку при сохранении дня с уже существующей датой", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const { hook, msgApi } = createHookHarness({
      entries: [createPlanEntry({ id: 1, date: today })],
    });

    act(() => {
      hook.result.current.openCreateModal();
    });

    await act(async () => {
      await hook.result.current.handleSaveDraft();
    });

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.dateExists);
  });

  it("должен показывать ошибку, если есть пустые тренировки", async () => {
    const { hook, msgApi } = createHookHarness({ entries: [] });

    act(() => {
      hook.result.current.openCreateModal();
      hook.result.current.handleDateChange(dayjs("2030-01-01"));
    });

    await act(async () => {
      await hook.result.current.handleSaveDraft();
    });

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.fillWorkouts);
  });

  it("должен маппить ответы API при ошибках сохранения", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "date_exists" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "invalid_entry_id" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "empty_entries" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "unknown" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { hook, msgApi } = createHookHarness({ entries: [] });

    for (let i = 0; i < 5; i += 1) {
      act(() => {
        hook.result.current.openCreateModal();
        hook.result.current.handleDateChange(dayjs(`2030-01-0${i + 1}`));
        hook.result.current.updateEntry(0, { taskText: "Run" });
      });

      await act(async () => {
        await hook.result.current.handleSaveDraft();
      });
    }

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.dateExists);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.dayNotFound);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.invalidWorkouts);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.fillWorkouts);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.saveFailed);
  });

  it("должен сохранять draft, обновлять список и закрывать редактор", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          entries: [
            createPlanEntry({
              id: 20,
              date: "2030-01-10",
              sessionOrder: 2,
              taskText: "B",
              isWorkload: true,
            }),
            createPlanEntry({
              id: 19,
              date: "2030-01-10",
              sessionOrder: 1,
              taskText: "A",
              isWorkload: true,
            }),
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const existing = createPlanEntry({
      id: 1,
      date: "2029-12-30",
      sessionOrder: 1,
      taskText: "Existing",
    });
    const { hook, msgApi, setEntries } = createHookHarness({ entries: [existing] });

    act(() => {
      hook.result.current.openCreateModal();
      hook.result.current.handleDateChange(dayjs("2030-01-10"));
      hook.result.current.handleWorkloadChange(true);
      hook.result.current.updateEntry(0, { taskText: "A", commentText: "note" });
      hook.result.current.addEntry();
      hook.result.current.updateEntry(1, { taskText: "B" });
    });

    await act(async () => {
      await hook.result.current.handleSaveDraft();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(msgApi.success).toHaveBeenCalledWith(PLAN_TEXT.messages.daySaved);
    expect(setEntries).toHaveBeenCalledTimes(1);

    const updater = setEntries.mock.calls[0][0] as (prev: PlanEntry[]) => PlanEntry[];
    const nextEntries = updater([existing]);
    expect(nextEntries[0].date).toBe("2030-01-10");
    expect(nextEntries[0].sessionOrder).toBe(1);
    expect(nextEntries[1].sessionOrder).toBe(2);
    expect(nextEntries[2].date).toBe("2029-12-30");

    await waitFor(() => {
      expect(hook.result.current.editorOpen).toBe(false);
      expect(hook.result.current.draft).toBeNull();
    });
  });

  it("должен открывать confirm при удалении тренировки и удалять элемент по onOk", () => {
    const entries = [
      createPlanEntry({
        id: 1,
        date: "2026-01-15",
        sessionOrder: 1,
        taskText: "A",
        hasReport: true,
      }),
      createPlanEntry({
        id: 2,
        date: "2026-01-15",
        sessionOrder: 2,
        taskText: "B",
        hasReport: false,
      }),
    ];
    const { hook, modalApi } = createHookHarness({ entries });

    act(() => {
      hook.result.current.openEditModal("2026-01-15");
    });
    act(() => {
      hook.result.current.confirmRemoveEntry(0);
    });

    expect(modalApi.confirm).toHaveBeenCalledTimes(1);
    const options = modalApi.confirm.mock.calls[0][0] as { onOk: () => void; content: string };
    expect(options.content).toBe(PLAN_TEXT.confirm.deleteWorkoutWithReport);

    act(() => {
      options.onOk();
    });

    expect(hook.result.current.draft?.entries).toHaveLength(1);
    expect(hook.result.current.draft?.entries[0].taskText).toBe("B");
  });

  it("должен вызывать удаление дня и обновлять entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const entries = [
      createPlanEntry({ id: 1, date: "2026-01-20", taskText: "A", hasReport: true }),
      createPlanEntry({ id: 2, date: "2026-01-21", taskText: "B" }),
    ];
    const { hook, modalApi, msgApi, setEntries } = createHookHarness({ entries });

    act(() => {
      hook.result.current.openEditModal("2026-01-20");
    });
    act(() => {
      hook.result.current.handleDeleteDay();
    });

    expect(modalApi.confirm).toHaveBeenCalledTimes(1);
    const options = modalApi.confirm.mock.calls[0][0] as { onOk: () => Promise<void> };

    await act(async () => {
      await options.onOk();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/plans?date=2026-01-20", {
      method: "DELETE",
    });
    expect(setEntries).toHaveBeenCalledTimes(1);
    expect(msgApi.success).toHaveBeenCalledWith(PLAN_TEXT.messages.dayDeleted);
    expect(hook.result.current.editorOpen).toBe(false);
  });

  it("должен показывать dayNotFound при 404 во время удаления", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const entries = [createPlanEntry({ id: 1, date: "2026-01-30", taskText: "A" })];
    const { hook, modalApi, msgApi } = createHookHarness({ entries });

    act(() => {
      hook.result.current.openEditModal("2026-01-30");
    });
    act(() => {
      hook.result.current.handleDeleteDay();
    });

    const options = modalApi.confirm.mock.calls[0][0] as { onOk: () => Promise<void> };
    await act(async () => {
      await options.onOk();
    });

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.dayNotFound);
  });

  it("не должен запускать удаление дня без originalDate", () => {
    const { hook, modalApi } = createHookHarness({ entries: [] });

    act(() => {
      hook.result.current.openCreateModal();
      hook.result.current.handleDeleteDay();
    });

    expect(modalApi.confirm).not.toHaveBeenCalled();
  });
});
