import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";
import { useSpeedToPace } from "@/app/tools/speed-to-pace/useSpeedToPace";

describe("useSpeedToPace", () => {
  it("должен инициализировать со скоростью по умолчанию в km/h", () => {
    const { result } = renderHook(() => useSpeedToPace());

    expect(result.current.speedKmh).toBe(10);
    expect(result.current.speedMps).toBeCloseTo(2.78, 2);
    expect(result.current.paceKmTimeString).toBe("06:00");
  });

  it("должен пересчитывать состояние из ввода km/h", () => {
    const { result } = renderHook(() => useSpeedToPace());

    act(() => {
      result.current.handleSpeedKmhChange({
        target: { value: "12,5" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedKmhString).toBe("12,5");
    expect(result.current.speedMps).toBeCloseTo(3.47, 2);
    expect(result.current.paceKmTimeString).toBe("04:48");
  });

  it("должен пересчитывать состояние из ввода pace и сохранять активное значение ввода", () => {
    const { result } = renderHook(() => useSpeedToPace());

    act(() => {
      result.current.handlePaceKmTimeChange("04:30");
    });

    expect(result.current.paceKmTimeString).toBe("04:30");
    expect(result.current.speedKmh).toBeCloseTo(13.33, 2);
    expect(result.current.paceMileMinutes).toBeGreaterThan(0);
  });

  it("должен сбрасывать значения при нулевом вводе скорости", () => {
    const { result } = renderHook(() => useSpeedToPace());

    act(() => {
      result.current.handleSpeedKmhChange({
        target: { value: "0" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedKmh).toBe(0);
    expect(result.current.paceKmMinutes).toBe(0);
    expect(result.current.paceMileMinutes).toBe(0);
  });
});
