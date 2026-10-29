export const COMPETITION_RESULT_TEXT = {
  promptPrefix: "Введите результат соревнования",
  stale: "Этот запрос уже неактуален. Проверьте результат соревнования на сайте.",
  busy: "Сначала завершите текущий ввод или вернитесь в главное меню, затем нажмите кнопку результата ещё раз.",
  invalidTime:
    "Введите положительное время в формате MM:SS или HH:MM:SS, например 39:30 или 01:42:15. Допустимы десятые и сотые. Ответьте на исходное приглашение ввода.",
  error:
    "Не удалось выполнить действие. Попробуйте ещё раз той же кнопкой или ответьте на приглашение ввода.",
  recordCheckError:
    "Результат соревнования сохранён, но проверить личный рекорд не удалось. Его можно добавить на сайте в личных рекордах.",
  invalidCurrentRecord:
    "Результат соревнования сохранён, но время прежнего рекорда не удалось распознать. Проверьте его на сайте в личных рекордах.",
  recordSaved: "Личный рекорд сохранён. Поздравляем!",
  recordNotBetter: "Уже сохранён равный или более быстрый личный рекорд. Изменений нет.",
  recordConflict: "Рекорд изменился во время подтверждения. Проверьте актуальную запись на сайте.",
  recordDismissed: "Результат соревнования сохранён. Личный рекорд оставлен без изменений.",
} as const;

export const COMPETITION_RECORD_STATUS_TEXT = {
  updated: COMPETITION_RESULT_TEXT.recordSaved,
  not_better: COMPETITION_RESULT_TEXT.recordNotBetter,
  conflict: COMPETITION_RESULT_TEXT.recordConflict,
  invalid_current_record: COMPETITION_RESULT_TEXT.invalidCurrentRecord,
  stale: COMPETITION_RESULT_TEXT.stale,
} as const;
