import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SpeedToPacePage, { metadata } from "@/app/tools/speed-to-pace/page";
import { SpeedToPaceClient } from "@/app/tools/speed-to-pace/SpeedToPaceClient/SpeedToPaceClient";
import { SPEED_TO_PACE_TEXT } from "@/app/tools/speed-to-pace/SpeedToPaceClient/constants/speedToPaceConstants";

describe("SpeedToPaceClient", () => {
  it("показывает семантическую форму с видимыми группами и подписями", () => {
    render(<SpeedToPaceClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: SPEED_TO_PACE_TEXT.header.title })
    ).toBeTruthy();
    expect(
      screen.getByRole("form", { name: SPEED_TO_PACE_TEXT.converter.formAriaLabel })
    ).toBeTruthy();
    expect(screen.getByRole("group", { name: SPEED_TO_PACE_TEXT.speed.title })).toBeTruthy();
    expect(screen.getByRole("group", { name: SPEED_TO_PACE_TEXT.pace.title })).toBeTruthy();
    expect(screen.getByLabelText(SPEED_TO_PACE_TEXT.speed.kmhLabel)).toBeTruthy();
    expect(screen.getByLabelText(SPEED_TO_PACE_TEXT.pace.kmLabel)).toBeTruthy();
  });

  it("пересчитывает связанные поля при редактировании скорости", () => {
    render(<SpeedToPaceClient />);

    fireEvent.change(screen.getByLabelText(SPEED_TO_PACE_TEXT.speed.kmhLabel), {
      target: { value: "12" },
    });

    expect(screen.getByLabelText<HTMLInputElement>(SPEED_TO_PACE_TEXT.speed.kmhLabel).value).toBe(
      "12"
    );
    expect(screen.getByLabelText<HTMLInputElement>(SPEED_TO_PACE_TEXT.speed.mpsLabel).value).toBe(
      "3,33"
    );
    expect(screen.getByLabelText<HTMLInputElement>(SPEED_TO_PACE_TEXT.pace.kmLabel).value).toBe(
      "05:00"
    );
  });

  it("скрывает собственный h1 внутри публичной оболочки", () => {
    render(<SpeedToPaceClient showIntro={false} />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: SPEED_TO_PACE_TEXT.converter.title })
    ).toBeTruthy();
  });

  it("оборачивается публичным shell и задаёт метаинформацию", () => {
    render(<SpeedToPacePage />);

    expect(metadata.title).toBe("Перевод скорости в темп | СПИРОС");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("navigation", { name: "Переключение беговых инструментов" })
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Скорость и темп/ }).getAttribute("aria-current")).toBe(
      "page"
    );
  });
});
