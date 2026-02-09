import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/app/tools/pace-calculator/pace-calculator.utils";
import { usePaceCalculator } from "@/app/tools/pace-calculator/usePaceCalculator";

describe("usePaceCalculator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("должен инициализировать по умолчанию значения и разбивать список", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.resultTimeString).toBe("00:37:30");
    });
    expect(result.current.distance).toBe(10000);
    expect(result.current.splits.length).toBeGreaterThan(0);
    expect(result.current.canSave).toBe(true);
  });

  it("должен синхронизировать результат из правок pace и пресета дистанции", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.resultTimeString).toBe("00:37:30");
    });

    act(() => {
      result.current.handleDistancePreset(5000);
    });
    act(() => {
      result.current.handlePaceTimeChange("00:04:00");
    });

    expect(result.current.distance).toBe(5000);
    expect(result.current.paceTimeString).toBe("00:04:00");
    expect(result.current.resultTimeString).toBe("00:20:00");
  });

  it("должен сохранять и удалять результаты в локальном состояние и хранилище", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.canSave).toBe(true);
    });

    act(() => {
      result.current.handleSaveResult();
    });
    expect(result.current.savedResults).toHaveLength(1);

    const savedId = result.current.savedResults[0].id;
    act(() => {
      result.current.handleDeleteResult(savedId);
    });
    expect(result.current.savedResults).toHaveLength(0);

    const persisted = localStorage.getItem(STORAGE_KEY);
    expect(persisted).toBe("[]");
  });
});
