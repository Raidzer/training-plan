import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorkoutsCard } from "@/app/(protected)/diary/DiaryClient/components/WorkoutsCard/WorkoutsCard";
import { toDefaultWorkoutForm } from "@/app/(protected)/diary/DiaryClient/utils/diaryUtils";
import { YES_NO_OPTIONS } from "@/app/(protected)/diary/DiaryClient/constants/diaryConstants";

const WORKOUTS_CARD_TEST_TIMEOUT_MS = 10000;

vi.mock("@/components/templates/TemplateConstructorModal", () => {
  return {
    TemplateConstructorModal: ({
      visible,
      onApply,
    }: {
      visible: boolean;
      onApply: (resultText: string) => void;
    }) => {
      if (!visible) {
        return null;
      }
      return (
        <button type="button" onClick={() => onApply("constructor-result")}>
          mock-apply-constructor
        </button>
      );
    },
  };
});

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorkoutsCard", () => {
  it(
    "должен заменять resultText после применения конструктора",
    () => {
      const onChange = vi.fn();

      render(
        <WorkoutsCard
          userId={1}
          messageApi={{} as any}
          title="Workouts"
          emptyLabel="Empty"
          completeLabel="Complete"
          incompleteLabel="Incomplete"
          startTimePlaceholder="Start"
          resultPlaceholder="Result"
          distancePlaceholder="Distance"
          overallScoreLabel="Overall"
          functionalScoreLabel="Functional"
          muscleScoreLabel="Muscle"
          scorePlaceholder="Score"
          surfacePlaceholder="Surface"
          shoePlaceholder="Shoes"
          shoeMileagePlaceholder="Shoe mileage"
          weatherPlaceholder="Weather"
          windPlaceholder="Wind"
          temperaturePlaceholder="Temperature"
          commentPlaceholder="Comment"
          saveReportLabel="Save"
          surfaceOptions={[
            { value: "asphalt", label: "Асфальт" },
            { value: "manezh", label: "Манеж" },
          ]}
          shoeOptions={[]}
          weatherOptions={[{ value: "sunny", label: "Солнечно" }]}
          windOptions={[{ value: "true", label: "Есть" }]}
          shoeLoading={false}
          entries={[
            {
              id: 1,
              date: "2026-02-09",
              sessionOrder: 1,
              taskText: "12x200",
              commentText: null,
              isWorkload: true,
            },
          ]}
          workoutForm={{
            1: {
              startTime: "09:30",
              resultText: "old-result",
              commentText: "old-comment",
              hasLongBottom: false,
              distanceKm: "",
              overallScore: null,
              functionalScore: null,
              muscleScore: null,
              weather: "",
              hasWind: "",
              temperatureC: "",
              surface: "",
              shoeIds: [],
              shoeMileageKm: {},
            },
          }}
          savingWorkouts={{}}
          onChange={onChange}
          onSave={vi.fn()}
        />
      );

      expect(
        screen.getByRole("tab", {
          name: "Тренировка 1, Complete",
        })
      ).toBeTruthy();
      expect(screen.getAllByText("Тренировка 1")).toHaveLength(1);

      const constructorButton = screen.getByRole("button", { name: "Конструктор отчёта" });

      fireEvent.click(constructorButton);
      fireEvent.click(screen.getByRole("button", { name: "mock-apply-constructor" }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(1, "resultText", "constructor-result");
    },
    WORKOUTS_CARD_TEST_TIMEOUT_MS
  );

  it(
    "должен переключать тренировки табами и сохранять их отдельные действия",
    async () => {
      const onEditWorkout = vi.fn();
      const onChange = vi.fn();

      render(
        <WorkoutsCard
          userId={1}
          messageApi={{} as any}
          title="Workouts"
          emptyLabel="Empty"
          completeLabel="Complete"
          incompleteLabel="Incomplete"
          startTimePlaceholder="Start"
          resultPlaceholder="Result"
          distancePlaceholder="Distance"
          overallScoreLabel="Overall"
          functionalScoreLabel="Functional"
          muscleScoreLabel="Muscle"
          scorePlaceholder="Score"
          surfacePlaceholder="Surface"
          shoePlaceholder="Shoes"
          shoeMileagePlaceholder="Shoe mileage"
          weatherPlaceholder="Weather"
          windPlaceholder="Wind"
          temperaturePlaceholder="Temperature"
          commentPlaceholder="Comment"
          saveReportLabel="Save"
          editWorkoutLabel="Редактировать тренировку"
          surfaceOptions={[
            { value: "asphalt", label: "Асфальт" },
            { value: "manezh", label: "Манеж" },
          ]}
          shoeOptions={[]}
          weatherOptions={[{ value: "sunny", label: "Солнечно" }]}
          windOptions={YES_NO_OPTIONS}
          shoeLoading={false}
          entries={[
            {
              id: 1,
              date: "2026-02-09",
              sessionOrder: 1,
              taskText: "Кросс 8 км",
              commentText: null,
              isWorkload: true,
            },
            {
              id: 2,
              date: "2026-02-09",
              sessionOrder: 2,
              taskText: "ОФП",
              commentText: "зал",
              isWorkload: true,
            },
          ]}
          workoutForm={{ 1: { ...toDefaultWorkoutForm(), hasLongBottom: true } }}
          savingWorkouts={{}}
          onChange={onChange}
          onSave={vi.fn()}
          onEditWorkout={onEditWorkout}
        />
      );

      const firstTab = screen.getByRole("tab", {
        name: "Тренировка 1, Incomplete",
      });
      const secondTab = screen.getByRole("tab", {
        name: "Тренировка 2, Incomplete",
      });

      expect(firstTab.getAttribute("aria-selected")).toBe("true");
      expect(secondTab.getAttribute("aria-selected")).toBe("false");

      expect(screen.queryByRole("checkbox", { name: "Длинный низ" })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Оценка тренировки", expanded: true })
      ).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Условия и экипировка", expanded: true })
      ).toBeTruthy();
      expect(screen.getByRole("spinbutton", { name: "Overall" })).toBeTruthy();
      const firstLongBottom = screen.getByRole("combobox", { name: "Длинный низ" });
      expect(firstLongBottom.closest(".ant-select")?.textContent).toContain("Да");
      fireEvent.mouseDown(firstLongBottom);
      fireEvent.click(
        await screen.findByText("Нет", { selector: ".ant-select-item-option-content" })
      );
      expect(onChange).toHaveBeenNthCalledWith(1, 1, "hasLongBottom", false);

      fireEvent.click(
        screen.getByRole("button", {
          name: "Редактировать тренировку 1",
        })
      );
      fireEvent.click(secondTab);
      expect(
        screen.getByRole("button", { name: "Оценка тренировки", expanded: true })
      ).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Условия и экипировка", expanded: true })
      ).toBeTruthy();
      expect(screen.getByRole("spinbutton", { name: "Overall" })).toBeTruthy();
      const secondLongBottom = screen.getByRole("combobox", { name: "Длинный низ" });
      const wind = screen.getByRole("combobox", { name: "Wind" });
      expect(secondLongBottom.closest(".ant-select")?.textContent).toContain("Нет");
      expect(wind.closest(".ant-select")?.textContent).toContain("Нет");
      fireEvent.mouseDown(secondLongBottom);
      fireEvent.keyDown(secondLongBottom, { key: "ArrowDown", keyCode: 40 });
      fireEvent.keyDown(secondLongBottom, { key: "Enter", keyCode: 13 });
      expect(onChange).toHaveBeenNthCalledWith(2, 2, "hasLongBottom", true);
      fireEvent.click(
        screen.getByRole("button", {
          name: "Редактировать тренировку 2",
        })
      );

      expect(secondTab.getAttribute("aria-selected")).toBe("true");
      expect(onEditWorkout).toHaveBeenNthCalledWith(1, 1);
      expect(onEditWorkout).toHaveBeenNthCalledWith(2, 2);

      for (const name of ["Оценка тренировки", "Условия и экипировка"]) {
        fireEvent.click(screen.getByRole("button", { name, expanded: true }));
        fireEvent.click(screen.getByRole("button", { name, expanded: false }));
        expect(screen.getByRole("button", { name, expanded: true })).toBeTruthy();
      }
    },
    WORKOUTS_CARD_TEST_TIMEOUT_MS
  );
});
