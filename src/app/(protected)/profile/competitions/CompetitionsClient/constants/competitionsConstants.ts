import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";

export const COMPETITIONS_DATE_FORMAT = "YYYY-MM-DD";
export const COMPETITIONS_DISPLAY_DATE_FORMAT = "DD.MM.YYYY";
export const COMPETITIONS_COLLAPSED_BLOCKS_KEY = "training-plan:collapsed-competition-blocks:v1";

export const competitionsLabels = {
  eyebrow: "Спортивный профиль",
  title: "Соревнования",
  subtitle:
    "Соберите календарь стартов по блокам подготовки и сохраняйте результаты в одном месте.",
  backButton: "Назад в главное меню",
  overviewLabel: "Сводка по соревнованиям",
  totalBlocksLabel: "Блоков подготовки",
  totalCompetitionsLabel: "Всего стартов",
  mainCompetitionsLabel: "Главных стартов",
  overviewLoading: "Сводка загружается",
  overviewUnavailable: "Сводка недоступна",
  blocksSectionTitle: "Календарь подготовки",
  blocksSectionDescription:
    "Раскрывайте блоки, добавляйте старты и отмечайте главные соревнования сезона.",
  blocksCountShortLabel: "Блоков",
  blockCompetitionsTitle: "Старты",
  blockPeriodLabel: "Период подготовки",
  blockCreateTitle: "Новый блок подготовки",
  blockCreateDescription:
    "Задайте период и цель цикла. После создания в блок можно будет добавить старты.",
  blockTitleLabel: "Название блока",
  blockTitlePlaceholder: "Подготовка к весне 2026",
  blockTitleHint: "Например, сезон, цель или главный старт цикла.",
  startDateLabel: "Начало",
  endDateLabel: "Окончание",
  startDatePlaceholder: "Начало",
  endDatePlaceholder: "Конец",
  createBlockButton: "Создать блок",
  editBlockTitle: "Редактирование блока",
  competitionCreateTitle: "Новый старт",
  competitionCreateDescription:
    "Укажите дату, дистанцию и приоритет. Результат можно добавить позже.",
  competitionEditTitle: "Редактирование старта",
  competitionDateLabel: "Дата старта",
  nameLocationLabel: "Название или город",
  distanceLabel: "Дистанция",
  priorityLabel: "Приоритет",
  resultLabel: "Результат",
  resultHint: "Оставьте пустым, если старт ещё не состоялся.",
  saveButton: "Сохранить",
  cancelButton: "Отмена",
  editButton: "Редактировать",
  deleteButton: "Удалить",
  addCompetitionButton: "Добавить старт",
  openCompetitionFormButton: "Добавить старт",
  closeCompetitionFormButton: "Скрыть форму",
  emptyBlocksTitle: "Блоков подготовки пока нет",
  emptyBlocks: "Создайте первый блок, чтобы собрать в нём календарь стартов и результатов.",
  emptyBlocksAction: "Создать первый блок",
  emptyCompetitionsTitle: "В этом блоке пока нет стартов",
  emptyCompetitions: "Добавьте соревнование, чтобы видеть календарь и отмечать главный старт.",
  loadingText: "Загрузка соревнований",
  loadingDescription: "Загружаем блоки подготовки и календарь стартов.",
  loadErrorTitle: "Не удалось загрузить соревнования",
  loadErrorDescription: "Проверьте соединение и попробуйте загрузить календарь ещё раз.",
  retryButton: "Повторить",
  dateColumn: "Дата",
  nameLocationColumn: "Название / город",
  distanceColumn: "Дистанция",
  priorityColumn: "Приоритет",
  resultColumn: "Результат",
  actionsColumn: "",
  nameLocationPlaceholder: "Московский полумарафон",
  distancePlaceholder: "21.1 км",
  resultPlaceholder: "01:26:52",
  competitionDatePlaceholder: "Дата",
  noResult: "Не указан",
  blockTitleRequired: "Введите название блока.",
  blockTitleTooLong: "Название блока длиннее 255 символов.",
  blockDateRequired: "Укажите даты блока.",
  blockPeriodInvalid: "Дата начала должна быть раньше даты окончания.",
  nameLocationRequired: "Введите название или город соревнования.",
  nameLocationTooLong: "Название / город длиннее 255 символов.",
  distanceRequired: "Введите дистанцию.",
  distanceTooLong: "Дистанция длиннее 64 символов.",
  competitionDateRequired: "Укажите дату соревнования.",
  resultTooLong: "Результат длиннее 32 символов.",
  loadFail: "Не удалось загрузить соревнования.",
  blockSaveOk: "Блок создан.",
  blockUpdateOk: "Блок обновлен.",
  blockDeleteOk: "Блок удален.",
  competitionSaveOk: "Соревнование добавлено.",
  competitionUpdateOk: "Соревнование обновлено.",
  competitionDeleteOk: "Соревнование удалено.",
  saveFail: "Не удалось сохранить данные.",
  updateFail: "Не удалось обновить данные.",
  deleteFail: "Не удалось удалить данные.",
  blockDeleteConfirm: "Удалить блок подготовки?",
  competitionDeleteConfirm: "Удалить соревнование?",
  mainPriority: "Главное",
  regularPriority: "Обычное",
  editBlockAria: "Редактировать блок подготовки",
  deleteBlockAria: "Удалить блок подготовки",
  collapseBlockAria: "Свернуть блок подготовки",
  expandBlockAria: "Раскрыть блок подготовки",
  editCompetitionAria: "Редактировать соревнование",
  deleteCompetitionAria: "Удалить соревнование",
} as const;

export const COMPETITION_PRIORITY_OPTIONS = [
  {
    value: COMPETITION_PRIORITIES.MAIN,
    label: competitionsLabels.mainPriority,
  },
  {
    value: COMPETITION_PRIORITIES.REGULAR,
    label: competitionsLabels.regularPriority,
  },
] as const;

export const COMPETITION_DISTANCE_OPTIONS = PERSONAL_RECORD_DISTANCES.map((distance) => ({
  value: distance.label,
  label: distance.label,
})) as Array<{ value: string; label: string }>;

export const COMPETITION_PRIORITY_META = {
  [COMPETITION_PRIORITIES.MAIN]: {
    label: competitionsLabels.mainPriority,
    color: "gold",
  },
  [COMPETITION_PRIORITIES.REGULAR]: {
    label: competitionsLabels.regularPriority,
    color: "default",
  },
} as const;
