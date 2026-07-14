import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";

export const RECORDS_LABELS = {
  eyebrow: "Спортивный профиль",
  title: "Личные рекорды",
  subtitle:
    "Соберите лучшие результаты на одной странице и дополняйте их данными старта и протоколом.",
  backButton: "Назад в профиль",
  overviewLabel: "Сводка по личным рекордам",
  totalDistancesLabel: "Дистанций доступно",
  completedRecordsLabel: "Рекордов заполнено",
  protocolsLabel: "С протоколом",
  navigatorTitle: "Дистанции",
  navigatorDescription: "Выберите дистанцию, чтобы посмотреть или изменить результат.",
  navigatorLabel: "Навигация по дистанциям",
  mobileSelectorLabel: "Выберите дистанцию",
  roadGroupTitle: "Шоссе",
  trackGroupTitle: "Стадион",
  editorEyebrow: "Карточка рекорда",
  completedStatus: "Заполнено",
  emptyStatus: "Не заполнено",
  invalidStatus: "Проверьте данные",
  alertTitle: "Формат результата",
  alertText:
    "Укажите время в формате ЧЧ:ММ:СС или ММ:СС. Для заполненного результата дата обязательна.",
  timeLabel: "Время",
  dateLabel: "Дата",
  eventDetailsTitle: "Данные старта",
  eventDetailsDescription: "Название, город и протокол необязательны.",
  raceNameLabel: "Название забега",
  raceCityLabel: "Город",
  protocolLabel: "Ссылка на протокол",
  timePlaceholder: "00:00:00",
  datePlaceholder: "ДД.ММ.ГГГГ",
  raceNamePlaceholder: "Название забега",
  raceCityPlaceholder: "Город",
  protocolPlaceholder: "https://",
  saveButton: "Сохранить изменения",
  clearButton: "Очистить запись",
  clearHint: "Пустое время удалит запись после сохранения изменений.",
  savedState: "Изменений нет",
  unsavedState: "Есть несохранённые изменения",
  loadingText: "Загружаем рекорды",
  loadingDescription: "Подготавливаем дистанции и сохранённые результаты.",
  loadErrorTitle: "Не удалось загрузить рекорды",
  loadErrorDescription:
    "Данные не изменены. Повторите загрузку, чтобы безопасно продолжить работу.",
  retryButton: "Повторить загрузку",
  loadFail: "Не удалось загрузить рекорды.",
  saveOk: "Рекорды сохранены.",
  saveFail: "Не удалось сохранить рекорды.",
  saveErrorDescription: "Изменения остались в форме. Проверьте соединение и попробуйте снова.",
  invalidTime: "Укажите время в формате ЧЧ:ММ:СС или ММ:СС.",
  invalidDate: "Укажите корректную дату для заполненных записей.",
  invalidUrl: "Ссылка на протокол слишком длинная.",
  invalidRaceName: "Название забега не должно превышать 255 символов.",
  invalidRaceCity: "Город не должен превышать 255 символов.",
} as const;

type RecordGroup = {
  id: "road" | "track";
  title: string;
  distanceKeys: PersonalRecordDistanceKey[];
};

export const RECORD_GROUPS: RecordGroup[] = [
  {
    id: "road",
    title: RECORDS_LABELS.roadGroupTitle,
    distanceKeys: ["marathon", "21_1k", "10k", "5k"],
  },
  {
    id: "track",
    title: RECORDS_LABELS.trackGroupTitle,
    distanceKeys: ["3k", "1_5k", "1k", "800m", "400m", "200m", "100m"],
  },
];

export const DEFAULT_SELECTED_DISTANCE_KEY: PersonalRecordDistanceKey = "5k";

export const RECORD_FIELD_ERROR_MESSAGES = {
  time: RECORDS_LABELS.invalidTime,
  date: RECORDS_LABELS.invalidDate,
  url: RECORDS_LABELS.invalidUrl,
  raceName: RECORDS_LABELS.invalidRaceName,
  raceCity: RECORDS_LABELS.invalidRaceCity,
} as const;
