export const DIARY_IMPORT_TEXT = {
  page: {
    title: "Импорт дневника из Excel",
    description:
      "Сначала импортируйте план. Дневник привяжет отчеты к существующим тренировкам по дате и порядку в дне.",
    dragText: "Перетащите файл дневника сюда или кликните для выбора",
    dragHint:
      "Поддерживается лист, название которого начинается с «Дневник», например «Дневник(2026)».",
    resultTitle: "Результат импорта",
    errorsTitle: "Ошибки строк:",
    warningsTitle: "Предупреждения:",
  },
  actions: {
    backToPlan: "Обратно к плану",
    upload: "Загрузить дневник",
  },
  messages: {
    fileRequired: "Выберите файл Excel",
    importFailed: "Не удалось импортировать дневник",
    importRequestError: "Ошибка запроса",
    importWithWarnings: (reportsUpserted: number, warningsCount: number) =>
      `Отчетов сохранено: ${reportsUpserted}, предупреждений: ${warningsCount}`,
    importSuccess: (reportsUpserted: number) => `Отчетов сохранено: ${reportsUpserted}`,
  },
  result: {
    summary: (params: {
      sheetName: string;
      parsedRows: number;
      matchedRows: number;
      skippedRows: number;
    }) =>
      `Лист «${params.sheetName}»: строк прочитано ${params.parsedRows}, привязано ${params.matchedRows}, пропущено ${params.skippedRows}.`,
    reports: (count: number) => `Отчеты: ${count}`,
    skippedReports: (count: number) => `Отчеты пропущены: ${count}`,
    weights: (count: number) => `Записи веса: ${count}`,
    recovery: (count: number) => `Записи восстановления: ${count}`,
    issue: (row: number, message: string) => `Строка ${row}: ${message}`,
  },
} as const;
