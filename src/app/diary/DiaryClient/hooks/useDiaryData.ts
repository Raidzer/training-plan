import { useCallback, useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "next/navigation";
import type {
  DayPayload,
  DayStatus,
  DiaryDayMap,
  RecoveryForm,
  SavingWeightState,
  SavingWorkoutsState,
  WeightFormState,
  WorkoutFormState,
} from "../types/diaryTypes";
import {
  formatDate,
  formatSleepTimeValue,
  formatWeightValue,
  getMonthRange,
  isValidDateString,
  parseDate,
  parseOptionalNumber,
  parseSleepTimeInput,
  toDefaultWorkoutForm,
} from "../utils/diaryUtils";

type MessageApi = {
  error: (content: string) => void;
  success: (content: string) => void;
};

export type DiaryMessages = {
  marksLoadFailed: string;
  dayLoadFailed: string;
  weightInvalid: string;
  weightSaveFailed: string;
  weightSaved: string;
  workoutRequired: string;
  workoutDistanceInvalid: string;
  workoutTemperatureInvalid: string;
  workoutSaveFailed: string;
  workoutSaved: string;
  recoveryInvalidSleep: string;
  recoverySaveFailed: string;
  recoverySaved: string;
};

type DiaryDataParams = {
  messageApi: MessageApi;
  messages: DiaryMessages;
};

export function useDiaryData({ messageApi, messages }: DiaryDataParams) {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [panelDate, setPanelDate] = useState<Dayjs>(() => dayjs());
  const [marks, setMarks] = useState<DiaryDayMap>({});
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [loadingDay, setLoadingDay] = useState(false);
  const [dayData, setDayData] = useState<DayPayload | null>(null);

  const [weightForm, setWeightForm] = useState<WeightFormState>({
    morning: "",
    evening: "",
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryForm>({
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: "",
  });
  const [savingWeight, setSavingWeight] = useState<SavingWeightState>({
    morning: false,
    evening: false,
  });
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>({});
  const [savingWorkouts, setSavingWorkouts] = useState<SavingWorkoutsState>({});

  useEffect(() => {
    const queryDate = searchParams.get("date");
    if (!isValidDateString(queryDate)) {
      return;
    }
    const parsed = parseDate(queryDate ?? "");
    if (!parsed.isValid()) {
      return;
    }
    if (!parsed.isSame(selectedDate, "day")) {
      setSelectedDate(parsed);
      setPanelDate(parsed);
    }
  }, [searchParams, selectedDate]);

  const loadMarks = useCallback(
    async (value: Dayjs) => {
      const { from, to } = getMonthRange(value);
      setLoadingMarks(true);
      try {
        const res = await fetch(`/api/diary/marks?from=${from}&to=${to}`);
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          error?: string;
        } | null;
        if (!res.ok || !data?.days) {
          messageApi.error(data?.error ?? messages.marksLoadFailed);
          return;
        }
        const nextMarks: DiaryDayMap = {};
        data.days.forEach((day) => {
          nextMarks[day.date] = day;
        });
        setMarks(nextMarks);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.marksLoadFailed);
      } finally {
        setLoadingMarks(false);
      }
    },
    [messageApi, messages]
  );

  const loadDay = useCallback(
    async (value: Dayjs) => {
      const date = formatDate(value);
      setLoadingDay(true);
      try {
        const res = await fetch(`/api/diary/day?date=${date}`);
        const data = (await res.json().catch(() => null)) as
          | (DayPayload & { error?: string })
          | null;
        if (!res.ok || !data?.status) {
          messageApi.error(data?.error ?? messages.dayLoadFailed);
          return;
        }
        setDayData(data);
        const nextWeight = { morning: "", evening: "" };
        data.weightEntries.forEach((entry) => {
          if (entry.period === "morning") {
            nextWeight.morning = formatWeightValue(entry.weightKg);
          }
          if (entry.period === "evening") {
            nextWeight.evening = formatWeightValue(entry.weightKg);
          }
        });
        setWeightForm(nextWeight);
        const nextRecovery = {
          hasBath: Boolean(data.recoveryEntry?.hasBath),
          hasMfr: Boolean(data.recoveryEntry?.hasMfr),
          hasMassage: Boolean(data.recoveryEntry?.hasMassage),
          overallScore: parseOptionalNumber(data.recoveryEntry?.overallScore),
          functionalScore: parseOptionalNumber(
            data.recoveryEntry?.functionalScore
          ),
          muscleScore: parseOptionalNumber(data.recoveryEntry?.muscleScore),
          sleepHours: formatSleepTimeValue(data.recoveryEntry?.sleepHours),
        };
        setRecoveryForm(nextRecovery);
        const reportMap = new Map(
          data.workoutReports.map((report) => [report.planEntryId, report])
        );
        const nextWorkoutForm: WorkoutFormState = {};
        data.planEntries.forEach((entry) => {
          nextWorkoutForm[entry.id] = toDefaultWorkoutForm(
            reportMap.get(entry.id)
          );
        });
        setWorkoutForm(nextWorkoutForm);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.dayLoadFailed);
      } finally {
        setLoadingDay(false);
      }
    },
    [messageApi, messages]
  );

  useEffect(() => {
    loadMarks(panelDate);
  }, [panelDate, loadMarks]);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  const updateSelectedDate = useCallback((value: Dayjs) => {
    setSelectedDate(value);
    setPanelDate(value);
  }, []);

  const shiftDate = useCallback(
    (amount: number, unit: "day" | "week" | "month") => {
      updateSelectedDate(selectedDate.add(amount, unit));
    },
    [selectedDate, updateSelectedDate]
  );

  const handleSaveWeight = useCallback(
    async (period: "morning" | "evening") => {
      const value =
        period === "morning" ? weightForm.morning : weightForm.evening;
      const weightInput = Number(String(value).replace(",", "."));
      if (!Number.isFinite(weightInput) || weightInput <= 0) {
        messageApi.error(messages.weightInvalid);
        return;
      }
      const weight = Math.round(weightInput * 10) / 10;
      setSavingWeight((prev) => ({ ...prev, [period]: true }));
      try {
        const res = await fetch("/api/diary/weight", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            date: formatDate(selectedDate),
            period,
            weightKg: weight,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          messageApi.error(data?.error ?? messages.weightSaveFailed);
          return;
        }
        messageApi.success(messages.weightSaved);
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.weightSaveFailed);
      } finally {
        setSavingWeight((prev) => ({ ...prev, [period]: false }));
      }
    },
    [
      loadDay,
      loadMarks,
      messageApi,
      messages,
      panelDate,
      selectedDate,
      weightForm,
    ]
  );

  const handleSaveWorkout = useCallback(
    async (planEntryId: number) => {
      const form = workoutForm[planEntryId];
      if (!form?.startTime || !form?.resultText?.trim()) {
        messageApi.error(messages.workoutRequired);
        return;
      }
      const distanceValue = form.distanceKm.trim();
      const distanceKm =
        distanceValue.length > 0
          ? Number(distanceValue.replace(",", "."))
          : null;

      if (
        distanceKm &&
        distanceValue.length > 0 &&
        (!Number.isFinite(distanceKm) || distanceKm < 0)
      ) {
        messageApi.error(messages.workoutDistanceInvalid);
        return;
      }

      const surfaceValue = form.surface.trim();
      const isManezh = surfaceValue === "manezh";
      const weatherValue = isManezh ? "" : form.weather.trim();
      const hasWindValue = isManezh ? "" : form.hasWind;
      const temperatureValue = isManezh ? "" : form.temperatureC.trim();
      const temperatureC =
        temperatureValue.length > 0
          ? Number(temperatureValue.replace(",", "."))
          : null;

      if (
        !isManezh &&
        temperatureValue.length > 0 &&
        !Number.isFinite(temperatureC)
      ) {
        messageApi.error(messages.workoutTemperatureInvalid);
        return;
      }
      setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: true }));
      try {
        const res = await fetch("/api/diary/workout-report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            planEntryId,
            date: formatDate(selectedDate),
            startTime: form.startTime,
            resultText: form.resultText,
            commentText: form.commentText,
            distanceKm,
            surface: surfaceValue.length > 0 ? surfaceValue : null,
            weather: weatherValue.length > 0 ? weatherValue : null,
            hasWind:
              hasWindValue === "true"
                ? true
                : hasWindValue === "false"
                ? false
                : null,
            temperatureC,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          messageApi.error(data?.error ?? messages.workoutSaveFailed);
          return;
        }
        messageApi.success(messages.workoutSaved);
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.workoutSaveFailed);
      } finally {
        setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: false }));
      }
    },
    [
      loadDay,
      loadMarks,
      messageApi,
      messages,
      panelDate,
      selectedDate,
      workoutForm,
    ]
  );

  const handleSaveRecovery = useCallback(async () => {
    const sleepTime = parseSleepTimeInput(recoveryForm.sleepHours);
    if (!sleepTime.valid) {
      messageApi.error(messages.recoveryInvalidSleep);
      return;
    }
    setSavingRecovery(true);
    try {
      const res = await fetch("/api/diary/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: formatDate(selectedDate),
          hasBath: recoveryForm.hasBath,
          hasMfr: recoveryForm.hasMfr,
          hasMassage: recoveryForm.hasMassage,
          overallScore: recoveryForm.overallScore,
          functionalScore: recoveryForm.functionalScore,
          muscleScore: recoveryForm.muscleScore,
          sleepHours: sleepTime.value,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        messageApi.error(data?.error ?? messages.recoverySaveFailed);
        return;
      }
      messageApi.success(messages.recoverySaved);
      loadDay(selectedDate);
    } catch (err) {
      console.error(err);
      messageApi.error(messages.recoverySaveFailed);
    } finally {
      setSavingRecovery(false);
    }
  }, [loadDay, messageApi, messages, recoveryForm, selectedDate]);

  return {
    selectedDate,
    panelDate,
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
  };
}
