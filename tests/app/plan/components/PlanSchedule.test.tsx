import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { PlanSchedule } from "@/app/(protected)/plan/PlanClient/components/PlanSchedule/PlanSchedule";
import type { PlanDayEntry } from "@/app/(protected)/plan/PlanClient/types/planTypes";

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
});

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      href,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: React.ReactNode;
      href: string;
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

function createDay(overrides: Partial<PlanDayEntry> = {}): PlanDayEntry {
  return {
    date: "2023-10-01",
    workouts: [
      {
        id: 1,
        sessionOrder: 1,
        taskText: "Run 10km",
        commentText: "Easy pace",
        hasReport: false,
      },
    ],
    isWorkload: true,
    hasAnyReport: false,
    hasAllReports: false,
    reportedWorkoutCount: 0,
    workoutCount: 1,
    ...overrides,
  };
}

const defaultProps = {
  entries: [createDay()],
  loading: false,
  loadError: null,
  isFiltered: false,
  currentPage: 1,
  onPageChange: vi.fn(),
  onEditDay: vi.fn(),
  onShiftPlanFromDate: vi.fn(),
  onAddDay: vi.fn(),
  onRetry: vi.fn().mockResolvedValue(undefined),
  today: "2023-10-05",
};

describe("PlanSchedule", () => {
  it("рендерит одну адаптивную карточку без дублирования разметки", () => {
    render(<PlanSchedule {...defaultProps} />);

    expect(screen.getAllByText("Run 10km")).toHaveLength(1);
    expect(screen.getByText("1 октября")).toBeTruthy();
    expect(screen.getByText("Воскресенье, 2023")).toBeTruthy();
    expect(screen.getByText("0/1")).toBeTruthy();
  });

  it("вызывает действия карточки и формирует ссылку на дневник", () => {
    const onEditDay = vi.fn();
    const onShiftPlanFromDate = vi.fn();

    render(
      <PlanSchedule
        {...defaultProps}
        onEditDay={onEditDay}
        onShiftPlanFromDate={onShiftPlanFromDate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Редактировать день 2023-10-01" }));
    fireEvent.click(screen.getByRole("button", { name: "Сдвинуть план с 2023-10-01" }));

    const diaryLink = screen.getByRole("link", {
      name: "Открыть дневник на 2023-10-01",
    });

    expect(onEditDay).toHaveBeenCalledWith("2023-10-01");
    expect(onShiftPlanFromDate).toHaveBeenCalledWith("2023-10-01");
    expect(diaryLink.getAttribute("href")).toBe("/diary?date=2023-10-01");
  });

  it("отключает сдвиг при хотя бы одном заполненном отчете", () => {
    const partialDay = createDay({
      workouts: [
        {
          id: 1,
          sessionOrder: 1,
          taskText: "Intervals",
          commentText: null,
          hasReport: true,
        },
        {
          id: 2,
          sessionOrder: 2,
          taskText: "Cooldown",
          commentText: null,
          hasReport: false,
        },
      ],
      hasAnyReport: true,
      hasAllReports: false,
      reportedWorkoutCount: 1,
      workoutCount: 2,
    });
    const onShiftPlanFromDate = vi.fn();

    render(
      <PlanSchedule
        {...defaultProps}
        entries={[partialDay]}
        onShiftPlanFromDate={onShiftPlanFromDate}
      />
    );

    const shiftButton = screen.getByRole("button", {
      name: "Сдвинуть план с 2023-10-01",
    });

    expect(shiftButton).toHaveProperty("disabled", true);
    fireEvent.click(shiftButton);
    expect(onShiftPlanFromDate).not.toHaveBeenCalled();
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("показывает пустое состояние и позволяет добавить день", () => {
    const onAddDay = vi.fn();

    render(<PlanSchedule {...defaultProps} entries={[]} onAddDay={onAddDay} />);

    expect(screen.getByText("В плане пока нет тренировок")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Добавить день" }));
    expect(onAddDay).toHaveBeenCalledTimes(1);
  });

  it("объясняет пустой результат фильтра без предложения создать день", () => {
    render(<PlanSchedule {...defaultProps} entries={[]} isFiltered />);

    expect(screen.getByText("Все отчёты заполнены")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Добавить день" })).toBeNull();
  });

  it("показывает ошибку и повторяет загрузку", () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(
      <PlanSchedule {...defaultProps} entries={[]} loadError="Нет доступа" onRetry={onRetry} />
    );

    expect(screen.getByText("Не удалось загрузить план")).toBeTruthy();
    expect(screen.getByText("Нет доступа")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("переключает страницы длинного плана", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      createDay({
        date: "2023-10-" + String(index + 1).padStart(2, "0"),
        workouts: [
          {
            id: index + 1,
            sessionOrder: 1,
            taskText: "Workout " + String(index + 1),
            commentText: null,
            hasReport: false,
          },
        ],
      })
    );
    const onPageChange = vi.fn();

    render(<PlanSchedule {...defaultProps} entries={entries} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "right" }));
    expect(onPageChange).toHaveBeenCalledWith(2, 20);
  });
});
