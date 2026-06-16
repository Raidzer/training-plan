import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";

export const COMPETITIONS_DATE_FORMAT = "YYYY-MM-DD";
export const COMPETITIONS_DISPLAY_DATE_FORMAT = "DD.MM.YYYY";
export const COMPETITIONS_COLLAPSED_BLOCKS_KEY = "training-plan:collapsed-competition-blocks:v1";

export const competitionsLabels = {
  title: "Соревнования",
  subtitle: "Планируйте блоки подготовки, старты и результаты атлета.",
  blockCreateTitle: "Новый блок подготовки",
  blockTitlePlaceholder: "Подготовка к весне 2026",
  startDatePlaceholder: "Начало",
  endDatePlaceholder: "Конец",
  createBlockButton: "Создать блок",
  saveButton: "Сохранить",
  cancelButton: "Отмена",
  editButton: "Редактировать",
  deleteButton: "Удалить",
  addCompetitionButton: "Добавить соревнование",
  emptyBlocks: "Пока нет блоков подготовки.",
  emptyCompetitions: "В блоке пока нет соревнований.",
  loadingText: "Загрузка...",
  dateColumn: "Дата",
  nameLocationColumn: "Название / город",
  distanceColumn: "Дистанция",
  priorityColumn: "Приоритет",
  resultColumn: "Результат",
  actionsColumn: "",
  nameLocationPlaceholder: "Московский полумарафон",
  distancePlaceholder: "21.1 км",
  resultPlaceholder: "1:26:52",
  competitionDatePlaceholder: "Дата",
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
  toggleBlockAria: "Свернуть или раскрыть блок подготовки",
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
