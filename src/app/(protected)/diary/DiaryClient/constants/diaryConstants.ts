export const WEATHER_OPTIONS = [
  { value: "cloudy", label: "Пасмурно" },
  { value: "sunny", label: "Солнечно" },
  { value: "rain", label: "Дождь" },
  { value: "snow", label: "Снег" },
] as const;

export const SURFACE_OPTIONS = [
  { value: "ground", label: "Грунт" },
  { value: "asphalt", label: "Асфальт" },
  { value: "manezh", label: "Манеж" },
  { value: "treadmill", label: "Беговая дорожка" },
  { value: "stadium", label: "Стадион" },
] as const;

export const WIND_OPTIONS = [
  { value: "true", label: "Есть" },
  { value: "false", label: "Нет" },
] as const;

export const DIARY_MESSAGES = {
  marksLoadFailed: "Не удалось загрузить отметки календаря.",
  dayLoadFailed: "Не удалось загрузить дневник за день.",
  weightInvalid: "Введите корректный вес.",
  weightSaveFailed: "Не удалось сохранить вес.",
  weightSaved: "Вес сохранен.",
  workoutRequired: "Результат тренировки обязателен.",
  workoutDistanceInvalid: "Введите корректную дистанцию тренировки.",
  workoutShoeMileageInvalid: "Введите корректный пробег обуви.",
  workoutTemperatureInvalid: "Введите корректную температуру воздуха.",
  workoutSaveFailed: "Не удалось сохранить отчет о тренировке.",
  workoutSaved: "Отчет о тренировке сохранен.",
  workoutEditRequired: "Заполните задание тренировки.",
  workoutEditNotFound: "Тренировка не найдена.",
  workoutEditSaveFailed: "Не удалось сохранить тренировку.",
  workoutEditSaved: "Тренировка сохранена.",
  recoveryInvalidSleep: "Введите время сна в формате ЧЧ:ММ.",
  recoverySaveFailed: "Не удалось сохранить отметки восстановления.",
  recoverySaved: "Отметки восстановления сохранены.",
  shoesLoadFailed: "Не удалось загрузить список обуви.",
} as const;

export const HEADER_LABELS = {
  title: "Дневник за день",
  subtitle: "Отмечайте вес и отчеты о тренировках за выбранный день.",
  periodLabel: "Просмотр периода",
  dashboardLabel: "Назад",
} as const;

export const CALENDAR_LABELS = {
  title: "Календарь",
} as const;

export const STATUS_LABELS = {
  reportButton: "Ежедневный отчет",
  dayComplete: "День заполнен",
  dayIncomplete: "День не заполнен",
  weightLabel: "Вес",
  weightMorningShort: "У",
  weightEveningShort: "В",
  sleepLabel: "Сон",
  sleepFilledShort: "Да",
  sleepEmptyShort: "-",
  workoutsLabel: "Тренировки",
} as const;

export const WEIGHT_LABELS = {
  title: "Вес",
  morningPlaceholder: "Вес утром",
  eveningPlaceholder: "Вес вечером",
  saveLabel: "Сохранить",
} as const;

export const RECOVERY_LABELS = {
  title: "Восстановление",
  bathLabel: "Баня",
  mfrLabel: "МФР",
  massageLabel: "Массаж",
  otherLabel: "Другое",
  otherPlaceholder: "Что еще помогло восстановиться",
  overallLabel: "Общая оценка",
  functionalLabel: "Функциональная оценка",
  muscleLabel: "Мышечная оценка",
  sleepLabel: "Сон, часы",
  sleepPlaceholder: "ЧЧ:ММ",
  scorePlaceholder: "1-10",
  saveLabel: "Сохранить",
} as const;

export const WORKOUT_LABELS = {
  title: "Тренировки",
  emptyLabel: "На эту дату тренировки не запланированы.",
  completeLabel: "Заполнено",
  incompleteLabel: "Не заполнено",
  startTimePlaceholder: "Время начала (ЧЧ:ММ)",
  resultPlaceholder: "Результат",
  distancePlaceholder: "Дистанция (км)",
  overallScoreLabel: RECOVERY_LABELS.overallLabel,
  functionalScoreLabel: RECOVERY_LABELS.functionalLabel,
  muscleScoreLabel: RECOVERY_LABELS.muscleLabel,
  scorePlaceholder: RECOVERY_LABELS.scorePlaceholder,
  surfacePlaceholder: "Покрытие",
  shoePlaceholder: "Обувь",
  shoeMileagePlaceholder: "Пробег в этой паре, км",
  weatherPlaceholder: "Погода",
  windPlaceholder: "Ветер",
  temperaturePlaceholder: "Температура, °C",
  commentPlaceholder: "Комментарий",
  saveReportLabel: "Сохранить отчет",
  editWorkoutLabel: "Редактировать тренировку",
} as const;

export const WORKOUT_EDIT_LABELS = {
  title: "Редактировать тренировку",
  taskLabel: "Задание",
  commentLabel: "Комментарий",
  saveLabel: "Сохранить",
  cancelLabel: "Отмена",
} as const;

export const REPORT_LABELS = {
  title: "Ежедневный отчет",
  closeLabel: "Закрыть",
} as const;
