import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const diaryClientMocks = vi.hoisted(() => ({
  useDiaryDataMock: vi.fn(),
  handleSaveRecoveryMock: vi.fn(),
  handleSaveWeightMock: vi.fn(),
  handleSaveWorkoutMock: vi.fn(),
  setPanelDateMock: vi.fn(),
  updateSelectedDateMock: vi.fn(),
}));

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    Card: ({ children, loading, title }: any) => (
      <section data-loading={String(Boolean(loading))}>
        <h2>{title}</h2>
        {children}
      </section>
    ),
    message: {
      ...actual.message,
      useMessage: () => [{}, <div key="holder" data-testid="context-holder" />],
    },
  };
});

vi.mock("@/app/diary/DiaryClient/hooks/useDiaryData", () => ({
  useDiaryData: diaryClientMocks.useDiaryDataMock,
}));

vi.mock("@/app/diary/DiaryClient/components/DiaryHeader/DiaryHeader", () => ({
  DiaryHeader: ({ title }: { title: string }) => <header>{title}</header>,
}));

vi.mock("@/app/diary/DiaryClient/components/DiaryCalendar/DiaryCalendar", () => ({
  DiaryCalendar: ({ onPanelChange, onSelectDate, selectedDate, title }: any) => (
    <section>
      <h3>{title}</h3>
      <button type="button" onClick={() => onSelectDate(selectedDate.add(1, "day"))}>
        select-date
      </button>
      <button type="button" onClick={() => onPanelChange(selectedDate.add(1, "month"))}>
        panel-change
      </button>
    </section>
  ),
}));

vi.mock("@/app/diary/DiaryClient/components/DiaryStatusBlock/DiaryStatusBlock", () => ({
  DiaryStatusBlock: ({ disabledReport, onOpenReport }: any) => (
    <button type="button" disabled={disabledReport} onClick={onOpenReport}>
      open-report
    </button>
  ),
}));

vi.mock("@/app/diary/DiaryClient/components/WeightCard/WeightCard", () => ({
  WeightCard: ({ onChange, onSave }: any) => (
    <section>
      <button type="button" onClick={() => onChange("morning", "72")}>
        change-weight
      </button>
      <button type="button" onClick={() => onSave("morning")}>
        save-weight
      </button>
    </section>
  ),
}));

vi.mock("@/app/diary/DiaryClient/components/RecoveryCard/RecoveryCard", () => ({
  RecoveryCard: ({ onSave, onSleepChange, onToggle }: any) => (
    <section>
      <button type="button" onClick={() => onToggle("hasBath", true)}>
        toggle-recovery
      </button>
      <button type="button" onClick={() => onSleepChange("07:30")}>
        sleep-recovery
      </button>
      <button type="button" onClick={onSave}>
        save-recovery
      </button>
    </section>
  ),
}));

vi.mock("@/app/diary/DiaryClient/components/WorkoutsCard/WorkoutsCard", () => ({
  WorkoutsCard: ({ onChange, onSave }: any) => (
    <section>
      <button type="button" onClick={() => onChange(101, "resultText", "готово")}>
        workout-result
      </button>
      <button type="button" onClick={() => onChange(101, "weather", "rain")}>
        workout-weather
      </button>
      <button type="button" onClick={() => onChange(101, "surface", "manezh")}>
        workout-indoor
      </button>
      <button type="button" onClick={() => onChange(101, "surface", "asphalt")}>
        workout-outdoor
      </button>
      <button type="button" onClick={() => onChange(101, "shoeIds", [1, 2])}>
        workout-shoes
      </button>
      <button type="button" onClick={() => onChange(101, "shoeMileageKm", { 1: "5" })}>
        workout-mileage
      </button>
      <button type="button" onClick={() => onChange(101, "shoeMileageKm", null)}>
        workout-mileage-reset
      </button>
      <button type="button" onClick={() => onSave(101)}>
        save-workout
      </button>
    </section>
  ),
}));

vi.mock("@/app/diary/DiaryClient/components/DailyReportModal/DailyReportModal", () => ({
  DailyReportModal: ({ onClose, open, reportText, title }: any) => {
    if (!open) {
      return null;
    }

    return (
      <section>
        <h3>{title}</h3>
        <pre>{reportText}</pre>
        <button type="button" onClick={onClose}>
          close-report
        </button>
      </section>
    );
  },
}));

import { DiaryClient } from "@/app/diary/DiaryClient/DiaryClient";

