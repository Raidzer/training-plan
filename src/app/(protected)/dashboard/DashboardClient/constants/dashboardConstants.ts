import type { DashboardCardConfig, DashboardSectionConfig } from "../types/dashboardTypes";

export const DASHBOARD_LABELS = {
  title: "Личный кабинет",
  greetingPrefix: "Привет",
  subtitle: "Выберите раздел и продолжайте работу.",
  profileAction: "Профиль",
} as const;

export const DASHBOARD_SECTIONS = [
  {
    id: "club-management",
    label: "Управление клубом",
    description: "Пользователи, приглашения и шаблоны для работы клуба.",
    adminOnly: true,
    cards: [
      {
        id: "users",
        title: "Пользователи",
        description: "Роли, доступ, пароли и тренировочные данные участников.",
        href: "/admin/users",
        adminOnly: true,
      },
      {
        id: "invites",
        title: "Приглашения",
        description: "Создавайте приглашения для спортсменов и тренеров.",
        href: "/admin/invites",
        adminOnly: true,
      },
      {
        id: "templates",
        title: "Шаблоны",
        description: "Редактор шаблонов для дневника тренировок.",
        href: "/tools/templates",
        adminOnly: true,
      },
    ],
  },
  {
    id: "training",
    label: "Тренировки",
    description: "Планируйте тренировки и фиксируйте выполненную работу.",
    cards: [
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
    ],
  },
  {
    id: "sports-profile",
    label: "Спортивный профиль",
    description: "Экипировка, личные рекорды и календарь соревнований.",
    cards: [
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
    ],
  },
] satisfies readonly DashboardSectionConfig[];

export const DASHBOARD_CARDS: DashboardCardConfig[] = DASHBOARD_SECTIONS.flatMap((section) => [
  ...section.cards,
]);
