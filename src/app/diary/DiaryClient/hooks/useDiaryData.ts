import { useCallback, useEffect, useRef, useState } from "react";
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
  shoesLoadFailed: string;
};

type DiaryDataParams = {
  messageApi: MessageApi;
  messages: DiaryMessages;
};

type ShoeItem = {
  id: number;
  name: string;
};

const parseShoesResponse = (value: unknown): ShoeItem[] => {
  if (!value || typeof value !== "object") {
    return [];
  }
  const shoesValue = (value as { shoes?: unknown }).shoes;
  if (!Array.isArray(shoesValue)) {
    return [];
  }
  return shoesValue as ShoeItem[];
};

export function useDiaryData({ messageApi, messages }: DiaryDataParams) {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [panelDate, setPanelDate] = useState<Dayjs>(() => dayjs());
  const selectedDateRef = useRef<Dayjs>(selectedDate);
  const marksRequestIdRef = useRef(0);
  const dayRequestIdRef = useRef(0);
  const [marks, setMarks] = useState<DiaryDayMap>({});
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [loadingDay, setLoadingDay] = useState(false);
  const [dayData, setDayData] = useState<DayPayload | null>(null);
  const [shoes, setShoes] = useState<ShoeItem[]>([]);
  const [loadingShoes, setLoadingShoes] = useState(false);

  const [weightForm, setWeightForm] = useState<WeightFormState>({
    morning: "",
    evening: "",
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryForm>({
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
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
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const loadShoes = useCallback(async () => {
    setLoadingShoes(true);
    try {
      const res = await fetch("/api/shoes", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(messages.shoesLoadFailed);
        setShoes([]);
        return;
      }
      const parsed = parseShoesResponse(data);
      if (parsed.length === 0) {
        setShoes([]);
        return;
      }
      setShoes(parsed);
    } catch (err) {
      console.error(err);
      messageApi.error(messages.shoesLoadFailed);
      setShoes([]);
    } finally {
      setLoadingShoes(false);
    }
  }, [messageApi, messages.shoesLoadFailed]);

  useEffect(() => {
    loadShoes();
  }, [loadShoes]);

  useEffect(() => {
    const queryDate = searchParams.get("date");
    if (!isValidDateString(queryDate)) {
      return;
    }
    const parsed = parseDate(queryDate ?? "");
    if (!parsed.isValid()) {
      return;
    }
    if (!parsed.isSame(selectedDateRef.current, "day")) {
      setSelectedDate(parsed);
      setPanelDate(parsed);
    }
  }, [searchParams]);

  const loadMarks = useCallback(
    async (value: Dayjs) => {
      const { from, to } = getMonthRange(value);
      const requestId = ++marksRequestIdRef.current;
      setLoadingMarks(true);
      try {
        const res = await fetch(`/api/diary/marks?from=${from}&to=${to}`);
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          error?: string;
        } | null;
        if (marksRequestIdRef.current !== requestId) {
          return;
        }
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
        if (marksRequestIdRef.current !== requestId) {
          return;
        }
        console.error(err);
        messageApi.error(messages.marksLoadFailed);
      } finally {
        if (marksRequestIdRef.current === requestId) {
          setLoadingMarks(false);
        }
      }
    },
    [messageApi, messages]
  );

  const loadDay = useCallback(
    async (value: Dayjs) => {
      const date = formatDate(value);
      const requestId = ++dayRequestIdRef.current;
      setLoadingDay(true);
      try {
        const res = await fetch(`/api/diary/day?date=${date}`);
        const data = (await res.json().catch(() => null)) as
          | (DayPayload & { error?: string })
          | null;
        if (dayRequestIdRef.current !== requestId) {
          return;
        }
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
          sleepHours: formatSleepTimeValue(data.recoveryEntry?.sleepHours),
        };
        setRecoveryForm(nextRecovery);
        const reportMap = new Map(
          data.workoutReports.map((report) => [report.planEntryId, report])
        );
        const nextWorkoutForm: WorkoutFormState = {};
        data.planEntries.forEach((entry) => {
          nextWorkoutForm[entry.id] = toDefaultWorkoutForm(reportMap.get(entry.id));
        });
        setWorkoutForm(nextWorkoutForm);
      } catch (err) {
        if (dayRequestIdRef.current !== requestId) {
          return;
        }
        console.error(err);
        messageApi.error(messages.dayLoadFailed);
      } finally {
        if (dayRequestIdRef.current === requestId) {
          setLoadingDay(false);
        }
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
      const value = period === "morning" ? weightForm.morning : weightForm.evening;
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
    [loadDay, loadMarks, messageApi, messages, panelDate, selectedDate, weightForm]
  );

  const handleSaveWorkout = useCallback(
    async (planEntryId: number) => {
      const form = workoutForm[planEntryId];
      if (!form?.startTime || !form?.resultText?.trim()) {
        messageApi.error(messages.workoutRequired);
        return;
      }
      const distanceValue = form.distanceKm.trim();
      const distanceKm = distanceValue.length > 0 ? Number(distanceValue.replace(",", ".")) : null;

      if (
        distanceKm &&
        distanceValue.length > 0 &&
        (!Number.isFinite(distanceKm) || distanceKm < 0)
      ) {
        messageApi.error(messages.workoutDistanceInvalid);
        return;
      }

      const surfaceValue = form.surface.trim();
      const isIndoorSurface =
        surfaceValue === "manezh" ||
        surfaceValue === "treadmill" ||
        surfaceValue === "Манеж" ||
        surfaceValue === "Беговая дорожка";
      const weatherValue = isIndoorSurface ? "" : form.weather.trim();
      const hasWindValue = isIndoorSurface ? "" : form.hasWind;
      const temperatureValue = isIndoorSurface ? "" : form.temperatureC.trim();
      const temperatureC =
        temperatureValue.length > 0 ? Number(temperatureValue.replace(",", ".")) : null;
      const rawShoeIds = Array.isArray(form.shoeIds) ? form.shoeIds : [];
      const shoeIds = Array.from(
        new Set(rawShoeIds.filter((shoeId) => Number.isInteger(shoeId) && shoeId > 0))
      );

      if (!isIndoorSurface && temperatureValue.length > 0 && !Number.isFinite(temperatureC)) {
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
            overallScore: form.overallScore,
            functionalScore: form.functionalScore,
            muscleScore: form.muscleScore,
            surface: surfaceValue.length > 0 ? surfaceValue : null,
            weather: weatherValue.length > 0 ? weatherValue : null,
            hasWind: hasWindValue === "true" ? true : hasWindValue === "false" ? false : null,
            temperatureC,
            shoeIds,
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
    [loadDay, loadMarks, messageApi, messages, panelDate, selectedDate, workoutForm]
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
    shoes,
    loadingShoes,
    updateSelectedDate,
    shiftDate,
    handleSaveWeight,
    handleSaveWorkout,
    handleSaveRecovery,
  };
}
