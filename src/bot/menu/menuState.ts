export type PendingInput =
  | "date"
  | "dateMenu"
  | "time"
  | "timezone"
  | "link"
  | "weightDateMenu"
  | "weightDate"
  | "weightAction"
  | "weightPeriod"
  | "weightValue"
  | "workoutSelect"
  | "workoutStartTime"
  | "workoutResult"
  | "workoutComment"
  | "workoutEditSelect"
  | "workoutEditTime"
  | "workoutEditResult"
  | "workoutEditComment";

const pendingInputs = new Map<number, PendingInput>();
const weightDrafts = new Map<
  number,
  { date: string | null; period: "morning" | "evening" | null }
>();
const workoutDrafts = new Map<
  number,
  {
    date: string | null;
    planEntryId: number | null;
    startTime: string | null;
    resultText: string | null;
  }
>();

export const setPendingInput = (chatId: number, input: PendingInput) => {
  pendingInputs.set(chatId, input);
};

export const getPendingInput = (chatId: number) => {
  return pendingInputs.get(chatId) ?? null;
};

export const clearPendingInput = (chatId: number) => {
  pendingInputs.delete(chatId);
};

export const setWeightDraft = (
  chatId: number,
  draft: { date?: string | null; period?: "morning" | "evening" | null }
) => {
  const current = weightDrafts.get(chatId) ?? { date: null, period: null };
  weightDrafts.set(chatId, {
    date: draft.date ?? current.date,
    period: draft.period ?? current.period,
  });
};

export const getWeightDraft = (chatId: number) => {
  return weightDrafts.get(chatId) ?? { date: null, period: null };
};

export const clearWeightDraft = (chatId: number) => {
  weightDrafts.delete(chatId);
};

export const setWorkoutDraft = (
  chatId: number,
  draft: {
    date?: string | null;
    planEntryId?: number | null;
    startTime?: string | null;
    resultText?: string | null;
  }
) => {
  const current = workoutDrafts.get(chatId) ?? {
    date: null,
    planEntryId: null,
    startTime: null,
    resultText: null,
  };
  workoutDrafts.set(chatId, {
    date: draft.date ?? current.date,
    planEntryId: draft.planEntryId ?? current.planEntryId,
    startTime: draft.startTime ?? current.startTime,
    resultText: draft.resultText ?? current.resultText,
  });
};

export const getWorkoutDraft = (chatId: number) => {
  return (
    workoutDrafts.get(chatId) ?? {
      date: null,
      planEntryId: null,
      startTime: null,
      resultText: null,
    }
  );
};

export const clearWorkoutDraft = (chatId: number) => {
  workoutDrafts.delete(chatId);
};
