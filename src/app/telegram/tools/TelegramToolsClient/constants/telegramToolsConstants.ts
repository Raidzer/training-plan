export const TELEGRAM_TOOLS_TEXT = {
  title: "Беговые калькуляторы",
  subtitle: "Инструменты для расчета темпа, прогноза результата и перевода скорости.",
  openLabel: "Открыть",
} as const;

export const TELEGRAM_TOOL_LINKS = [
  {
    key: "resultEquivalent",
    title: "Эквивалент результата",
    description: "Прогноз результата на популярных дистанциях по нескольким методикам.",
    href: "/telegram/tools/result-equivalent",
  },
  {
    key: "paceCalculator",
    title: "Темп и результат",
    description: "Расчет темпа, итогового времени, круга 400 м и раскладки по километрам.",
    href: "/telegram/tools/pace-calculator",
  },
  {
    key: "speedToPace",
    title: "Скорость и темп",
    description: "Перевод км/ч, м/с и миль/ч в мин/км и мин/милю.",
    href: "/telegram/tools/speed-to-pace",
  },
] as const;
