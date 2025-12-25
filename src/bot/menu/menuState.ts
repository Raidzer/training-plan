export type PendingInput =
  | "date"
  | "dateMenu"
  | "time"
  | "timezone"
  | "link"
  | "weightDateMenu"
  | "weightDate"
  | "weightPeriod"
  | "weightValue";

const pendingInputs = new Map<number, PendingInput>();
const weightDrafts = new Map<
  number,
  { date: string | null; period: "morning" | "evening" | null }
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
