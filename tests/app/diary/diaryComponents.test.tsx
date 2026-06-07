import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DailyReportModal } from "@/app/diary/DiaryClient/components/DailyReportModal/DailyReportModal";
import { DiaryStatusBlock } from "@/app/diary/DiaryClient/components/DiaryStatusBlock/DiaryStatusBlock";
import { RecoveryCard } from "@/app/diary/DiaryClient/components/RecoveryCard/RecoveryCard";
import { WeightCard } from "@/app/diary/DiaryClient/components/WeightCard/WeightCard";
import { WorkoutShoeMileageFields } from "@/app/diary/DiaryClient/components/WorkoutShoeMileageFields/WorkoutShoeMileageFields";

describe("DiaryClient components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("WeightCard должен отправлять изменения и сохранение по периодам", () => {
    const onChange = vi.fn();
    const onSave = vi.fn();

    render(
      <WeightCard
        title="Вес"
        morningPlaceholder="Утро"
        eveningPlaceholder="Вечер"
        saveLabel="Сохранить"
        weightForm={{ morning: "", evening: "" }}
        savingWeight={{ morning: false, evening: false }}
        onChange={onChange}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Утро"), { target: { value: "72" } });
    fireEvent.change(screen.getByPlaceholderText("Вечер"), { target: { value: "73" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Сохранить" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Сохранить" })[1]);

    expect(onChange).toHaveBeenNthCalledWith(1, "morning", "72");
    expect(onChange).toHaveBeenNthCalledWith(2, "evening", "73");
    expect(onSave).toHaveBeenNthCalledWith(1, "morning");
    expect(onSave).toHaveBeenNthCalledWith(2, "evening");
  });

  it("RecoveryCard должен отправлять отметки, нормализованный сон и сохранение", () => {
    const onToggle = vi.fn();
    const onSleepChange = vi.fn();
    const onSave = vi.fn();

    render(
      <RecoveryCard
        title="Восстановление"
        bathLabel="Баня"
        mfrLabel="МФР"
        massageLabel="Массаж"
        sleepLabel="Сон"
        sleepPlaceholder="07:30"
        saveLabel="Сохранить"
        recoveryForm={{
          hasBath: false,
          hasMfr: false,
          hasMassage: false,
          sleepHours: "",
        }}
        savingRecovery={false}
        onToggle={onToggle}
        onSleepChange={onSleepChange}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByLabelText("Баня"));
    fireEvent.click(screen.getByLabelText("МФР"));
    fireEvent.change(screen.getByPlaceholderText("07:30"), { target: { value: "0730" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onToggle).toHaveBeenNthCalledWith(1, "hasBath", true);
    expect(onToggle).toHaveBeenNthCalledWith(2, "hasMfr", true);
    expect(onSleepChange).toHaveBeenCalledWith("07:30");
    expect(onSave).toHaveBeenCalled();
  });

  it("DiaryStatusBlock должен показывать статусы и открывать отчет", () => {
    const onOpenReport = vi.fn();

    render(
      <DiaryStatusBlock
        status={{
          date: "2026-06-01",
          dayHasReport: true,
          hasWeightMorning: true,
          hasWeightEvening: false,
          workoutsWithFullReport: 1,
          workoutsTotal: 2,
          totalDistanceKm: 12.5,
        }}
        workoutsComplete={false}
        disabledReport={false}
        labels={{
          reportButton: "Отчет",
          dayComplete: "День заполнен",
          dayIncomplete: "День не заполнен",
          weightLabel: "Вес",
          weightMorningShort: "У",
          weightEveningShort: "В",
          workoutsLabel: "Тренировки",
        }}
        onOpenReport={onOpenReport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Отчет" }));

    expect(screen.getByText("День заполнен")).toBeTruthy();
    expect(screen.getByText("Вес: У / -")).toBeTruthy();
    expect(screen.getByText("Тренировки: 1/2")).toBeTruthy();
    expect(onOpenReport).toHaveBeenCalled();
  });

  it("WorkoutShoeMileageFields должен показывать выбранную обувь и менять пробег", () => {
    const onMileageChange = vi.fn();

    render(
      <WorkoutShoeMileageFields
        selectedShoeIds={[1, 9]}
        shoeMileageKm={{ 1: "5" }}
        shoeOptions={[{ value: 1, label: "Pegasus" }]}
        shoeLoading={false}
        shoePlaceholder="Обувь"
        mileagePlaceholder="Км"
        onShoeIdsChange={vi.fn()}
        onMileageChange={onMileageChange}
      />
    );

    fireEvent.change(screen.getAllByPlaceholderText("Км")[1], { target: { value: "3" } });

    expect(screen.getAllByText("Pegasus").length).toBeGreaterThan(0);
    expect(screen.getByText("#9")).toBeTruthy();
    expect(onMileageChange).toHaveBeenCalledWith(9, "3");
  });

  it("DailyReportModal должен копировать через clipboard и закрываться", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <DailyReportModal
        open
        title="Отчет"
        closeLabel="Закрыть"
        reportText="Текст отчета"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Скопировать отчет" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Текст отчета");
    });

    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("DailyReportModal должен использовать fallback copy при ошибке clipboard", async () => {
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("clipboard-failed")),
      },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommandMock,
    });

    render(
      <DailyReportModal
        open
        title="Отчет"
        closeLabel="Закрыть"
        reportText="Текст отчета"
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Скопировать отчет" }));

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    expect(consoleErrorMock).toHaveBeenCalled();
    consoleErrorMock.mockRestore();
  });
});
