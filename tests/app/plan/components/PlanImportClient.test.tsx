import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanImportClient } from "@/app/(protected)/plan/PlanClient/components/PlanImportClient/PlanImportClient";
import type { PlanImportFile } from "@/app/(protected)/plan/PlanClient/types/planTypes";

const { handleFileChangeMock, handleFileRemoveMock, handleUploadMock, usePlanImportMock } =
  vi.hoisted(() => ({
    handleFileChangeMock: vi.fn(),
    handleFileRemoveMock: vi.fn(() => true),
    handleUploadMock: vi.fn().mockResolvedValue(undefined),
    usePlanImportMock: vi.fn(),
  }));

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      className,
      href,
    }: {
      children: ReactNode;
      className?: string;
      href: string;
    }) => (
      <a className={className} href={href}>
        {children}
      </a>
    ),
  };
});

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();

  return {
    ...actual,
    message: {
      ...actual.message,
      useMessage: () => [{}, null],
    },
  };
});

vi.mock("@/app/(protected)/plan/PlanClient/hooks/usePlanImport", () => ({
  usePlanImport: usePlanImportMock,
}));

function setHookResult({
  fileList = [],
  loading = false,
  result = null,
}: {
  fileList?: PlanImportFile[];
  loading?: boolean;
  result?: {
    importId: number;
    inserted: number;
    skipped: number;
    errors: [];
  } | null;
} = {}) {
  usePlanImportMock.mockReturnValue({
    fileList,
    loading,
    result,
    handleFileChange: handleFileChangeMock,
    handleFileRemove: handleFileRemoveMock,
    handleUpload: handleUploadMock,
  });
}

describe("PlanImportClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHookResult();
  });

  it("рендерит структуру импорта и запускает загрузку через форму", () => {
    render(<PlanImportClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Импорт плана" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Файл плана" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Как подготовить файл" })).toBeTruthy();
    expect(screen.getByRole("table", { name: "Структура первого листа Excel" })).toBeTruthy();
    expect(
      screen
        .getByRole("region", { name: "Пример структуры первого листа Excel" })
        .getAttribute("tabindex")
    ).toBe("0");
    expect(screen.getByRole("link", { name: "К плану" }).getAttribute("href")).toBe("/plan");

    fireEvent.click(screen.getByRole("button", { name: "Импортировать план" }));
    expect(handleUploadMock).toHaveBeenCalledTimes(1);
  });

  it("показывает выбранный файл и состояние загрузки", () => {
    const file = {
      uid: "plan-file",
      name: "summer-plan.xlsx",
      originFileObj: new File(["plan"], "summer-plan.xlsx"),
    } as PlanImportFile;
    setHookResult({ fileList: [file], loading: true });

    render(<PlanImportClient />);

    expect(screen.getByText("Проверяем структуру файла и добавляем новые даты.")).toBeTruthy();
    expect(screen.getByText("summer-plan.xlsx")).toBeTruthy();
  });

  it("показывает результат после завершения импорта", () => {
    setHookResult({
      result: {
        importId: 9,
        inserted: 6,
        skipped: 0,
        errors: [],
      },
    });

    render(<PlanImportClient />);

    const uploadHeading = screen.getByRole("heading", { name: "Файл плана" });
    const resultHeading = screen.getByRole("heading", { name: "План импортирован" });
    const guideHeading = screen.getByRole("heading", { name: "Как подготовить файл" });

    expect(
      uploadHeading.compareDocumentPosition(resultHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      resultHeading.compareDocumentPosition(guideHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
  });
});
