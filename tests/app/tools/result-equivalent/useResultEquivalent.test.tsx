import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";
import { useResultEquivalent } from "@/app/tools/result-equivalent/ResultEquivalentClient/hooks/useResultEquivalent";

describe("useResultEquivalent", () => {
  it("должен строить прогнозы из результата по умолчанию", () => {
    const { result } = renderHook(() => useResultEquivalent());

    expect(result.current.sourceDistance).toBe(5000);
    expect(result.current.sourceTime).toBe("00:20:00");
    expect(result.current.predictionMethod).toBe("riegel");
    expect(result.current.equivalents).toHaveLength(7);

    const tenKm = result.current.equivalents.find((item) => item.distanceMeters === 10000);
    expect(tenKm?.resultTime).toBe("00:41:42");
    expect(tenKm?.paceTime).toBe("04:10 /км");

    const source = result.current.equivalents.find((item) => item.distanceMeters === 5000);
    expect(source?.isSourceDistance).toBe(true);
  });

  it("должен переключать методику расчета прогноза", () => {
    const { result } = renderHook(() => useResultEquivalent());

    act(() => {
      result.current.handlePredictionMethodChange("cameron");
    });

    const cameronTenKm = result.current.equivalents.find((item) => item.distanceMeters === 10000);
    expect(result.current.predictionMethod).toBe("cameron");
    expect(result.current.predictionMethodDescription).toContain("Регрессионная");
    expect(cameronTenKm?.resultTime).toBe("00:41:40");

    act(() => {
      result.current.handlePredictionMethodChange("daniels");
    });

    const danielsTenKm = result.current.equivalents.find((item) => item.distanceMeters === 10000);
    expect(result.current.predictionMethod).toBe("daniels");
    expect(danielsTenKm?.resultTime).toBe("00:41:28");
  });

  it("должен пересчитывать прогноз при изменении времени и дистанции", () => {
    const { result } = renderHook(() => useResultEquivalent());

    act(() => {
      result.current.handleSourceDistancePreset(10000);
    });
    act(() => {
      result.current.handleSourceTimeChange("00:37:30");
    });

    const fiveKm = result.current.equivalents.find((item) => item.distanceMeters === 5000);
    expect(result.current.sourceDistance).toBe(10000);
    expect(result.current.sourceDistanceInputValue).toBe("10000");
    expect(fiveKm?.resultTime).toBe("00:17:59");
  });

  it("должен убирать ведущий ноль из ручного ввода дистанции", () => {
    const { result } = renderHook(() => useResultEquivalent());

    act(() => {
      result.current.handleSourceDistanceChange({
        target: { value: "05000" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.sourceDistance).toBe(5000);
    expect(result.current.sourceDistanceInputValue).toBe("5000");
  });

  it("должен очищать исходную дистанцию", () => {
    const { result } = renderHook(() => useResultEquivalent());

    act(() => {
      result.current.handleSourceDistanceClear();
    });

    expect(result.current.sourceDistance).toBe(0);
    expect(result.current.sourceDistanceInputValue).toBe("");
    expect(result.current.equivalents).toEqual([]);
  });

  it("должен возвращать пустой список при нулевых значениях", () => {
    const { result } = renderHook(() => useResultEquivalent());

    act(() => {
      result.current.handleSourceTimeChange("00:00:00");
    });

    expect(result.current.equivalents).toEqual([]);
  });
});
