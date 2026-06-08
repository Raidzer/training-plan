import type { InviteMeta, InviteStatus, InviteStatusMeta } from "../types/adminInvitesTypes";

export const ADMIN_INVITES_LABELS = {
  title: "Приглашения",
  subtitle:
    "Ссылки одноразовые и действуют 24 часа. Полный URL доступен только сразу после создания.",
  usersButton: "Пользователи",
  dashboardButton: "В кабинет",
  createButton: "Создать ссылку",
  copyButton: "Копировать",
  linkCreatedTitle: "Ссылка создана",
  linkCreatedNote: "Ссылка одноразовая и действует 24 часа.",
  roleLabel: "Роль",
  selectRole: "Выберите роль",
  unavailableLink: "Недоступна",
  linkColumn: "Ссылка",
  statusColumn: "Статус",
  roleColumn: "Роль",
  createdAtColumn: "Создана",
  expiresAtColumn: "Истекает",
  createdByColumn: "Создал",
  usedAtColumn: "Использована",
  usedByColumn: "Использовал",
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
  athlete: { label: "Атлет", color: "green" },
  coach: { label: "Тренер", color: "purple" },
};

export const STATUS_META: Record<InviteStatus, InviteStatusMeta> = {
  active: { label: "Активна", color: "green" },
  used: { label: "Использована", color: "blue" },
  expired: { label: "Истекла", color: "red" },
};

export const ROLE_OPTIONS = [
  { value: "athlete", label: "Атлет" },
  { value: "coach", label: "Тренер" },
];
