import type { DashboardCardConfig } from "../types/dashboardTypes";

export const DASHBOARD_LABELS = {
  defaultGreetingTarget: "пользователь",
  greetingPrefix: "Привет",
  subtitle: "Что планируем сегодня?",
} as const;

export const DASHBOARD_CARDS: DashboardCardConfig[] = [
  {
    id: "admin",
    title: "Администрирование",
    description: "Управление пользователями: роли, доступ и пароли.",
    href: "/admin/users",
    adminOnly: true,
  },
  {
    id: "templates",
    title: "Шаблоны",
    description: "Редактор шаблонов для дневника тренировок.",
    href: "/tools/templates",
    adminOnly: true,
  },
  {
    id: "plan",
    title: "План",
    description: "Планируйте цели и запланированные тренировки.",
    href: "/plan",
  },
  {
    id: "diary",
    title: "Дневник",
    description: "Записи, графики и метрики восстановления.",
    href: "/diary",
  },
  {
    id: "shoes",
    title: "Обувь",
    description: "Добавьте и редактируйте список обуви для тренировок.",
    href: "/profile/shoes",
  },
  {
    id: "records",
    title: "Рекорды",
    description: "Заполните личные рекорды по дистанциям и добавьте ссылку на протокол.",
    href: "/profile/records",
  },
  {
    id: "competitions",
    title: "Соревнования",
    description: "Ведите блоки подготовки, старты и результаты.",
    href: "/profile/competitions",
  },
];
