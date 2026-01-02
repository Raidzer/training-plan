"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  message,
  Space,
} from "antd";
import styles from "./diary.module.scss";
import type { DayPayload, RecoveryEntry } from "./types/diaryTypes";
import {
  formatDate,
  formatScore,
  formatSleepTimeValue,
  formatWeightValue,
  joinValues,
} from "./utils/diaryUtils";
import { useDiaryData } from "./hooks/useDiaryData";
import { DiaryHeader } from "./components/DiaryHeader";
import { DiaryCalendar } from "./components/DiaryCalendar";
import { DiaryStatusBlock } from "./components/DiaryStatusBlock";
import { WeightCard } from "./components/WeightCard";
import { RecoveryCard } from "./components/RecoveryCard";
import { WorkoutsCard } from "./components/WorkoutsCard";
import { DailyReportModal } from "./components/DailyReportModal";

const formatRecoveryFlags = (entry?: RecoveryEntry | null) => {
  if (!entry) return "";
  const flags = [
    entry.hasBath ? "Баня" : null,
    entry.hasMfr ? "МФР" : null,
    entry.hasMassage ? "Массаж" : null,
  ].filter(Boolean);
  return flags.length ? flags.join(", ") : "";
};

const formatReportDate = (value: string) => {
  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const parsed = dayjs(value, "YYYY-MM-DD", true);
  if (!parsed.isValid()) return value;
  const dayIndex = parsed.day();
  const dayLabel = weekdays[dayIndex] ?? "";
  return `${parsed.format("DD.MM.YYYY")}(${dayLabel})`;
};

const WEATHER_OPTIONS = [
  { value: "cloudy", label: "Пасмурно" },
  { value: "sunny", label: "Солнечно" },
  { value: "rain", label: "Дождь" },
  { value: "snow", label: "Снег" },
] as const;

const SURFACE_OPTIONS = [
  { value: "ground", label: "Грунт" },
  { value: "asphalt", label: "Асфальт" },
  { value: "manezh", label: "Манеж" },
  { value: "stadium", label: "Стадион" },
] as const;

const WIND_OPTIONS = [
  { value: "true", label: "Есть" },
  { value: "false", label: "Нет" },
] as const;

const getOptionLabel = (
  options: readonly { value: string; label: string }[],
  value?: string | null
) => options.find((option) => option.value === value)?.label ?? "";

const formatTemperatureValue = (value?: string | null) => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const parsed = Number(trimmed);
  const temperatureText = Number.isFinite(parsed)
    ? (Math.round(parsed * 10) / 10).toFixed(1)
    : trimmed;
  return `${temperatureText}°C`;
};

const buildDailyReportText = (params: {
  date: string;
  day: DayPayload | null;
}) => {
  if (!params.day) return "";
  const reportByPlan = new Map(
    params.day.workoutReports.map((report) => [report.planEntryId, report])
  );
  const startTimes = params.day.planEntries.map(
    (entry) => reportByPlan.get(entry.id)?.startTime
  );
  const tasks = params.day.planEntries.map((entry) => entry.taskText);
  const results = params.day.planEntries.map(
    (entry) => reportByPlan.get(entry.id)?.resultText
  );
  const comments = params.day.planEntries.map(
    (entry) => reportByPlan.get(entry.id)?.commentText
  );
  const temperatures = params.day.planEntries.map((entry) =>
    formatTemperatureValue(reportByPlan.get(entry.id)?.temperatureC)
  );
  const weathers = params.day.planEntries.map((entry) =>
    getOptionLabel(WEATHER_OPTIONS, reportByPlan.get(entry.id)?.weather)
  );
  const winds = params.day.planEntries.map((entry) =>
    reportByPlan.get(entry.id)?.hasWind ? "ветер" : ""
  );
  const surfaces = params.day.planEntries.map((entry) =>
    getOptionLabel(SURFACE_OPTIONS, reportByPlan.get(entry.id)?.surface)
  );
  const commentBlock = [
    joinValues(comments),
    joinValues(temperatures),
    joinValues(weathers),
    joinValues(winds),
    joinValues(surfaces),
  ]
    .filter((line) => line.trim().length > 0)
    .join(". ");
  const morningWeight = params.day.weightEntries.find(
    (entry) => entry.period === "morning"
  )?.weightKg;
  const volumeKm =
    params.day.status.totalDistanceKm > 0
      ? params.day.status.totalDistanceKm.toFixed(2)
      : "";

  const lines = [
    formatReportDate(params.date),
    joinValues(startTimes),
    joinValues(tasks),
    joinValues(results),
    commentBlock,
    formatScore(params.day.recoveryEntry),
    formatSleepTimeValue(params.day.recoveryEntry.sleepHours),
    joinValues([
      formatWeightValue(params.day.previousEveningWeightKg),
      formatWeightValue(morningWeight),
    ]),
    formatRecoveryFlags(params.day.recoveryEntry),
    volumeKm ? `${volumeKm} км` : "",
  ];

  return lines.filter((line) => line.trim().length > 0).join("\n\n");
};