function createDiaryData(overrides: Record<string, unknown> = {}) {
  let weightState = {
    morning: "",
    evening: "",
  };
  let recoveryState = {
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    sleepHours: "",
  };
  let workoutState: Record<number, any> = {};

  const setWeightForm = vi.fn((updater) => {
    weightState = typeof updater === "function" ? updater(weightState) : updater;
  });
  const setRecoveryForm = vi.fn((updater) => {
    recoveryState = typeof updater === "function" ? updater(recoveryState) : updater;
  });
  const setWorkoutForm = vi.fn((updater) => {
    workoutState = typeof updater === "function" ? updater(workoutState) : updater;
  });

  return {
    selectedDate: dayjs("2026-05-11"),
    setPanelDate: diaryClientMocks.setPanelDateMock,
    marks: {
      "2026-05-11": {
        dayHasReport: true,
      },
    },
    loadingMarks: false,
    dayData: {
      status: {
        dayHasReport: true,
        hasWeightMorning: true,
        hasWeightEvening: false,
        workoutsWithFullReport: 1,
        workoutsTotal: 1,
        totalDistanceKm: 10,
      },
      planEntries: [
        {
          id: 101,
          date: "2026-05-11",
          sessionOrder: 1,
          taskText: "Кросс",
          commentText: null,
          isWorkload: false,
        },
      ],
      workoutReports: [
        {
          planEntryId: 101,
          startTime: "09:00",
          resultText: "10 км",
          commentText: null,
          overallScore: null,
          functionalScore: null,
          muscleScore: null,
          weather: null,
          hasWind: null,
          temperatureC: null,
          surface: null,
          shoes: [],
        },
      ],
      weightEntries: [{ period: "morning", weightKg: "72" }],
      recoveryEntry: {
        hasBath: false,
        hasMfr: false,
        hasMassage: false,
        sleepHours: "7.5",
      },
      previousEveningWeightKg: null,
    },
    loadingDay: false,
    weightForm: weightState,
    setWeightForm,
    recoveryForm: recoveryState,
    setRecoveryForm,
    savingWeight: {
      morning: false,
      evening: false,
    },
    savingRecovery: false,
    workoutForm: workoutState,
    setWorkoutForm,
    savingWorkouts: {},
    shoes: [{ id: 1, name: "Pegasus" }],
    loadingShoes: false,
    updateSelectedDate: diaryClientMocks.updateSelectedDateMock,
    handleSaveWeight: diaryClientMocks.handleSaveWeightMock,
    handleSaveWorkout: diaryClientMocks.handleSaveWorkoutMock,
    handleSaveRecovery: diaryClientMocks.handleSaveRecoveryMock,
    getWeightState: () => weightState,
    getRecoveryState: () => recoveryState,
    getWorkoutState: () => workoutState,
    ...overrides,
  };
}

describe("DiaryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    diaryClientMocks.useDiaryDataMock.mockReturnValue(createDiaryData());
  });

  it("должен связывать дочерние действия с состоянием дневника", () => {
    const diaryData = createDiaryData();
    diaryClientMocks.useDiaryDataMock.mockReturnValue(diaryData);

    render(<DiaryClient userId={20} />);

    fireEvent.click(screen.getByRole("button", { name: "select-date" }));
    fireEvent.click(screen.getByRole("button", { name: "panel-change" }));
    fireEvent.click(screen.getByRole("button", { name: "change-weight" }));
    fireEvent.click(screen.getByRole("button", { name: "save-weight" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle-recovery" }));
    fireEvent.click(screen.getByRole("button", { name: "sleep-recovery" }));
    fireEvent.click(screen.getByRole("button", { name: "save-recovery" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-result" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-weather" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-indoor" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-shoes" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-mileage" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-mileage-reset" }));
    fireEvent.click(screen.getByRole("button", { name: "workout-outdoor" }));
    fireEvent.click(screen.getByRole("button", { name: "save-workout" }));

    expect(diaryClientMocks.updateSelectedDateMock.mock.calls[0]?.[0].format("YYYY-MM-DD")).toBe(
      "2026-05-12"
    );
    expect(diaryClientMocks.setPanelDateMock.mock.calls[0]?.[0].format("YYYY-MM-DD")).toBe(
      "2026-06-11"
    );
    expect(diaryData.getWeightState().morning).toBe("72");
    expect(diaryData.getRecoveryState()).toEqual(
      expect.objectContaining({
        hasBath: true,
        sleepHours: "07:30",
      })
    );
    expect(diaryData.getWorkoutState()[101]).toEqual(
      expect.objectContaining({
        resultText: "готово",
        surface: "asphalt",
        shoeIds: [1, 2],
      })
    );
    expect(diaryData.getWorkoutState()[101].weather).toBe("");
    expect(diaryData.getWorkoutState()[101].shoeMileageKm).toEqual({});
    expect(diaryClientMocks.handleSaveWeightMock).toHaveBeenCalledWith("morning");
    expect(diaryClientMocks.handleSaveRecoveryMock).toHaveBeenCalled();
    expect(diaryClientMocks.handleSaveWorkoutMock).toHaveBeenCalledWith(101);
  });

  it("должен открывать и закрывать отчет только для загруженного дня", () => {
    render(<DiaryClient userId={20} />);

    fireEvent.click(screen.getByRole("button", { name: "open-report" }));

    expect(screen.getByText("Ежедневный отчет")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "close-report" }));

    expect(screen.queryByText("Ежедневный отчет")).toBeNull();
  });

  it("должен отключать отчет когда данные дня еще не загружены", () => {
    diaryClientMocks.useDiaryDataMock.mockReturnValue(
      createDiaryData({
        dayData: null,
        loadingDay: true,
        loadingMarks: true,
        marks: {},
      })
    );

    render(<DiaryClient userId={20} />);

    expect(screen.getByRole("button", { name: "open-report" })).toHaveProperty("disabled", true);
  });
});
