"use client";

import { useMemo, useState } from "react";
import { Card, message } from "antd";
import { useRouter } from "next/navigation";
import styles from "./DiaryClient.module.scss";
import { buildDailyReportText } from "@/shared/utils/dailyReport";
import { formatDate } from "./utils/diaryUtils";
import { useDiaryData } from "./hooks/useDiaryData";
import { DiaryHeader } from "./components/DiaryHeader/DiaryHeader";
import { DiaryCalendar } from "./components/DiaryCalendar/DiaryCalendar";
import { DiaryStatusBlock } from "./components/DiaryStatusBlock/DiaryStatusBlock";
import { WeightCard } from "./components/WeightCard/WeightCard";
import { RecoveryCard } from "./components/RecoveryCard/RecoveryCard";
import { WorkoutsCard } from "./components/WorkoutsCard/WorkoutsCard";
import { WorkoutEditModal } from "./components/WorkoutEditModal/WorkoutEditModal";
import { DailyReportModal } from "./components/DailyReportModal/DailyReportModal";
import {
  CALENDAR_LABELS,
  DIARY_MESSAGES,
  HEADER_LABELS,
  RECOVERY_LABELS,
  REPORT_LABELS,
  STATUS_LABELS,
  SURFACE_OPTIONS,
  WEATHER_OPTIONS,
  WEIGHT_LABELS,
  WIND_OPTIONS,
  WORKOUT_EDIT_LABELS,
  WORKOUT_LABELS,
} from "./constants/diaryConstants";

