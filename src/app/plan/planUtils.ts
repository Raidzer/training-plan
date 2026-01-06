export type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
  isWorkload: boolean;
  hasReport: boolean;
};

export type PlanDayEntry = {
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  hasReport: boolean;
};

export type PlanDraftEntry = {
  id?: number;
  taskText: string;
  commentText: string;
  hasReport: boolean;
};

export type PlanDraft = {
  date: string;
  originalDate?: string;
  isWorkload: boolean;
  entries: PlanDraftEntry[];
};

export const createEmptyDraftEntry = (): PlanDraftEntry => ({
  taskText: "",
  commentText: "",
  hasReport: false,
});

export const formatNumberedLines = (
  values: Array<string | null | undefined>,
  options?: { emptyValue?: string; includeIfAllEmpty?: boolean }
) => {
  const emptyValue = options?.emptyValue ?? "-";
  if (!values.length) {
    return options?.includeIfAllEmpty ? emptyValue : "";
  }
  const normalized = values.map((value) => {
    if (value === null || value === undefined) {
      return emptyValue;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : emptyValue;
  });
  const hasNonEmpty = normalized.some((value) => value !== emptyValue);
  if (!hasNonEmpty && !options?.includeIfAllEmpty) {
    return "";
  }
  if (normalized.length === 1) {
    return normalized[0];
  }
  return normalized.map((value, index) => `${index + 1}) ${value}`).join("\n");
};

export const buildPlanDays = (entries: PlanEntry[]): PlanDayEntry[] => {
  const grouped = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const existing = grouped.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.date, [entry]);
    }
  }

  const rows: PlanDayEntry[] = [];
  for (const [date, dayEntries] of grouped) {
    const sorted = [...dayEntries].sort(
      (a, b) => a.sessionOrder - b.sessionOrder
    );
    const tasks = sorted.map((entry) => entry.taskText);
    const comments = sorted.map((entry) => entry.commentText ?? "");
    const commentText = formatNumberedLines(comments, {
      includeIfAllEmpty: false,
    });
    rows.push({
      date,
      taskText: formatNumberedLines(tasks, { includeIfAllEmpty: true }),
      commentText: commentText.length ? commentText : null,
      isWorkload: sorted.some((entry) => entry.isWorkload),
      hasReport: sorted.every((entry) => entry.hasReport),
    });
  }
  return rows;
};

export const sortPlanEntries = (items: PlanEntry[]) =>
  [...items].sort((a, b) => {
    if (a.date === b.date) {
      return a.sessionOrder - b.sessionOrder;
    }
    return b.date.localeCompare(a.date);
  });
