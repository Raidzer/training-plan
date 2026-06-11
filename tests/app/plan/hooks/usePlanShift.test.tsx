import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_TEXT } from "@/app/(protected)/plan/PlanClient/constants/planText";
import { usePlanShift } from "@/app/(protected)/plan/PlanClient/hooks/usePlanShift";
import type { MessageInstance } from "antd/es/message/interface";

function createHookHarness() {
  const msgApi = {
    error: vi.fn(),
    success: vi.fn(),
  };
  const loadEntries = vi.fn().mockResolvedValue(undefined);

  const hook = renderHook(() =>
    usePlanShift({
      msgApi: msgApi as unknown as MessageInstance,
      loadEntries,
    })
  );

  return {
    hook,
    msgApi,
    loadEntries,
  };
}

describe("usePlanShift", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("должен открывать модалку сдвига с выбранной датой", () => {
    const { hook } = createHookHarness();

    act(() => {
      hook.result.current.openShiftModal("2026-01-10");
    });

    expect(hook.result.current.shiftOpen).toBe(true);
    expect(hook.result.current.shiftDraft).toEqual({
      fromDate: "2026-01-10",
      direction: "forward",
      days: 1,
    });
    expect(hook.result.current.shiftDateValue?.format("YYYY-MM-DD")).toBe("2026-01-10");
  });

  it("должен сохранять сдвиг и перезагружать план", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          shifted: true,
          shiftedEntriesCount: 3,
          shiftedDaysCount: 2,
          fromDate: "2026-01-10",
          offsetDays: -2,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { hook, msgApi, loadEntries } = createHookHarness();

    act(() => {
      hook.result.current.openShiftModal("2026-01-10");
      hook.result.current.handleShiftDirectionChange("backward");
      hook.result.current.handleShiftDaysChange(2);
    });

    await act(async () => {
      await hook.result.current.handleSaveShift();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/plans/shift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromDate: "2026-01-10",
        offsetDays: -2,
      }),
    });
    expect(msgApi.success).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftSuccess(2));
    expect(loadEntries).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(hook.result.current.shiftOpen).toBe(false);
    });
  });

  it("должен менять дату, направление и количество дней", () => {
    const { hook } = createHookHarness();

    act(() => {
      hook.result.current.openShiftModal("2026-01-10");
      hook.result.current.handleShiftDateChange(dayjs("2026-01-12"));
      hook.result.current.handleShiftDirectionChange("backward");
      hook.result.current.handleShiftDaysChange(3);
    });

    expect(hook.result.current.shiftDraft).toEqual({
      fromDate: "2026-01-12",
      direction: "backward",
      days: 3,
    });
  });

  it("должен валидировать количество дней", async () => {
    const { hook, msgApi } = createHookHarness();

    act(() => {
      hook.result.current.openShiftModal("2026-01-10");
      hook.result.current.handleShiftDaysChange(31);
    });

    await act(async () => {
      await hook.result.current.handleSaveShift();
    });

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftInvalid);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("должен маппить ответы API при ошибках сдвига", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "date_locked_by_report" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "target_date_exists" }), {
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
        new Response(JSON.stringify({ error: "invalid_shift" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "server_error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "unknown" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { hook, msgApi } = createHookHarness();

    for (let i = 0; i < 6; i += 1) {
      act(() => {
        hook.result.current.openShiftModal(`2026-01-1${i}`);
      });

      await act(async () => {
        await hook.result.current.handleSaveShift();
      });
    }

    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftHasReports);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftTargetExists);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftNotFound);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftInvalid);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftServerError);
    expect(msgApi.error).toHaveBeenCalledWith(PLAN_TEXT.messages.shiftFailed);
  });
});
