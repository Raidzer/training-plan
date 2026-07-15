export const STORAGE_KEY = "pace-calculator:results";
export const MAX_DISTANCE_METERS = 200000;

export const DISTANCE_PRESETS = [
  { value: 1000, label: "1 000 м" },
  { value: 3000, label: "3 000 м" },
  { value: 5000, label: "5 000 м" },
  { value: 10000, label: "10 000 м" },
  { value: 21097, label: "21 097 м" },
  { value: 42195, label: "42 195 м" },
] as const;

export const PACE_CALCULATOR_TEXT = {
  header: {
    eyebrow: "Беговой инструмент",
    title: "Темп, результат и раскладка",
    description:
      "Рассчитайте темп по результату или итоговое время по темпу и получите раскладку по километрам.",
    hint: "Измените любое временное поле — остальные значения пересчитаются автоматически.",
  },
  distance: {
    title: "Дистанция",
    hint: "Введите значение до 200 000 метров или выберите готовую дистанцию.",
    fieldLabel: "Дистанция в метрах",
    ariaLabel: "Дистанция в метрах",
    clear: "Очистить дистанцию",
    unit: "м",
  },
  result: {
    title: "Расчёт",
    save: "Сохранить результат",
    resultLabel: "Итоговое время",
    resultAriaLabel: "Результат",
    paceLabel: "Темп на километр",
    paceAriaLabel: "Темп",
    lapLabel: "Круг 400 м",
    lapAriaLabel: "Время на круге",
    helper: "Последнее изменённое поле становится основой следующего расчёта.",
  },
  splits: {
    title: "Раскладка по дистанции",
    hint: "Накопленное время на каждой километровой отметке при выбранном темпе.",
    empty: "Введите дистанцию и темп, чтобы увидеть раскладку.",
  },
  savedResults: {
    title: "Сохранённые расчёты",
    empty: "Пока нет сохраненных результатов.",
    result: "Результат:",
    pace: "Темп:",
    paceUnit: "/ км",
    lap: "Круг 400 м:",
    delete: "Удалить",
  },
} as const;
