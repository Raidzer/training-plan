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
  WorkoutEditForm,
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
  workoutShoeMileageInvalid: string;
  workoutTemperatureInvalid: string;
  workoutSaveFailed: string;
  workoutSaved: string;
  workoutEditRequired: string;
  workoutEditNotFound: string;
  workoutEditSaveFailed: string;
  workoutEditSaved: string;
  recoveryInvalidSleep: string;
  recoverySaveFailed: string;
  recoverySaved: string;
  shoesLoadFailed: string;
};

type DiaryDataParams = {
  messageApi: MessageApi;
  messages: DiaryMessages;
};

type LoadDayOptions = {
  preserveForms?: boolean;
};

type ShoeItem = {
  id: number;
  name: string;
};

const MAX_SHOE_MILEAGE_KM = 99999.99;
const EMPTY_WORKOUT_EDIT_FORM: WorkoutEditForm = {
  entryId: null,
  taskText: "",
  commentText: "",
};

const parseShoeMileageInput = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { valid: true, value: null } as const;
  }
  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_SHOE_MILEAGE_KM) {
    return { valid: false, value: null } as const;
  }
  return { valid: true, value: Math.round(parsed * 100) / 100 } as const;
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
  const panelDateRef = useRef<Dayjs>(panelDate);
  const marksRequestIdRef = useRef(0);
  const dayRequestIdRef = useRef(0);
  const panelDateKey = formatDate(panelDate);
  const selectedDateKey = formatDate(selectedDate);
  const [marks, setMarks] = useState<DiaryDayMap>({});
  const [completedMarksKey, setCompletedMarksKey] = useState<string | null>(null);
  const [refreshingMarksCount, setRefreshingMarksCount] = useState(0);
  const loadingMarks = refreshingMarksCount > 0 || completedMarksKey !== panelDateKey;

  const [dayData, setDayData] = useState<DayPayload | null>(null);
  const [completedDayKey, setCompletedDayKey] = useState<string | null>(null);
  const [refreshingDayCount, setRefreshingDayCount] = useState(0);
  const loadingDay = refreshingDayCount > 0 || completedDayKey !== selectedDateKey;
  const [shoes, setShoes] = useState<ShoeItem[]>([]);
  const [shoesLoaded, setShoesLoaded] = useState(false);
  const loadingShoes = !shoesLoaded;

  const [weightForm, setWeightForm] = useState<WeightFormState>({
    morning: "",
    evening: "",
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryForm>({
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    recoveryOther: "",
    sleepHours: "",
    additionalSleepHours: "",
  });
  const [savingWeight, setSavingWeight] = useState<SavingWeightState>({
    morning: false,
    evening: false,
  });
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>({});
  const [savingWorkouts, setSavingWorkouts] = useState<SavingWorkoutsState>({});
  const [workoutEditForm, setWorkoutEditForm] = useState<WorkoutEditForm>(EMPTY_WORKOUT_EDIT_FORM);
  const [savingWorkoutEdit, setSavingWorkoutEdit] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/shoes", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!active) {
          return;
        }

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
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        console.error(err);
        messageApi.error(messages.shoesLoadFailed);
        setShoes([]);
      })
      .finally(() => {
        if (active) {
          setShoesLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi, messages.shoesLoadFailed]);

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
      selectedDateRef.current = parsed;
      panelDateRef.current = parsed;
      setPanelDate(parsed);
    }
  }, [searchParams]);

  const applyDayData = useCallback((data: DayPayload, options?: LoadDayOptions) => {
    setDayData(data);
    if (options?.preserveForms) {
      return;
    }
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
      recoveryOther: data.recoveryEntry?.recoveryOther ?? "",
      sleepHours: formatSleepTimeValue(data.recoveryEntry?.sleepHours),
      additionalSleepHours: formatSleepTimeValue(data.recoveryEntry?.additionalSleepHours),
    };
    setRecoveryForm(nextRecovery);
    const reportMap = new Map(data.workoutReports.map((report) => [report.planEntryId, report]));
    const nextWorkoutForm: WorkoutFormState = {};
    data.planEntries.forEach((entry) => {
      nextWorkoutForm[entry.id] = toDefaultWorkoutForm(reportMap.get(entry.id));
    });
    setWorkoutForm(nextWorkoutForm);
  }, []);

  const loadMarks = useCallback(
    async (value: Dayjs) => {
      const { from, to } = getMonthRange(value);
      const dateKey = formatDate(value);
      const requestId = ++marksRequestIdRef.current;
      setRefreshingMarksCount((prev) => prev + 1);
      try {
        const res = await fetch(`/api/diary/marks?from=${from}&to=${to}`);
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          error?: string;
        } | null;
        if (marksRequestIdRef.current !== requestId) {
          return;
        }
        if (!res.ok) {
          messageApi.error(data?.error ?? messages.marksLoadFailed);
          return;
        }
        if (!data?.days) {
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
          setCompletedMarksKey(dateKey);
        }
        setRefreshingMarksCount((prev) => Math.max(0, prev - 1));
      }
    },
    [messageApi, messages.marksLoadFailed]
  );

  const loadDay = useCallback(
    async (value: Dayjs, options?: LoadDayOptions) => {
      const date = formatDate(value);
      const requestId = ++dayRequestIdRef.current;
      setRefreshingDayCount((prev) => prev + 1);
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
        applyDayData(data, options);
      } catch (err) {
        if (dayRequestIdRef.current !== requestId) {
          return;
        }
        console.error(err);
        messageApi.error(messages.dayLoadFailed);
      } finally {
        if (dayRequestIdRef.current === requestId) {
          setCompletedDayKey(date);
        }
        setRefreshingDayCount((prev) => Math.max(0, prev - 1));
      }
    },
    [applyDayData, messageApi, messages.dayLoadFailed]
  );

  const refreshDiaryAfterSave = useCallback(
    async (savedSelectedDate: Dayjs, savedPanelDate: Dayjs) => {
      const currentSelectedDate = selectedDateRef.current;
      const currentPanelDate = panelDateRef.current;
      const refreshRequests: Promise<void>[] = [];

      if (currentSelectedDate.isSame(savedSelectedDate, "day")) {
        refreshRequests.push(loadDay(currentSelectedDate, { preserveForms: true }));
      }

      if (currentPanelDate.isSame(savedPanelDate, "month")) {
        refreshRequests.push(loadMarks(currentPanelDate));
      }

      await Promise.all(refreshRequests);
    },
    [loadDay, loadMarks]
  );

  useEffect(() => {
    let active = true;
    const { from, to } = getMonthRange(panelDate);
    const requestId = ++marksRequestIdRef.current;

    fetch(`/api/diary/marks?from=${from}&to=${to}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          error?: string;
        } | null;
        if (!active || marksRequestIdRef.current !== requestId) {
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
      })
      .catch((err) => {
        if (!active || marksRequestIdRef.current !== requestId) {
          return;
        }

        console.error(err);
        messageApi.error(messages.marksLoadFailed);
      })
      .finally(() => {
        if (active && marksRequestIdRef.current === requestId) {
          setCompletedMarksKey(panelDateKey);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi, messages.marksLoadFailed, panelDate, panelDateKey]);

  useEffect(() => {
    let active = true;
    const requestId = ++dayRequestIdRef.current;

    fetch(`/api/diary/day?date=${selectedDateKey}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | (DayPayload & { error?: string })
          | null;
        if (!active || dayRequestIdRef.current !== requestId) {
          return;
        }

        if (!res.ok || !data?.status) {
          messageApi.error(data?.error ?? messages.dayLoadFailed);
          return;
        }

        applyDayData(data);
      })
      .catch((err) => {
        if (!active || dayRequestIdRef.current !== requestId) {
          return;
        }

        console.error(err);
        messageApi.error(messages.dayLoadFailed);
      })
      .finally(() => {
        if (active && dayRequestIdRef.current === requestId) {
          setCompletedDayKey(selectedDateKey);
        }
      });

    return () => {
      active = false;
    };
  }, [applyDayData, messageApi, messages.dayLoadFailed, selectedDateKey]);

  const updatePanelDate = useCallback((value: Dayjs) => {
    panelDateRef.current = value;
    setPanelDate(value);
  }, []);

  const updateSelectedDate = useCallback((value: Dayjs) => {
    selectedDateRef.current = value;
    panelDateRef.current = value;
    setSelectedDate(value);
    setPanelDate(value);
  }, []);

  const shiftDate = useCallback(
    (amount: number, unit: "day" | "week" | "month") => {
      updateSelectedDate(selectedDate.add(amount, unit));
    },
    [selectedDate, updateSelectedDate]
  );

  const openWorkoutEdit = useCallback(
    (entryId: number) => {
      const entry = dayData?.planEntries.find((item) => item.id === entryId);
      if (!entry) {
        messageApi.error(messages.workoutEditNotFound);
        return;
      }

      setWorkoutEditForm({
        entryId: entry.id,
        taskText: entry.taskText,
        commentText: entry.commentText ?? "",
      });
    },
    [dayData, messageApi, messages.workoutEditNotFound]
  );

  const closeWorkoutEdit = useCallback(() => {
    if (savingWorkoutEdit) {
      return;
    }

    setWorkoutEditForm(EMPTY_WORKOUT_EDIT_FORM);
  }, [savingWorkoutEdit]);

  const updateWorkoutEditTaskText = useCallback((value: string) => {
    setWorkoutEditForm((prev) => ({ ...prev, taskText: value }));
  }, []);

  const updateWorkoutEditCommentText = useCallback((value: string) => {
    setWorkoutEditForm((prev) => ({ ...prev, commentText: value }));
  }, []);

  const handleSaveWorkoutEdit = useCallback(async () => {
    if (!dayData || !workoutEditForm.entryId) {
      messageApi.error(messages.workoutEditSaveFailed);
      return;
    }

    const targetEntry = dayData.planEntries.find((entry) => entry.id === workoutEditForm.entryId);
    if (!targetEntry) {
      messageApi.error(messages.workoutEditNotFound);
      return;
    }

    const taskText = workoutEditForm.taskText.trim();
    if (!taskText) {
      messageApi.error(messages.workoutEditRequired);
      return;
    }

    const commentText = workoutEditForm.commentText.trim();
    const normalizedCommentText = commentText.length > 0 ? commentText : null;

    setSavingWorkoutEdit(true);
    try {
      const res = await fetch(`/api/plans/entries/${targetEntry.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskText,
          commentText: normalizedCommentText,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        updated?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.updated) {
        const errorCode = data?.error;
        if (res.status === 404 || errorCode === "not_found") {
          messageApi.error(messages.workoutEditNotFound);
        } else {
          messageApi.error(messages.workoutEditSaveFailed);
        }
        return;
      }

      messageApi.success(messages.workoutEditSaved);
      setWorkoutEditForm(EMPTY_WORKOUT_EDIT_FORM);
      await refreshDiaryAfterSave(selectedDate, panelDate);
    } catch (err) {
      console.error(err);
      messageApi.error(messages.workoutEditSaveFailed);
    } finally {
      setSavingWorkoutEdit(false);
    }
  }, [
    dayData,
    messageApi,
    messages,
    panelDate,
    refreshDiaryAfterSave,
    selectedDate,
    workoutEditForm,
  ]);

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
        await refreshDiaryAfterSave(selectedDate, panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.weightSaveFailed);
      } finally {
        setSavingWeight((prev) => ({ ...prev, [period]: false }));
      }
    },
    [messageApi, messages, panelDate, refreshDiaryAfterSave, selectedDate, weightForm]
  );

  const handleSaveWorkout = useCallback(
    async (planEntryId: number) => {
      const form = workoutForm[planEntryId];
      if (!form?.resultText?.trim()) {
        messageApi.error(messages.workoutRequired);
        return;
      }
      const startTime = form.startTime.trim();
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
      const shoeUsages: Array<{ shoeId: number; mileageKm: number | null }> = [];
      for (const shoeId of shoeIds) {
        const mileage = parseShoeMileageInput(form.shoeMileageKm?.[shoeId]);
        if (!mileage.valid) {
          messageApi.error(messages.workoutShoeMileageInvalid);
          return;
        }
        shoeUsages.push({ shoeId, mileageKm: mileage.value });
      }

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
            startTime: startTime.length > 0 ? startTime : null,
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
            shoeUsages,
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
        await refreshDiaryAfterSave(selectedDate, panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error(messages.workoutSaveFailed);
      } finally {
        setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: false }));
      }
    },
    [messageApi, messages, panelDate, refreshDiaryAfterSave, selectedDate, workoutForm]
  );

  const handleSaveRecovery = useCallback(async () => {
    const sleepTime = parseSleepTimeInput(recoveryForm.sleepHours);
    if (!sleepTime.valid) {
      messageApi.error(messages.recoveryInvalidSleep);
      return;
    }
    const additionalSleepTime = parseSleepTimeInput(recoveryForm.additionalSleepHours);
    if (!additionalSleepTime.valid) {
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
          recoveryOther: recoveryForm.recoveryOther.trim() || null,
          sleepHours: sleepTime.value,
          additionalSleepHours: additionalSleepTime.value,
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
      await refreshDiaryAfterSave(selectedDate, panelDate);
    } catch (err) {
      console.error(err);
      messageApi.error(messages.recoverySaveFailed);
    } finally {
      setSavingRecovery(false);
    }
  }, [messageApi, messages, panelDate, recoveryForm, refreshDiaryAfterSave, selectedDate]);

  return {
    selectedDate,
    panelDate,
    setPanelDate: updatePanelDate,
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
    shiftDate,
    openWorkoutEdit,
    closeWorkoutEdit,
    updateWorkoutEditTaskText,
    updateWorkoutEditCommentText,
    handleSaveWeight,
    handleSaveWorkout,
    handleSaveWorkoutEdit,
    handleSaveRecovery,
  };
}
