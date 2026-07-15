import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiaryImportClient } from "@/app/(protected)/diary/import/DiaryImportClient/DiaryImportClient";
import type {
  DiaryImportFile,
  DiaryImportResult,
} from "@/app/(protected)/diary/import/DiaryImportClient/types/diaryImportTypes";

const { handleFileChangeMock, handleFileRemoveMock, handleUploadMock, useDiaryImportMock } =
  vi.hoisted(() => ({
    handleFileChangeMock: vi.fn(),
    handleFileRemoveMock: vi.fn(() => true),
    handleUploadMock: vi.fn().mockResolvedValue(undefined),
    useDiaryImportMock: vi.fn(),
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

vi.mock("@/app/(protected)/diary/import/DiaryImportClient/hooks/useDiaryImport", () => ({
  useDiaryImport: useDiaryImportMock,
}));

function setHookResult({
  fileList = [],
  fileError = null,
  loading = false,
  result = null,
}: {
  fileList?: DiaryImportFile[];
  fileError?: string | null;
  loading?: boolean;
  result?: DiaryImportResult | null;
} = {}) {
  useDiaryImportMock.mockReturnValue({
    fileList,
    fileError,
    loading,
    result,
    handleFileChange: handleFileChangeMock,
    handleFileRemove: handleFileRemoveMock,
    handleUpload: handleUploadMock,
  });
}

describe("DiaryImportClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHookResult();
  });

  it("рендерит структуру импорта и запускает загрузку через форму", () => {
    render(<DiaryImportClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Импорт дневника" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Файл дневника" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Как строки связываются с планом" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Маршрут привязки строки" })).toBeTruthy();
    expect(screen.getByText("15.06.2026 · № 2 в дне")).toBeTruthy();
    expect(screen.getByRole("link", { name: "К плану" }).getAttribute("href")).toBe("/plan");

    const submitButton = screen.getByRole("button", { name: "Импортировать дневник" });
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitButton);
    expect(handleUploadMock).toHaveBeenCalledTimes(1);
  });

  it("показывает выбранный файл и состояние загрузки", () => {
    const file = {
      uid: "diary-file",
      name: "summer-diary.xlsx",
      originFileObj: new File(["diary"], "summer-diary.xlsx"),
    } as DiaryImportFile;
    setHookResult({ fileList: [file], loading: true });

    render(<DiaryImportClient />);

    expect(
      screen.getByText("Сопоставляем строки с планом и сохраняем данные дневника.")
    ).toBeTruthy();
    expect(screen.getByText("summer-diary.xlsx")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Файл дневника" }).getAttribute("aria-busy")).toBe(
      "true"
    );
    expect(
      (
        screen.getByRole("button", {
          name: "loading Импортировать дневник",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("показывает постоянную подсказку после отправки без файла", () => {
    setHookResult({ fileError: "Выберите файл Excel" });

    render(<DiaryImportClient />);

    expect(screen.getByText("Выберите файл Excel")).toBeTruthy();
  });

  it("показывает результат сразу после загрузки в порядке для мобильного экрана", () => {
    setHookResult({
      result: {
        sheetName: "Дневник(2026)",
        parsedRows: 5,
        matchedRows: 4,
        reportsUpserted: 4,
        reportsSkipped: 0,
        weightEntriesUpserted: 3,
        recoveryEntriesUpserted: 2,
        skippedRows: 1,
        errors: [],
        warnings: [],
      },
    });

    render(<DiaryImportClient />);

    const uploadHeading = screen.getByRole("heading", { name: "Файл дневника" });
    const resultHeading = screen.getByRole("heading", { name: "Дневник импортирован" });
    const guideHeading = screen.getByRole("heading", { name: "Как строки связываются с планом" });

    expect(
      uploadHeading.compareDocumentPosition(resultHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      resultHeading.compareDocumentPosition(guideHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Открыть дневник за период" }).getAttribute("href")
    ).toBe("/diary/period");
  });
});
