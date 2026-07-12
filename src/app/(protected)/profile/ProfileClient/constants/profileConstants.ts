export const PROFILE_LABELS = {
  title: "Профиль",
  subtitle: "Личные данные, тренировочные настройки и доступ к аккаунту.",
  backButton: "Назад в кабинет",
  profileEyebrow: "Профиль участника клуба",
  sectionNavigationLabel: "Разделы профиля",
  personalSectionTitle: "Личные данные",
  personalSectionDescription: "Основная информация, которая помогает идентифицировать спортсмена.",
  trainingSectionTitle: "Тренировочный профиль",
  trainingSectionDescription:
    "Параметры для планирования нагрузок, расписания и персональных рекомендаций.",
  telegramSectionTitle: "Telegram и рассылка",
  telegramSectionDescription:
    "Свяжите аккаунт с ботом и настройте время получения тренировочного плана.",
  securitySectionTitle: "Аккаунт и безопасность",
  securitySectionDescription: "Управляйте контактной почтой и паролем для входа.",
  emailAccountLabel: "Электронная почта",
  passwordAccountLabel: "Пароль",
  emailVerifiedStatus: "Почта подтверждена",
  emailUnverifiedStatus: "Почта не подтверждена",
  passwordDescription: "Используйте отдельный пароль длиной не менее 6 символов.",
  passwordMaskedValue: "Пароль установлен",
  savedState: "Все изменения сохранены",
  dirtyState: "Есть несохранённые изменения",
  leaveConfirmation: "Изменения не сохранены. Покинуть страницу?",
  saveButton: "Сохранить изменения",
  changeEmailButton: "Изменить почту",
  changePasswordButton: "Изменить пароль",
  deleteProfileButton: "Удалить профиль",
  nameLabel: "Имя",
  lastNameLabel: "Фамилия",
  patronymicLabel: "Отчество",
  heightCmLabel: "Рост, см",
  weeklyWorkloadCountLabel: "Количество нагрузок в неделю",
  genderLabel: "Пол",
  dateOfBirthLabel: "Дата рождения",
  occupationLabel: "Занятость",
  miscellaneousLabel: "Разное",
  timezoneLabel: "Часовой пояс",
  emailModalTitle: "Изменение почты",
  newEmailLabel: "Новая почта",
  currentPasswordLabel: "Текущий пароль",
  passwordModalTitle: "Изменение пароля",
  newPasswordLabel: "Новый пароль",
  confirmPasswordLabel: "Повторите пароль",
  deleteProfileTitle: "Удаление профиля",
  deleteProfileDescription: "Аккаунт и связанные данные будут удалены без восстановления.",
  deleteProfileConfirmText: "Для удаления профиля введите текущий пароль.",
  cancelButton: "Отмена",
  deleteProfileOk: "Удалить профиль",
  profileUpdateOk: "Данные профиля обновлены",
  profileUpdateFail: "Не удалось обновить данные профиля",
  profileUpdateError: "Произошла ошибка при обновлении данных",
  passwordUpdateOk: "Пароль успешно изменен",
  passwordUpdateFail: "Не удалось изменить пароль",
  passwordUpdateError: "Произошла ошибка при изменении пароля",
  emailUpdateOk: "Почта обновлена. Отправили письмо для подтверждения.",
  emailUpdateWarning: "Почта обновлена, но письмо не отправилось. Повторите отправку позже.",
  emailUpdateFail: "Не удалось изменить почту",
  emailUpdateError: "Произошла ошибка при изменении почты",
  deleteProfileSuccess: "Профиль удален",
  deleteProfileFail: "Не удалось удалить профиль",
  deleteProfileError: "Произошла ошибка при удалении профиля",
  deleteProfileForbidden: "Администраторский профиль нельзя удалить.",
  requiredName: "Имя обязательно для заполнения",
  requiredTimezone: "Выберите часовой пояс",
  requiredNewEmail: "Введите новую почту",
  invalidEmail: "Некорректный email",
  requiredCurrentPassword: "Введите текущий пароль",
  requiredNewPassword: "Введите новый пароль",
  requiredConfirmPassword: "Повторите новый пароль",
  invalidCurrentPassword: "Неверный текущий пароль",
  emailConflict: "Этот email или login уже используется",
  emailUnchanged: "Укажите новый email",
  tooLongName: "Слишком длинное имя",
  tooLongPatronymic: "Слишком длинное отчество",
  invalidHeightCm: "Укажите рост от 50 до 250 см",
  invalidWeeklyWorkloadCount: "Укажите количество нагрузок от 0 до 21",
  tooLongMiscellaneous: "Слишком длинное поле «Разное»",
  invalidDateOfBirth: "Дата рождения не может быть в будущем",
  tooLongEmail: "Слишком длинный email",
  tooLongPassword: "Слишком длинный пароль",
  minPassword: "Минимум 6 символов",
  passwordMismatch: "Пароли не совпадают",
} as const;

export const PROFILE_SECTIONS = {
  PERSONAL: {
    id: "personal-data",
    index: "01",
    label: "Данные",
    title: PROFILE_LABELS.personalSectionTitle,
    description: PROFILE_LABELS.personalSectionDescription,
  },
  TRAINING: {
    id: "training-profile",
    index: "02",
    label: "Тренировки",
    title: PROFILE_LABELS.trainingSectionTitle,
    description: PROFILE_LABELS.trainingSectionDescription,
  },
  TELEGRAM: {
    id: "telegram-settings",
    index: "03",
    label: "Telegram",
    title: PROFILE_LABELS.telegramSectionTitle,
    description: PROFILE_LABELS.telegramSectionDescription,
  },
  SECURITY: {
    id: "account-security",
    index: "04",
    label: "Безопасность",
    title: PROFILE_LABELS.securitySectionTitle,
    description: PROFILE_LABELS.securitySectionDescription,
  },
  DANGER: {
    id: "profile-danger-zone",
    index: "05",
    label: "Удаление",
    title: PROFILE_LABELS.deleteProfileTitle,
    description: PROFILE_LABELS.deleteProfileDescription,
    requiresDeletePermission: true,
  },
} as const;

export const PROFILE_NAV_ITEMS = Object.values(PROFILE_SECTIONS);

export const PROFILE_FORM_IDS = {
  EMAIL: "profile-email-form",
  PASSWORD: "profile-password-form",
  DELETE: "profile-delete-form",
} as const;

export const PROFILE_ROLE_LABELS: Record<string, string> = {
  athlete: "Спортсмен",
  coach: "Тренер",
  admin: "Администратор",
};

export const PROFILE_ROLE_FALLBACK = "Участник клуба";

export const GENDER_OPTIONS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];

export const OCCUPATION_OPTIONS = [
  { value: "work", label: "Работа" },
  { value: "study", label: "Учеба" },
];

export const PROFILE_DATE_FORMAT = "YYYY-MM-DD";
export const PROFILE_DATE_DISPLAY_FORMAT = "DD.MM.YYYY";
