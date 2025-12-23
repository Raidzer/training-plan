export type PendingInput = "date" | "dateMenu" | "time" | "timezone" | "link";

const pendingInputs = new Map<number, PendingInput>();

export const setPendingInput = (chatId: number, input: PendingInput) => {
  pendingInputs.set(chatId, input);
};

export const getPendingInput = (chatId: number) => {
  return pendingInputs.get(chatId) ?? null;
};

export const clearPendingInput = (chatId: number) => {
  pendingInputs.delete(chatId);
};
