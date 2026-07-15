import type { TemplateFilter } from "../types/templatesTypes";

export const TEMPLATES_LABELS = {
  eyebrow: "Управление клубом",
  title: "Шаблоны отчётов",
  subtitle:
    "Соберите правила автопоиска и форматы результатов, чтобы быстрее оформлять отчёты о тренировках.",
  dashboardAction: "Назад в главное меню",
  createAction: "Создать шаблон",
  overviewLabel: "Сводка по шаблонам отчётов",
  totalTemplatesLabel: "Всего шаблонов",
  userTemplatesLabel: "Пользовательские",
  systemTemplatesLabel: "Системные",
  catalogEyebrow: "Библиотека правил",
  catalogTitle: "Каталог шаблонов",
  catalogDescription: "Найдите шаблон по названию или ключевой фразе и откройте его настройки.",
  searchLabel: "Поиск по шаблонам",
  searchPlaceholder: "Название или ключевая фраза",
  clearSearch: "Очистить поиск",
  filtersLegend: "Тип шаблона",
  resultsLabel: (visibleCount: number, totalCount: number) =>
    `Показано ${visibleCount} из ${totalCount}`,
  systemBadge: "Системный",
  userBadge: "Пользовательский",
  patternsLabel: "Ключевые фразы",
  noPatterns: "Автопоиск не настроен",
  editAction: "Редактировать",
  editAriaLabel: (name: string) => `Редактировать шаблон «${name}»`,
  deleteAction: "Удалить",
  deleteAriaLabel: (name: string) => `Удалить шаблон «${name}»`,
  deleteConfirmTitle: "Удалить шаблон?",
  deleteConfirmDescription: (name: string) =>
    `Шаблон «${name}» исчезнет из каталога. Это действие нельзя отменить.`,
  systemProtection: "Системный шаблон нельзя удалить",
  deleteSuccess: (name: string) => `Шаблон «${name}» удалён.`,
  deleteError: (name: string) =>
    `Не удалось удалить шаблон «${name}». Проверьте соединение и попробуйте снова.`,
  dismissError: "Закрыть сообщение об ошибке",
  emptyTitle: "Шаблонов пока нет",
  emptyDescription:
    "Создайте первый шаблон, чтобы задавать поля и автоматически собирать текст отчёта.",
  noResultsTitle: "Ничего не найдено",
  noResultsDescription: "Измените запрос или выберите другой тип шаблонов.",
  resetFiltersAction: "Сбросить поиск и фильтры",
} as const;

export const TEMPLATE_FILTER_OPTIONS: ReadonlyArray<{
  value: TemplateFilter;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "user", label: TEMPLATES_LABELS.userTemplatesLabel },
  { value: "system", label: TEMPLATES_LABELS.systemTemplatesLabel },
];

export const TEMPLATE_ROUTES = {
  dashboard: "/dashboard",
  create: "/tools/templates/new",
} as const;
