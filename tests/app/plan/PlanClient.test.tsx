import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanClient } from "@/app/(protected)/plan/PlanClient/PlanClient";

const planClientMocks = vi.hoisted(() => ({
  usePlanEntriesMock: vi.fn(),
  usePlanEditorMock: vi.fn(),
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

vi.mock("@/app/(protected)/plan/PlanClient/components/PlanEditorModal/PlanEditorModal", () => ({
  PlanEditorModal: () => <div data-testid="plan-editor-modal" />,
}));

vi.mock("@/app/(protected)/plan/PlanClient/components/PlanEntriesTable/PlanEntriesTable", () => ({
  PlanEntriesTable: () => <div data-testid="plan-entries-table" />,
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
    planClientMocks.usePlanEntriesMock.mockReturnValue({
      entries: [],
      setEntries: vi.fn(),
      filteredEntries: [],
      loading: false,
      currentPage: 1,
      setCurrentPage: vi.fn(),
      onlyWithoutReports: false,
      setOnlyWithoutReports: vi.fn(),
      today: "2026-06-10",
      loadEntries: vi.fn(),
    });
    planClientMocks.usePlanEditorMock.mockReturnValue({
      editorOpen: false,
      saving: false,
      draft: null,
      draftDateValue: null,
      openCreateModal: vi.fn(),
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
  });

  it("должен показывать импорт плана и импорт дневника рядом", () => {
    render(<PlanClient />);

    expect(screen.getByRole("link", { name: "Загрузить план из Excel" }).getAttribute("href")).toBe(
      "/plan/import"
    );
    expect(
      screen.getByRole("link", { name: "Загрузить дневник из Excel" }).getAttribute("href")
    ).toBe("/diary/import");
  });
});
