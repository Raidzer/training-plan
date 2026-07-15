export const TEMPLATE_EDITOR_LABELS = {
  eyebrow: "Редактор шаблонов",
  newTemplateTitle: "Новый шаблон",
  editTemplateFallbackTitle: "Шаблон отчёта",
  newTemplateSubtitle:
    "Настройте поля и текст, из которых будет собираться ежедневный отчёт спортсмена.",
  editTemplateSubtitle:
    "Обновите структуру формы и формат результата. Изменения применятся при следующем использовании шаблона.",
  backButton: "К шаблонам",
  formAriaLabel: "Редактор шаблона отчёта",
  basicsTitle: "Основные настройки",
  basicsDescription:
    "Название помогает найти шаблон, а код и ключевые слова — применять его автоматически.",
  nameLabel: "Название шаблона",
  namePlaceholder: "Например, Интервалы",
  nameRequired: "Введите название шаблона.",
  codeLabel: "Системный код",
  codePlaceholder: "PULSE",
  codeHint: "Используется для вставки результата в другой шаблон, например {{PULSE}}.",
  codeInvalid: "Используйте только латинские буквы, цифры и подчёркивание.",
  matchPatternLabel: "Ключевые слова для автопоиска",
  matchPatternPlaceholder: "интервалы; фартлек; ^#{2-4} км",
  matchPatternHint:
    "Разделяйте фразы точкой с запятой. # — число, * — любой текст, ^ — начало строки.",
  inlineLabel: "Встраивать результат в предыдущую строку",
  inlineHint: "Подходит для коротких показателей, которые не должны начинаться с новой строки.",
  fieldsTitle: "Поля формы",
  fieldsDescription:
    "Порядок карточек определяет порядок ввода. Код поля используется в тексте результата.",
  emptyFieldsTitle: "Поля ещё не добавлены",
  emptyFieldsDescription:
    "Добавьте поле, если при формировании отчёта нужно запросить время, число или текст.",
  addFieldButton: "Добавить поле",
  fieldTitle: "Поле",
  fieldCodeLabel: "Код поля",
  fieldCodePlaceholder: "time",
  fieldCodeRequired: "Введите код поля.",
  fieldCodeInvalid: "Используйте только латинские буквы, цифры и подчёркивание.",
  fieldCodeDuplicate: "Коды полей не должны повторяться.",
  fieldNameLabel: "Название",
  fieldNamePlaceholder: "Время отрезка",
  fieldNameRequired: "Введите название поля.",
  fieldTypeLabel: "Тип данных",
  fieldWeightLabel: "Дистанция, км",
  fieldWeightHint: "Необязательно. Используется в расчётах темпа и высоты.",
  fieldDefaultValueLabel: "Значение по умолчанию",
  fieldDefaultValueHint: "Для списка разделяйте значения точкой с запятой.",
  listItemTypeLabel: "Тип элементов",
  listSizeLabel: "Количество элементов",
  moveFieldUp: "Переместить поле вверх",
  moveFieldDown: "Переместить поле вниз",
  deleteField: "Удалить поле",
  deleteFieldConfirm: "Удалить это поле из шаблона?",
  deleteFieldConfirmDescription:
    "Значение поля останется в тексте результата, пока вы не удалите его код.",
  outputTitle: "Шаблон результата",
  outputDescription:
    "Соберите итоговую строку с помощью кодов полей и функций. Справочник находится рядом.",
  outputLabel: "Текст отчёта",
  outputPlaceholder: "Разминка {{warmup}} км + {{PACE(time, distance)}}",
  outputRequired: "Введите текст результата.",
  syntaxTitle: "Справочник синтаксиса",
  syntaxDescription: "Коды чувствительны к регистру. Поле time вставляется как {{time}}.",
  functionsTitle: "Функции",
  variablesTitle: "Переменные",
  constructionsTitle: "Конструкции",
  saveButton: "Сохранить шаблон",
  cancelButton: "Отмена",
  pristineStatus: "Изменений нет",
  dirtyStatus: "Есть несохранённые изменения",
  savingStatus: "Сохраняем шаблон",
  savedStatus: "Шаблон сохранён",
  errorStatus: "Не удалось сохранить",
  saveSuccess: "Шаблон сохранён.",
  saveError: "Не удалось сохранить шаблон. Проверьте данные и попробуйте снова.",
  leaveConfirmation: "В шаблоне есть несохранённые изменения. Покинуть редактор?",
} as const;

export const TEMPLATE_FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Текст" },
  { value: "time", label: "Время" },
  { value: "number", label: "Число" },
  { value: "list", label: "Список" },
] as const;

export const TEMPLATE_LIST_ITEM_TYPE_OPTIONS = TEMPLATE_FIELD_TYPE_OPTIONS.filter(
  ({ value }) => value !== "list"
);

export const TEMPLATE_FUNCTION_REFERENCE = [
  { code: "{{PACE(time, distance)}}", description: "темп в мин/км" },
  { code: "{{AVG_TIME(list_key, ...)}}", description: "среднее время" },
  { code: "{{SUM_TIME(list_key, ...)}}", description: "сумма времени" },
  { code: "{{AVG_NUM(list_key, ...)}}", description: "среднее число" },
  { code: "{{SUM_NUM(list_key, ...)}}", description: "сумма чисел" },
  { code: "{{AVG_HEIGHT(height, distance)}}", description: "средняя высота" },
] as const;

export const TEMPLATE_VARIABLE_REFERENCE = [
  { code: "{{code}}", description: "значение поля с кодом code" },
  { code: "{{code_weight}}", description: "дистанция поля в километрах" },
] as const;

export const TEMPLATE_CONSTRUCTION_REFERENCE = [
  { code: "{{#if variable}}...{{/if}}", description: "условный фрагмент" },
  { code: "{{#each list}}...{{this}}...{{/each}}", description: "перебор списка" },
  { code: "{{#repeat count}}...{{/repeat}}", description: "повтор фрагмента" },
  { code: "{{list[i]}}", description: "элемент параллельного списка" },
  { code: "{{list[1]}}", description: "элемент списка по номеру" },
] as const;