const diaryMessages = {
  marksLoadFailed: "Не удалось загрузить отметки календаря.",
  dayLoadFailed: "Не удалось загрузить дневник за день.",
  weightInvalid: "Введите корректный вес.",
  weightSaveFailed: "Не удалось сохранить вес.",
  weightSaved: "Вес сохранен.",
  workoutRequired: "Время начала и результат обязательны.",
  workoutDistanceInvalid: "Введите корректную дистанцию тренировки.",
  workoutTemperatureInvalid: "Введите корректную температуру воздуха.",
  workoutSaveFailed: "Не удалось сохранить отчет о тренировке.",
  workoutSaved: "Отчет о тренировке сохранен.",
  recoveryInvalidSleep: "Введите время сна в формате ЧЧ:ММ.",
  recoverySaveFailed: "Не удалось сохранить отметки восстановления.",
  recoverySaved: "Отметки восстановления сохранены.",
} as const;

const headerLabels = {
  title: "Дневник за день",
  subtitle: "Отмечайте вес и отчеты о тренировках за выбранный день.",
  periodLabel: "Просмотр периода",
  dashboardLabel: "Назад к панели",
};

const calendarLabels = {
  title: "Календарь",
};

const statusLabels = {
  reportButton: "Ежедневный отчет",
  dayComplete: "День заполнен",
  dayIncomplete: "День не заполнен",
  weightLabel: "Вес",
  weightMorningShort: "У",
  weightEveningShort: "В",
  workoutsLabel: "Тренировки",
};

const weightLabels = {
  title: "Вес",
  morningPlaceholder: "Вес утром",
  eveningPlaceholder: "Вес вечером",
  saveLabel: "Сохранить",
};

const recoveryLabels = {
  title: "Восстановление",
  bathLabel: "Баня",
  mfrLabel: "МФР",
  massageLabel: "Массаж",
  overallLabel: "Общая оценка",
  functionalLabel: "Функциональная оценка",
  muscleLabel: "Мышечная оценка",
  sleepLabel: "Сон, часы",
  sleepPlaceholder: "ЧЧ:ММ",
  scorePlaceholder: "1-10",
  saveLabel: "Сохранить",
};

const workoutLabels = {
  title: "Тренировки",
  emptyLabel: "На эту дату тренировки не запланированы.",
  completeLabel: "Заполнено",
  incompleteLabel: "Не заполнено",
  startTimePlaceholder: "Время начала (ЧЧ:ММ)",
  resultPlaceholder: "Результат",
  distancePlaceholder: "Дистанция (км)",
  surfacePlaceholder: "Покрытие",
  weatherPlaceholder: "Погода",
  windPlaceholder: "Ветер",
  temperaturePlaceholder: "Температура, °C",
  commentPlaceholder: "Комментарий",
  saveReportLabel: "Сохранить отчет",
};

const reportLabels = {
  title: "Ежедневный отчет",
  closeLabel: "Закрыть",
};

