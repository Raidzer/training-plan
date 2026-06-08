import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";
import { useSpeedToPace } from "@/app/tools/speed-to-pace/SpeedToPaceClient/hooks/useSpeedToPace";

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

  it("должен пересчитывать состояние из m/s, mph и pace на милю", () => {
    const { result } = renderHook(() => useSpeedToPace());

    act(() => {
      result.current.handleSpeedMpsChange({
        target: { value: "3.5" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedMpsString).toBe("3,5");
    expect(result.current.speedKmh).toBeCloseTo(12.6, 1);

    act(() => {
      result.current.handleSpeedMphChange({
        target: { value: "8" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedMphString).toBe("8");
    expect(result.current.speedKmh).toBeCloseTo(12.87, 2);

    act(() => {
      result.current.handlePaceMileTimeChange("07:30");
    });

    expect(result.current.paceMileTimeString).toBe("07:30");
    expect(result.current.speedMph).toBe(8);
  });

  it("должен сбрасывать значения при нечисловом и отрицательном вводе", () => {
    const { result } = renderHook(() => useSpeedToPace());

    act(() => {
      result.current.handleSpeedMpsChange({
        target: { value: "abc" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedKmh).toBe(0);

    act(() => {
      result.current.handleSpeedMphChange({
        target: { value: "-5" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.speedMph).toBe(0);

    act(() => {
      result.current.handlePaceMileTimeChange("00:00");
    });

    expect(result.current.paceMileMinutes).toBe(0);
  });
});
