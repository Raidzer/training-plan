import type {
  InviteMeta,
  InviteRole,
  InviteRoleFilter,
  InviteStatus,
  InviteStatusFilter,
  InviteStatusMeta,
} from "../types/adminInvitesTypes";

export const ADMIN_INVITES_HISTORY_LIMIT = 200;

export const ADMIN_INVITES_LABELS = {
  eyebrow: "Администрирование клуба",
  title: "Приглашения в клуб",
  subtitle: "Создавайте одноразовые ссылки для атлетов и тренеров и отслеживайте их использование.",
  usersButton: "Пользователи",
  dashboardButton: "Главное меню",
  overviewLabel: `Сводка по ${ADMIN_INVITES_HISTORY_LIMIT} последним приглашениям`,
  totalInvitesMetric: "В выборке",
  activeInvitesMetric: "Активны",
  usedInvitesMetric: "Использованы",
  expiredInvitesMetric: "Истекли",
  createPanelEyebrow: "Новый доступ",
  createPanelTitle: "Создать приглашение",
  createPanelSubtitle:
    "Выберите роль будущего участника. Права доступа будут назначены при регистрации.",
  validityLabel: "Срок действия",
  validityValue: "24 часа",
  usageLabel: "Использование",
  usageValue: "Одноразовое",
  visibilityLabel: "Полная ссылка",
  visibilityValue: "Только после создания",
  createButton: "Создать приглашение",
  copyButton: "Скопировать ссылку",
  copyCreatedInviteButton: "Скопировать созданную ссылку",
  linkCreatedTitle: "Приглашение готово",
  linkCreatedNote:
    "Передайте ссылку участнику сейчас: после обновления страницы восстановить её будет невозможно.",
  createdLinkLabel: "Ссылка для регистрации",
  roleLabel: "Роль участника",
  selectRole: "Выберите роль",
  roleHint: "Роль определяет разделы и действия, доступные новому пользователю.",
  registryTitle: "Последние приглашения",
  registrySubtitle: `Поиск и фильтры работают по ${ADMIN_INVITES_HISTORY_LIMIT} последним приглашениям и показывают их текущее состояние.`,
  searchLabel: "Поиск приглашения",
  searchPlaceholder: "Номер, создатель или получатель",
  roleFilterLabel: "Роль",
  statusFilterLabel: "Статус",
  allRoles: "Все роли",
  allStatuses: "Все статусы",
  resetFiltersButton: "Сбросить",
  resultsLabel: "Результаты поиска приглашений",
  emptyInvitesTitle: "Приглашений пока нет",
  emptyInvitesText: "Создайте первое приглашение, чтобы добавить участника в клуб.",
  emptySearchTitle: "Приглашения не найдены",
  emptySearchText: "Измените запрос или сбросьте выбранные фильтры.",
  inviteNumberLabel: "Приглашение",
  createdAtLabel: "Создано",
  expiresAtLabel: "Действует до",
  createdByLabel: "Создал",
  usedAtLabel: "Использовано",
  usedByLabel: "Получатель",
  hiddenLinkTitle: "Ссылка скрыта",
  hiddenLinkNote: "Полный URL доступен только в момент создания приглашения.",
  unavailableLink: "Ссылка недоступна",
  unknownRole: "Неизвестная роль",
  copiedOk: "Ссылка скопирована.",
  copyFail: "Не удалось скопировать ссылку.",
  linkUnavailable: "Ссылка недоступна.",
  createOk: "Ссылка создана.",
  createFail: "Не удалось создать ссылку.",
  unauthorized: "Нужно войти в систему.",
  forbidden: "Недостаточно прав для создания приглашений.",
  invalidPayload: "Некорректные данные.",
} as const;

export const ROLE_META: Record<string, InviteMeta> = {
  athlete: { label: "Атлет", tone: "athlete" },
  coach: { label: "Тренер", tone: "coach" },
};

export const STATUS_META: Record<InviteStatus, InviteStatusMeta> = {
  active: { label: "Активно", tone: "active" },
  used: { label: "Использовано", tone: "used" },
  expired: { label: "Истекло", tone: "expired" },
};

export const ROLE_OPTIONS: Array<{ value: InviteRole; label: string }> = [
  { value: "athlete", label: "Атлет" },
  { value: "coach", label: "Тренер" },
];

export const ROLE_FILTER_OPTIONS = [
  { value: "all", label: ADMIN_INVITES_LABELS.allRoles },
  ...ROLE_OPTIONS,
] satisfies Array<{ value: InviteRoleFilter; label: string }>;

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: ADMIN_INVITES_LABELS.allStatuses },
  { value: "active", label: STATUS_META.active.label },
  { value: "used", label: STATUS_META.used.label },
  { value: "expired", label: STATUS_META.expired.label },
] satisfies Array<{ value: InviteStatusFilter; label: string }>;

export const ADMIN_INVITES_PAGE_SIZE = 10;
