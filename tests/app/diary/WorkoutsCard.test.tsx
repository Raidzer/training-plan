import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorkoutsCard } from "@/app/diary/DiaryClient/components/WorkoutsCard";

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
  it("должен заменять resultText после применения конструктора", () => {
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
            distanceKm: "",
            overallScore: null,
            functionalScore: null,
            muscleScore: null,
            weather: "",
            hasWind: "",
            temperatureC: "",
            surface: "",
            shoeIds: [],
          },
        }}
        savingWorkouts={{}}
        onChange={onChange}
        onSave={vi.fn()}
      />
    );

    const constructorButton = document.querySelector("button.ant-btn-icon-only");
    expect(constructorButton).not.toBeNull();

    fireEvent.click(constructorButton as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "mock-apply-constructor" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1, "resultText", "constructor-result");
  });
});
