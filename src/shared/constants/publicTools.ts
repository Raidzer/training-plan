export const PUBLIC_TOOL_LINKS = [
  {
    key: "result-equivalent",
    href: "/tools/result-equivalent",
    label: "Калькулятор прогноза результата",
    shortLabel: "Прогноз результата",
    description: "Сопоставьте текущий результат с популярными дистанциями.",
  },
  {
    key: "pace-calculator",
    href: "/tools/pace-calculator",
    label: "Калькулятор расчета темпа и результата на забеге",
    shortLabel: "Темп и раскладка",
    description: "Свяжите дистанцию, итоговое время, темп и круг 400 м.",
  },
  {
    key: "speed-to-pace",
    href: "/tools/speed-to-pace",
    label: "Калькулятор перевода скорости в темп",
    shortLabel: "Скорость и темп",
    description: "Переведите скорость в темп и обратно без ручных формул.",
  },
] as const;

export type PublicToolHref = (typeof PUBLIC_TOOL_LINKS)[number]["href"];
