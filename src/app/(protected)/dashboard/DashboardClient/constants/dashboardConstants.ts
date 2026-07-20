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
    cards: [
      {
        id: "plan",
        title: "План",
        description: "Загружайте тренировочный план.",
        href: "/plan",
      },
      {
        id: "daily-report",
        title: "Ежедневный отчёт",
        description: "Заполняйте тренировку, самочувствие и показатели восстановления.",
        href: "/diary",
      },
      {
        id: "diary",
        title: "Дневник",
        description: "Просматривайте тренировки и показатели за выбранный период.",
        href: "/diary/period",
      },
    ],
  },
  {
    id: "sports-profile",
    label: "Спортивный профиль",
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
