import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { PlanEntriesTable } from "./PlanEntriesTable";
import type { PlanDayEntry } from "../planUtils";

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
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe("PlanEntriesTable", () => {
  const mockEntries: PlanDayEntry[] = [
    {
      date: "2023-10-01",
      taskText: "Run 10km",
      commentText: "Easy pace",
      isWorkload: true,
      hasReport: false,
    },
    {
      date: "2023-10-02",
      taskText: "Rest",
      commentText: null,
      isWorkload: false,
      hasReport: true,
    },
  ];

  const defaultProps = {
    entries: mockEntries,
    loading: false,
    currentPage: 1,
    onPageChange: vi.fn(),
    onEditDay: vi.fn(),
    today: "2023-10-05",
  };

  it("должен рендерить записи таблицы", () => {
    render(<PlanEntriesTable {...defaultProps} />);

    expect(screen.getAllByText("Run 10km").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rest").length).toBeGreaterThan(0);
  });

  it("должен отображать дату с днем недели", () => {
    render(<PlanEntriesTable {...defaultProps} />);

    expect(screen.getAllByText("2023-10-01 (Вс)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2023-10-02 (Пн)").length).toBeGreaterThan(0);
  });

  it("должен рендерить тег отчета если hasReport=true", () => {
    render(<PlanEntriesTable {...defaultProps} />);
    const elements = screen.getAllByText("Заполнен");
    expect(elements.length).toBeGreaterThan(0);
  });
});
