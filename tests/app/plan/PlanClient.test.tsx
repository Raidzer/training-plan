import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanClient } from "@/app/(protected)/plan/PlanClient/PlanClient";

const planClientMocks = vi.hoisted(() => ({
  usePlanEntriesMock: vi.fn(),
  usePlanEditorMock: vi.fn(),
  usePlanShiftMock: vi.fn(),
  loadEntriesMock: vi.fn(),
  openCreateModalMock: vi.fn(),
  setOnlyWithoutReportsMock: vi.fn(),
  setSearchQueryMock: vi.fn(),
}));

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      href,
      passHref: _passHref,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: React.ReactNode;
      href: string;
      passHref?: boolean;
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("@/app/(protected)/plan/PlanClient/hooks/usePlanEntries", () => ({
  usePlanEntries: planClientMocks.usePlanEntriesMock,
}));

vi.mock("@/app/(protected)/plan/PlanClient/hooks/usePlanEditor", () => ({
  usePlanEditor: planClientMocks.usePlanEditorMock,
}));

vi.mock("@/app/(protected)/plan/PlanClient/hooks/usePlanShift", () => ({
  usePlanShift: planClientMocks.usePlanShiftMock,
}));

vi.mock("@/app/(protected)/plan/PlanClient/components/PlanEditorModal/PlanEditorModal", () => ({
  PlanEditorModal: () => <div data-testid="plan-editor-modal" />,
}));

vi.mock("@/app/(protected)/plan/PlanClient/components/PlanShiftModal/PlanShiftModal", () => ({
  PlanShiftModal: () => <div data-testid="plan-shift-modal" />,
}));

vi.mock("@/app/(protected)/plan/PlanClient/components/PlanSchedule/PlanSchedule", () => ({
  PlanSchedule: () => <div data-testid="plan-schedule" />,
}));

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

describe("PlanClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    planClientMocks.loadEntriesMock.mockResolvedValue(undefined);
    planClientMocks.usePlanEntriesMock.mockReturnValue({
      entries: [],
      setEntries: vi.fn(),
      filteredEntries: [],
      loadError: null,
      loading: false,
      currentPage: 1,
      setCurrentPage: vi.fn(),
      onlyWithoutReports: false,
      setOnlyWithoutReports: planClientMocks.setOnlyWithoutReportsMock,
      searchQuery: "",
      setSearchQuery: planClientMocks.setSearchQueryMock,
      today: "2026-06-10",
      loadEntries: planClientMocks.loadEntriesMock,
    });
    planClientMocks.usePlanEditorMock.mockReturnValue({
      editorOpen: false,
      saving: false,
      draft: null,
      draftDateValue: null,
      openCreateModal: planClientMocks.openCreateModalMock,
      openEditModal: vi.fn(),
      handleCancelEditor: vi.fn(),
      handleDateChange: vi.fn(),
      handleWorkloadChange: vi.fn(),
      updateEntry: vi.fn(),
      addEntry: vi.fn(),
      confirmRemoveEntry: vi.fn(),
      handleSaveDraft: vi.fn(),
      handleDeleteDay: vi.fn(),
    });
    planClientMocks.usePlanShiftMock.mockReturnValue({
      shiftOpen: false,
      shiftSaving: false,
      shiftDraft: null,
      shiftDateValue: null,
      openShiftModal: vi.fn(),
      handleCancelShift: vi.fn(),
      handleShiftDateChange: vi.fn(),
      handleShiftDirectionChange: vi.fn(),
      handleShiftDaysChange: vi.fn(),
      handleSaveShift: vi.fn(),
    });
  });

  it("должен показывать импорт плана и импорт дневника рядом", () => {
    render(<PlanClient />);

    expect(screen.getByRole("link", { name: "Импорт плана" }).getAttribute("href")).toBe(
      "/plan/import"
    );
    expect(screen.getByRole("link", { name: "Импорт дневника" }).getAttribute("href")).toBe(
      "/diary/import"
    );
    expect(screen.getByTestId("plan-schedule")).toBeTruthy();
  });

  it("должен переключать фильтр дней", () => {
    render(<PlanClient />);

    fireEvent.click(screen.getByRole("radio", { name: "Требуют отчёта" }));

    expect(planClientMocks.setOnlyWithoutReportsMock).toHaveBeenCalledWith(true);
  });

  it("должен искать тренировки по введенному тексту", () => {
    render(<PlanClient />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск тренировок" }), {
      target: { value: "интервалы" },
    });

    expect(planClientMocks.setSearchQueryMock).toHaveBeenCalledWith("интервалы");
  });
  it("должен открывать добавление дня и обновлять план", () => {
    render(<PlanClient />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить день" }));
    fireEvent.click(screen.getByRole("button", { name: "Обновить" }));

    expect(planClientMocks.openCreateModalMock).toHaveBeenCalledOnce();
    expect(planClientMocks.loadEntriesMock).toHaveBeenCalledOnce();
  });
});
