import type {
  AdminUserRoleFilter,
  AdminUserStatusFilter,
  RoleMeta,
} from "../types/adminUsersTypes";

export const ADMIN_USERS_LABELS = {
  eyebrow: "Администрирование клуба",
  title: "Пользователи клуба",
  subtitle:
    "Управляйте составом, доступом и спортивными данными участников в одном рабочем пространстве.",
  invitesButton: "Приглашения",
  dashboardButton: "Главное меню",
  overviewLabel: "Сводка по составу клуба",
  totalUsersMetric: "Всего участников",
  activeUsersMetric: "Активны",
  coachesMetric: "Тренеры",
  disabledUsersMetric: "Отключены",
  directoryTitle: "Состав клуба",
  directorySubtitle: "Найдите участника и откройте нужное действие без перехода между разделами.",
  searchLabel: "Поиск пользователя",
  searchPlaceholder: "Имя, фамилия, почта или логин",
  roleFilterLabel: "Роль",
  statusFilterLabel: "Статус",
  allRoles: "Все роли",
  allStatuses: "Все статусы",
  resetFiltersButton: "Сбросить",
  emptyUsersTitle: "В клубе пока нет пользователей",
  emptyUsersText: "Создайте приглашение, чтобы добавить первого участника.",
  emptySearchTitle: "Пользователи не найдены",
  emptySearchText: "Измените запрос или сбросьте выбранные фильтры.",
  resultsLabel: "Результаты поиска пользователей",
  rosterNumberLabel: "Участник",
  currentUserBadge: "Вы",
  recordsButton: "Рекорды",
  competitionsButton: "Соревнования",
  actionsMenuButton: "Действия пользователя",
  roleButton: "Роль",
  passwordButton: "Пароль",
  clearTrainingDataButton: "Очистить тренировочные данные",
  deleteButton: "Удалить",
  disableButton: "Отключить",
  enableButton: "Включить",
  saveButton: "Сохранить",
  cancelButton: "Отмена",
  userColumn: "Пользователь",
  genderColumn: "Пол",
  loginColumn: "Логин",
  roleColumn: "Роль",
  createdAtColumn: "Зарегистрирован",
  lastActiveAtColumn: "Последняя активность",
  statusColumn: "Статус",
  actionsColumn: "Действия",
  activeStatus: "Активен",
  disabledStatus: "Отключён",
  roleModalTitle: "Сменить роль",
  passwordModalTitle: "Сменить пароль",
  roleModalDescription: "Новая роль изменит доступные пользователю разделы и действия.",
  passwordModalDescription:
    "Задайте временный пароль и передайте его пользователю безопасным способом.",
  newPasswordLabel: "Новый пароль",
  confirmPasswordLabel: "Повторите пароль",
  newPasswordPlaceholder: "Не менее 6 символов",
  confirmPasswordPlaceholder: "Введите пароль ещё раз",
  selectRolePlaceholder: "Выберите роль",
  selectRoleRequired: "Выберите роль",
  newPasswordRequired: "Введите новый пароль",
  confirmPasswordRequired: "Повторите пароль",
  passwordMismatch: "Пароли не совпадают",
  roleUserMissing: "Не выбран пользователь для смены роли.",
  passwordUserMissing: "Не выбран пользователь для смены пароля.",
  roleUpdateOk: "Роль обновлена.",
  roleUpdateFail: "Не удалось обновить роль.",
  passwordUpdateOk: "Пароль обновлен.",
  passwordUpdateFail: "Не удалось обновить пароль.",
  statusUpdateFail: "Не удалось обновить статус.",
  clearTrainingDataUpdateOk: "Тренировочные данные пользователя очищены.",
  clearTrainingDataUpdateFail: "Не удалось очистить тренировочные данные пользователя.",
  deleteUpdateOk: "Пользователь удалён.",
  deleteUpdateFail: "Не удалось удалить пользователя.",
  userEnabled: "Пользователь включён.",
  userDisabled: "Пользователь отключён.",
  disableConfirmText: "Пользователь не сможет входить в личный кабинет до обратного включения.",
  clearTrainingDataConfirmTitle: "Очистить тренировочные данные пользователя",
  clearTrainingDataConfirmText:
    "Без восстановления будут удалены планы, дневник, тренировки, вес, восстановление и соревнования. Аккаунт, роль, рекорды и обувь останутся.",
  deleteConfirmTitle: "Удалить пользователя",
  deleteConfirmText: "Аккаунт и связанные данные пользователя будут удалены без восстановления.",
  unauthorized: "Нужно войти в личный кабинет.",
  forbidden: "Недостаточно прав для выполнения действия.",
  invalidPayload: "Некорректные данные.",
  invalidUserId: "Некорректный идентификатор пользователя.",
  notFound: "Пользователь не найден.",
  cannotDisableSelf: "Нельзя отключить собственного пользователя.",
  cannotDeleteAdmin: "Администратора нельзя удалить.",
  unknownRole: "Не задана",
  maleGender: "Мужской",
  femaleGender: "Женский",
} as const;

export const ROLE_META: Record<string, RoleMeta> = {
  admin: { label: "Администратор", tone: "admin" },
  athlete: { label: "Атлет", tone: "athlete" },
  coach: { label: "Тренер", tone: "coach" },
};

export const ROLE_OPTIONS: Array<{
  value: Exclude<AdminUserRoleFilter, "all">;
  label: string;
}> = [
  { value: "admin", label: "Администратор" },
  { value: "coach", label: "Тренер" },
  { value: "athlete", label: "Атлет" },
];

export const PASSWORD_MIN_LENGTH = 6;

export const ADMIN_USERS_PAGE_SIZE = 10;

export const ROLE_FILTER_OPTIONS = [
  { value: "all", label: ADMIN_USERS_LABELS.allRoles },
  ...ROLE_OPTIONS,
] satisfies Array<{ value: AdminUserRoleFilter; label: string }>;

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: ADMIN_USERS_LABELS.allStatuses },
  { value: "active", label: ADMIN_USERS_LABELS.activeStatus },
  { value: "disabled", label: ADMIN_USERS_LABELS.disabledStatus },
] satisfies Array<{ value: AdminUserStatusFilter; label: string }>;
