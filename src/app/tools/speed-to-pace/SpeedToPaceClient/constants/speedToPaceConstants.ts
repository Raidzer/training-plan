export const KM_PER_MILE = 1.609344;

export const DEFAULT_KMH = 10;

export const SPEED_TO_PACE_TEXT = {
  header: {
    title: "Калькулятор перевода скорости (км/ч, м/с, миль/ч) в темп (мин/км, мин/милю)",
    description:
      "Позволяет мгновенно перевести скорость в разные единицы измерения (км/ч, м/с, миль/ч), скорость в темп (мин/км, мин/милю) и обратно.",
    hint: "Просто заполните одно из значений, остальные пересчитаются автоматически.",
  },
  speed: {
    title: "Скорость",
    kmhLabel: "Км в час",
    mpsLabel: "Метров в сек",
    mphLabel: "Миль в час",
    kmhAriaLabel: "Километров в час",
    mpsAriaLabel: "Метров в секунду",
    mphAriaLabel: "Миль в час",
    kmhUnit: "км/ч",
    mpsUnit: "м/с",
    mphUnit: "миль/ч",
  },
  pace: {
    title: "Темп",
    kmLabel: "Минут на км",
    mileLabel: "Минут на милю",
    unit: "мин:сек",
  },
} as const;
