"use client";

import { useMemo, useState } from "react";
import { Card, message, Space } from "antd";
import styles from "./diary.module.scss";
import { buildDailyReportText } from "@/shared/utils/dailyReport";
import { formatDate } from "./utils/diaryUtils";
import { useDiaryData } from "./hooks/useDiaryData";
import { DiaryHeader } from "./components/DiaryHeader";
import { DiaryCalendar } from "./components/DiaryCalendar";
import { DiaryStatusBlock } from "./components/DiaryStatusBlock";
import { WeightCard } from "./components/WeightCard";
import { RecoveryCard } from "./components/RecoveryCard";
import { WorkoutsCard } from "./components/WorkoutsCard";
import { DailyReportModal } from "./components/DailyReportModal";

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
  { value: "treadmill", label: "Беговая дорожка" },
  { value: "stadium", label: "Стадион" },
] as const;

const WIND_OPTIONS = [
  { value: "true", label: "Есть" },
  { value: "false", label: "Нет" },
] as const;

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
  shoesLoadFailed: "Не удалось загрузить список обуви.",
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
  overallScoreLabel: recoveryLabels.overallLabel,
  functionalScoreLabel: recoveryLabels.functionalLabel,
  muscleScoreLabel: recoveryLabels.muscleLabel,
  scorePlaceholder: recoveryLabels.scorePlaceholder,
  surfacePlaceholder: "Покрытие",
  shoePlaceholder: "Обувь",
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

export function DiaryClient({ userId }: { userId: number }) {
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
    shoes,
    loadingShoes,
    updateSelectedDate,
    shiftDate,
    handleSaveWeight,
    handleSaveWorkout,
    handleSaveRecovery,
  } = useDiaryData({ messageApi, messages: diaryMessages });
  const [isReportOpen, setIsReportOpen] = useState(false);

  const shoeOptions = useMemo(
    () => shoes.map((shoe) => ({ value: shoe.id, label: shoe.name })),
    [shoes]
  );

  const handleWeightChange = (period: "morning" | "evening", value: string) => {
    setWeightForm((prev) => ({ ...prev, [period]: value }));
  };

  const handleRecoveryToggle = (field: "hasBath" | "hasMfr" | "hasMassage", checked: boolean) => {
    setRecoveryForm((prev) => ({ ...prev, [field]: checked }));
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
      | "overallScore"
      | "functionalScore"
      | "muscleScore"
      | "weather"
      | "hasWind"
      | "temperatureC"
      | "surface"
      | "shoeIds",
    value: string | number | number[] | null
  ) => {
    setWorkoutForm((prev) => {
      const current = prev[entryId] ?? {
        startTime: "",
        resultText: "",
        commentText: "",
        distanceKm: "",
        overallScore: null,
        functionalScore: null,
        muscleScore: null,
        weather: "",
        hasWind: "",
        temperatureC: "",
        surface: "",
        shoeIds: [],
      };
      let next = current;
      if (field === "shoeIds") {
        const nextIds = Array.isArray(value) ? value : [];
        next = { ...current, shoeIds: nextIds };
      } else {
        next = { ...current, [field]: value as string | number | null };
        if (field === "surface") {
          const surfaceValue = typeof value === "string" ? value : "";
          const isIndoorSurface =
            surfaceValue === "manezh" ||
            surfaceValue === "treadmill" ||
            surfaceValue === "Манеж" ||
            surfaceValue === "Беговая дорожка";
          if (isIndoorSurface) {
            next.weather = "";
            next.hasWind = "";
            next.temperatureC = "";
          }
        }
      }
      return { ...prev, [entryId]: next };
    });
  };

  const status = dayData?.status;
  const workoutsComplete = status
    ? status.workoutsTotal === 0 || status.workoutsWithFullReport === status.workoutsTotal
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
        <Space orientation="vertical" size="large" className={styles.spaceStyle}>
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
                <Space orientation="vertical" size="middle" className={styles.spaceStyle}>
                  <DiaryStatusBlock
                    status={status}
                    workoutsComplete={workoutsComplete}
                    disabledReport={!dayData}
                    labels={statusLabels}
                    onOpenReport={() => setIsReportOpen(true)}
                  />
                  <div className={styles.dayLayout}>
                    <div className={styles.weightRecoveryBlock}>
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
                        sleepLabel={recoveryLabels.sleepLabel}
                        sleepPlaceholder={recoveryLabels.sleepPlaceholder}
                        saveLabel={recoveryLabels.saveLabel}
                        recoveryForm={recoveryForm}
                        savingRecovery={savingRecovery}
                        onToggle={handleRecoveryToggle}
                        onSleepChange={handleRecoverySleepChange}
                        onSave={handleSaveRecovery}
                      />
                    </div>
                    <div className={styles.workoutsBlock}>
                      <WorkoutsCard
                        userId={userId}
                        messageApi={messageApi}
                        title={workoutLabels.title}
                        emptyLabel={workoutLabels.emptyLabel}
                        completeLabel={workoutLabels.completeLabel}
                        incompleteLabel={workoutLabels.incompleteLabel}
                        startTimePlaceholder={workoutLabels.startTimePlaceholder}
                        resultPlaceholder={workoutLabels.resultPlaceholder}
                        distancePlaceholder={workoutLabels.distancePlaceholder}
                        overallScoreLabel={workoutLabels.overallScoreLabel}
                        functionalScoreLabel={workoutLabels.functionalScoreLabel}
                        muscleScoreLabel={workoutLabels.muscleScoreLabel}
                        scorePlaceholder={workoutLabels.scorePlaceholder}
                        surfacePlaceholder={workoutLabels.surfacePlaceholder}
                        shoePlaceholder={workoutLabels.shoePlaceholder}
                        weatherPlaceholder={workoutLabels.weatherPlaceholder}
                        windPlaceholder={workoutLabels.windPlaceholder}
                        temperaturePlaceholder={workoutLabels.temperaturePlaceholder}
                        commentPlaceholder={workoutLabels.commentPlaceholder}
                        saveReportLabel={workoutLabels.saveReportLabel}
                        surfaceOptions={SURFACE_OPTIONS}
                        shoeOptions={shoeOptions}
                        weatherOptions={WEATHER_OPTIONS}
                        windOptions={WIND_OPTIONS}
                        shoeLoading={loadingShoes}
                        entries={dayData?.planEntries ?? []}
                        workoutForm={workoutForm}
                        savingWorkouts={savingWorkouts}
                        onChange={handleWorkoutChange}
                        onSave={handleSaveWorkout}
                      />
                    </div>
                  </div>
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