export function DiaryClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const {
    selectedDate,
    setPanelDate,
    marks,
    loadingMarks,
    dayData,
    loadingDay,
    weightForm,
    setWeightForm,
    recoveryForm,
    setRecoveryForm,
    savingWeight,
    savingRecovery,
    workoutForm,
    setWorkoutForm,
    savingWorkouts,
    updateSelectedDate,
    shiftDate,
    handleSaveWeight,
    handleSaveWorkout,
    handleSaveRecovery,
  } = useDiaryData({ messageApi, messages: diaryMessages });
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleWeightChange = (
    period: "morning" | "evening",
    value: string
  ) => {
    setWeightForm((prev) => ({ ...prev, [period]: value }));
  };

  const handleRecoveryToggle = (
    field: "hasBath" | "hasMfr" | "hasMassage",
    checked: boolean
  ) => {
    setRecoveryForm((prev) => ({ ...prev, [field]: checked }));
  };

  const handleRecoveryScoreChange = (
    field: "overallScore" | "functionalScore" | "muscleScore",
    value: number | null
  ) => {
    setRecoveryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRecoverySleepChange = (value: string) => {
    setRecoveryForm((prev) => ({ ...prev, sleepHours: value }));
  };

  const handleWorkoutChange = (
    entryId: number,
    field:
      | "startTime"
      | "resultText"
      | "distanceKm"
      | "commentText"
      | "weather"
      | "hasWind"
      | "temperatureC"
      | "surface",
    value: string
  ) => {
    setWorkoutForm((prev) => {
      const current = prev[entryId] ?? {
        startTime: "",
        resultText: "",
        commentText: "",
        distanceKm: "",
        weather: "",
        hasWind: "",
        temperatureC: "",
        surface: "",
      };
      const next = { ...current, [field]: value };
      if (field === "surface" && value === "manezh") {
        next.weather = "";
        next.hasWind = "";
        next.temperatureC = "";
      }
      return { ...prev, [entryId]: next };
    });
  };

  const quickActions = useMemo(
    () => [
      { label: "Предыдущий день", action: () => shiftDate(-1, "day") },
      { label: "Следующий день", action: () => shiftDate(1, "day") },
      { label: "Предыдущая неделя", action: () => shiftDate(-1, "week") },
      { label: "Следующая неделя", action: () => shiftDate(1, "week") },
      { label: "Предыдущий месяц", action: () => shiftDate(-1, "month") },
      { label: "Следующий месяц", action: () => shiftDate(1, "month") },
      { label: "Сегодня", action: () => updateSelectedDate(dayjs()) },
    ],
    [shiftDate, updateSelectedDate]
  );

  const status = dayData?.status;
  const workoutsComplete = status
    ? status.workoutsTotal === 0 ||
      status.workoutsWithFullReport === status.workoutsTotal
    : false;
  const reportText = useMemo(
    () =>
      buildDailyReportText({
        date: formatDate(selectedDate),
        day: dayData,
      }),
    [dayData, selectedDate]
  );

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space
          orientation="vertical"
          size="large"
          className={styles.spaceStyle}
        >
          <DiaryHeader
            title={headerLabels.title}
            subtitle={headerLabels.subtitle}
            periodHref="/diary/period"
            periodLabel={headerLabels.periodLabel}
            dashboardHref="/dashboard"
            dashboardLabel={headerLabels.dashboardLabel}
          />
          <div className={styles.grid}>
            <div className={styles.calendarBlock}>
              <DiaryCalendar
                title={calendarLabels.title}
                loading={loadingMarks && Object.keys(marks).length === 0}
                selectedDate={selectedDate}
                marks={marks}
                quickActions={quickActions}
                onSelectDate={updateSelectedDate}
                onPanelChange={setPanelDate}
              />
            </div>
            <div className={styles.dayBlock}>
              <Card
                title={`Выбранный день: ${formatDate(selectedDate)}`}
                loading={loadingDay && !dayData}
                className={styles.dayCard}
              >
                <Space
                  orientation="vertical"
                  size="middle"
                  className={styles.spaceStyle}
                >
                  <DiaryStatusBlock
                    status={status}
                    workoutsComplete={workoutsComplete}
                    disabledReport={!dayData}
                    labels={statusLabels}
                    onOpenReport={() => setIsReportOpen(true)}
                  />

                  <WeightCard
                    title={weightLabels.title}
                    morningPlaceholder={weightLabels.morningPlaceholder}
                    eveningPlaceholder={weightLabels.eveningPlaceholder}
                    saveLabel={weightLabels.saveLabel}
                    weightForm={weightForm}
                    savingWeight={savingWeight}
                    onChange={handleWeightChange}
                    onSave={handleSaveWeight}
                  />

                  <RecoveryCard
                    title={recoveryLabels.title}
                    bathLabel={recoveryLabels.bathLabel}
                    mfrLabel={recoveryLabels.mfrLabel}
                    massageLabel={recoveryLabels.massageLabel}
                    overallLabel={recoveryLabels.overallLabel}
                    functionalLabel={recoveryLabels.functionalLabel}
                    muscleLabel={recoveryLabels.muscleLabel}
                    sleepLabel={recoveryLabels.sleepLabel}
                    sleepPlaceholder={recoveryLabels.sleepPlaceholder}
                    scorePlaceholder={recoveryLabels.scorePlaceholder}
                    saveLabel={recoveryLabels.saveLabel}
                    recoveryForm={recoveryForm}
                    savingRecovery={savingRecovery}
                    onToggle={handleRecoveryToggle}
                    onScoreChange={handleRecoveryScoreChange}
                    onSleepChange={handleRecoverySleepChange}
                    onSave={handleSaveRecovery}
                  />

                  <WorkoutsCard
                    title={workoutLabels.title}
                    emptyLabel={workoutLabels.emptyLabel}
                    completeLabel={workoutLabels.completeLabel}
                    incompleteLabel={workoutLabels.incompleteLabel}
                    startTimePlaceholder={workoutLabels.startTimePlaceholder}
                    resultPlaceholder={workoutLabels.resultPlaceholder}
                    distancePlaceholder={workoutLabels.distancePlaceholder}
                    surfacePlaceholder={workoutLabels.surfacePlaceholder}
                    weatherPlaceholder={workoutLabels.weatherPlaceholder}
                    windPlaceholder={workoutLabels.windPlaceholder}
                    temperaturePlaceholder={workoutLabels.temperaturePlaceholder}
                    commentPlaceholder={workoutLabels.commentPlaceholder}
                    saveReportLabel={workoutLabels.saveReportLabel}
                    surfaceOptions={SURFACE_OPTIONS}
                    weatherOptions={WEATHER_OPTIONS}
                    windOptions={WIND_OPTIONS}
                    entries={dayData?.planEntries ?? []}
                    workoutForm={workoutForm}
                    savingWorkouts={savingWorkouts}
                    onChange={handleWorkoutChange}
                    onSave={handleSaveWorkout}
                  />
                </Space>
              </Card>
            </div>
          </div>
        </Space>
      </Card>
      <DailyReportModal
        open={isReportOpen}
        title={reportLabels.title}
        closeLabel={reportLabels.closeLabel}
        reportText={reportText}
        onClose={() => setIsReportOpen(false)}
      />
    </main>
  );
}