export function DiaryClient({ userId }: { userId: number }) {
  const router = useRouter();
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
    workoutEditForm,
    savingWorkoutEdit,
    shoes,
    loadingShoes,
    updateSelectedDate,
    openWorkoutEdit,
    closeWorkoutEdit,
    updateWorkoutEditTaskText,
    updateWorkoutEditCommentText,
    handleSaveWeight,
    handleSaveWorkout,
    handleSaveWorkoutEdit,
    handleSaveRecovery,
  } = useDiaryData({ messageApi, messages: DIARY_MESSAGES });
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

  const handleRecoveryAdditionalSleepChange = (value: string) => {
    setRecoveryForm((prev) => ({ ...prev, additionalSleepHours: value }));
  };

  const handleRecoveryOtherChange = (value: string) => {
    setRecoveryForm((prev) => ({ ...prev, recoveryOther: value }));
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
      | "shoeIds"
      | "shoeMileageKm",
    value: string | number | number[] | Record<number, string> | null
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
        shoeMileageKm: {},
      };
      let next = current;
      if (field === "shoeIds") {
        const nextIds = Array.isArray(value) ? value : [];
        const nextMileage = Object.fromEntries(
          nextIds.map((shoeId) => [shoeId, current.shoeMileageKm?.[shoeId] ?? ""])
        );
        next = { ...current, shoeIds: nextIds, shoeMileageKm: nextMileage };
      } else if (field === "shoeMileageKm") {
        const nextMileage =
          value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<number, string>)
            : {};
        next = { ...current, shoeMileageKm: nextMileage };
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
      <div className={styles.pageStack}>
        <DiaryHeader
          title={HEADER_LABELS.title}
          subtitle={HEADER_LABELS.subtitle}
          periodHref="/diary/period"
          periodLabel={HEADER_LABELS.periodLabel}
          onBack={() => router.back()}
          dashboardLabel={HEADER_LABELS.dashboardLabel}
        />
        <div className={styles.grid}>
          <div className={styles.calendarBlock}>
            <DiaryCalendar
              title={CALENDAR_LABELS.title}
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
              <div className={styles.dayContent}>
                <DiaryStatusBlock
                  status={status}
                  workoutsComplete={workoutsComplete}
                  disabledReport={!dayData}
                  labels={STATUS_LABELS}
                  onOpenReport={() => setIsReportOpen(true)}
                />
                <div className={styles.dayLayout}>
                  <div className={styles.weightRecoveryBlock}>
                    <WeightCard
                      title={WEIGHT_LABELS.title}
                      morningPlaceholder={WEIGHT_LABELS.morningPlaceholder}
                      eveningPlaceholder={WEIGHT_LABELS.eveningPlaceholder}
                      saveLabel={WEIGHT_LABELS.saveLabel}
                      weightForm={weightForm}
                      savingWeight={savingWeight}
                      onChange={handleWeightChange}
                      onSave={handleSaveWeight}
                    />
                    <RecoveryCard
                      title={RECOVERY_LABELS.title}
                      bathLabel={RECOVERY_LABELS.bathLabel}
                      mfrLabel={RECOVERY_LABELS.mfrLabel}
                      massageLabel={RECOVERY_LABELS.massageLabel}
                      otherLabel={RECOVERY_LABELS.otherLabel}
                      otherPlaceholder={RECOVERY_LABELS.otherPlaceholder}
                      sleepLabel={RECOVERY_LABELS.sleepLabel}
                      sleepPlaceholder={RECOVERY_LABELS.sleepPlaceholder}
                      additionalSleepLabel={RECOVERY_LABELS.additionalSleepLabel}
                      additionalSleepPlaceholder={RECOVERY_LABELS.additionalSleepPlaceholder}
                      saveLabel={RECOVERY_LABELS.saveLabel}
                      recoveryForm={recoveryForm}
                      savingRecovery={savingRecovery}
                      onToggle={handleRecoveryToggle}
                      onOtherChange={handleRecoveryOtherChange}
                      onSleepChange={handleRecoverySleepChange}
                      onAdditionalSleepChange={handleRecoveryAdditionalSleepChange}
                      onSave={handleSaveRecovery}
                    />
                  </div>
                  <div className={styles.workoutsBlock}>
                    <WorkoutsCard
                      userId={userId}
                      messageApi={messageApi}
                      title={WORKOUT_LABELS.title}
                      emptyLabel={WORKOUT_LABELS.emptyLabel}
                      completeLabel={WORKOUT_LABELS.completeLabel}
                      incompleteLabel={WORKOUT_LABELS.incompleteLabel}
                      startTimePlaceholder={WORKOUT_LABELS.startTimePlaceholder}
                      resultPlaceholder={WORKOUT_LABELS.resultPlaceholder}
                      distancePlaceholder={WORKOUT_LABELS.distancePlaceholder}
                      overallScoreLabel={WORKOUT_LABELS.overallScoreLabel}
                      functionalScoreLabel={WORKOUT_LABELS.functionalScoreLabel}
                      muscleScoreLabel={WORKOUT_LABELS.muscleScoreLabel}
                      scorePlaceholder={WORKOUT_LABELS.scorePlaceholder}
                      surfacePlaceholder={WORKOUT_LABELS.surfacePlaceholder}
                      shoePlaceholder={WORKOUT_LABELS.shoePlaceholder}
                      shoeMileagePlaceholder={WORKOUT_LABELS.shoeMileagePlaceholder}
                      weatherPlaceholder={WORKOUT_LABELS.weatherPlaceholder}
                      windPlaceholder={WORKOUT_LABELS.windPlaceholder}
                      temperaturePlaceholder={WORKOUT_LABELS.temperaturePlaceholder}
                      commentPlaceholder={WORKOUT_LABELS.commentPlaceholder}
                      saveReportLabel={WORKOUT_LABELS.saveReportLabel}
                      editWorkoutLabel={WORKOUT_LABELS.editWorkoutLabel}
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
                      onEditWorkout={openWorkoutEdit}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <DailyReportModal
        open={isReportOpen}
        title={REPORT_LABELS.title}
        closeLabel={REPORT_LABELS.closeLabel}
        reportText={reportText}
        onClose={() => setIsReportOpen(false)}
      />
      <WorkoutEditModal
        open={workoutEditForm.entryId !== null}
        saving={savingWorkoutEdit}
        form={workoutEditForm}
        labels={WORKOUT_EDIT_LABELS}
        onTaskTextChange={updateWorkoutEditTaskText}
        onCommentTextChange={updateWorkoutEditCommentText}
        onCancel={closeWorkoutEdit}
        onSave={handleSaveWorkoutEdit}
      />
    </main>
  );
}
