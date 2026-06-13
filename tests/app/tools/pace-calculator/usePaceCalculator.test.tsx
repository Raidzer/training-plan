import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/app/tools/pace-calculator/PaceCalculatorClient/constants/paceCalculatorConstants";
import { usePaceCalculator } from "@/app/tools/pace-calculator/PaceCalculatorClient/hooks/usePaceCalculator";

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

  it("должен синхронизировать результат из ручного результата и дистанции", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.resultTimeString).toBe("00:37:30");
    });

    act(() => {
      result.current.handleResultTimeChange("00:45:00");
    });
    act(() => {
      result.current.handleDistanceChange({
        target: { value: "15000" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.resultTimeString).toBe("00:45:00");
    expect(result.current.distance).toBe(15000);
    expect(result.current.paceTimeString).toBe("00:03:00");
    expect(result.current.lapTimeString).toBe("00:01:12");
  });

  it("должен убирать ведущий ноль из ручного ввода дистанции", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.distanceInputValue).toBe("10000");
    });

    act(() => {
      result.current.handleDistancePreset(0);
    });
    act(() => {
      result.current.handleDistanceChange({
        target: { value: "0100" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.distance).toBe(100);
    expect(result.current.distanceInputValue).toBe("100");
  });

  it("должен очищать ручной ввод дистанции", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.distanceInputValue).toBe("10000");
    });

    act(() => {
      result.current.handleDistanceClear();
    });

    expect(result.current.distance).toBe(0);
    expect(result.current.distanceInputValue).toBe("");
    expect(result.current.splits).toEqual([]);
    expect(result.current.canSave).toBe(false);
  });

  it("должен синхронизировать результат из круга и обрабатывать нулевые значения", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.canSave).toBe(true);
    });

    act(() => {
      result.current.handleLapTimeChange("00:01:20");
    });

    expect(result.current.lapTimeString).toBe("00:01:20");
    expect(result.current.paceTimeString).toBe("00:03:20");

    act(() => {
      result.current.handleDistancePreset(0);
    });

    expect(result.current.resultHours).toBe(0);
    expect(result.current.resultMinutes).toBe(0);
    expect(result.current.resultSeconds).toBe(0);
    expect(result.current.splits).toEqual([]);
    expect(result.current.splitGroups).toEqual([]);
    expect(result.current.canSave).toBe(false);

    act(() => {
      result.current.handleSaveResult();
    });

    expect(result.current.savedResults).toEqual([]);
  });

  it("должен сбрасывать связанные поля при нулевом темпе и круге", async () => {
    const { result } = renderHook(() => usePaceCalculator());

    await waitFor(() => {
      expect(result.current.canSave).toBe(true);
    });

    act(() => {
      result.current.handlePaceTimeChange("00:00:00");
    });

    expect(result.current.resultHours).toBe(0);
    expect(result.current.lapMinutes).toBe(0);
    expect(result.current.canSave).toBe(false);

    act(() => {
      result.current.handleDistancePreset(5000);
    });
    act(() => {
      result.current.handleLapTimeChange("00:00:00");
    });

    expect(result.current.paceMinutes).toBe(0);
    expect(result.current.resultMinutes).toBe(0);
  });
});
