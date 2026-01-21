import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import { PLAN_DATE_FORMAT } from "../planConstants";
import { PLAN_TEXT } from "../planText";
import type { PlanDraft, PlanDraftEntry, PlanEntry } from "../planUtils";
import { createEmptyDraftEntry, sortPlanEntries } from "../planUtils";

type UsePlanEditorParams = {
  entries: PlanEntry[];
  setEntries: Dispatch<SetStateAction<PlanEntry[]>>;
  msgApi: MessageInstance;
  modalApi: ModalHookAPI;
};

export type PlanEditorState = {
  editorOpen: boolean;
  saving: boolean;
  draft: PlanDraft | null;
  draftDateValue: Dayjs | null;
};

export type PlanEditorHandlers = {
  openCreateModal: () => void;
  openEditModal: (date: string) => void;
  handleCancelEditor: () => void;
  handleDateChange: (value: Dayjs | null) => void;
  handleWorkloadChange: (value: boolean) => void;
  updateEntry: (index: number, patch: Partial<PlanDraftEntry>) => void;
  addEntry: () => void;
  confirmRemoveEntry: (index: number) => void;
  handleSaveDraft: () => void;
  handleDeleteDay: () => void;
};

export const usePlanEditor = ({
  entries,
  setEntries,
  msgApi,
  modalApi,
}: UsePlanEditorParams): PlanEditorState & PlanEditorHandlers => {
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const today = useMemo(() => dayjs().format(PLAN_DATE_FORMAT), []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setDraft(null);
  }, []);

  const openCreateModal = useCallback(() => {
    setDraft({
      date: today,
      isWorkload: false,
      entries: [createEmptyDraftEntry()],
    });
    setEditorOpen(true);
  }, [today]);

  const openEditModal = useCallback(
    (date: string) => {
      const dayEntries = entries
        .filter((entry) => entry.date === date)
        .sort((a, b) => a.sessionOrder - b.sessionOrder);
      if (!dayEntries.length) {
        return;
      }
      setDraft({
        date,
        originalDate: date,
        isWorkload: dayEntries.some((entry) => entry.isWorkload),
        entries: dayEntries.map((entry) => ({
          id: entry.id,
          taskText: entry.taskText,
          commentText: entry.commentText ?? "",
          hasReport: entry.hasReport,
        })),
      });
      setEditorOpen(true);
    },
    [entries]
  );

  const handleCancelEditor = useCallback(() => {
    if (saving) {
      return;
    }
    closeEditor();
  }, [closeEditor, saving]);

  const updateDraft = useCallback((updater: (prev: PlanDraft) => PlanDraft) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  const handleDateChange = useCallback(
    (value: Dayjs | null) => {
      if (!value) {
        return;
      }
      updateDraft((prev) => ({
        ...prev,
        date: value.format(PLAN_DATE_FORMAT),
      }));
    },
    [updateDraft]
  );

  const handleWorkloadChange = useCallback(
    (value: boolean) => {
      updateDraft((prev) => ({
        ...prev,
        isWorkload: value,
      }));
    },
    [updateDraft]
  );

  const updateEntry = useCallback(
    (index: number, patch: Partial<PlanDraftEntry>) => {
      updateDraft((prev) => {
        const nextEntries = [...prev.entries];
        nextEntries[index] = { ...nextEntries[index], ...patch };
        return { ...prev, entries: nextEntries };
      });
    },
    [updateDraft]
  );

  const addEntry = useCallback(() => {
    updateDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, createEmptyDraftEntry()],
    }));
  }, [updateDraft]);

  const removeEntry = useCallback(
    (index: number) => {
      updateDraft((prev) => {
        const nextEntries = prev.entries.filter((_, i) => i !== index);
        if (nextEntries.length === 0) {
          nextEntries.push(createEmptyDraftEntry());
        }
        return { ...prev, entries: nextEntries };
      });
    },
    [updateDraft]
  );

  const confirmRemoveEntry = useCallback(
    (index: number) => {
      if (!draft) {
        return;
      }
      const entry = draft.entries[index];
      modalApi.confirm({
        title: PLAN_TEXT.confirm.deleteWorkoutTitle,
        content: entry?.hasReport
          ? PLAN_TEXT.confirm.deleteWorkoutWithReport
          : PLAN_TEXT.confirm.deleteWorkoutSimple,
        okText: PLAN_TEXT.confirm.okDelete,
        okType: "danger",
        cancelText: PLAN_TEXT.confirm.cancel,
        onOk: () => removeEntry(index),
      });
    },
    [draft, modalApi, removeEntry]
  );

  const draftDateValue = useMemo(() => {
    if (!draft) {
      return null;
    }
    const parsed = dayjs(draft.date, PLAN_DATE_FORMAT, true);
    return parsed.isValid() ? parsed : null;
  }, [draft]);

  const handleSaveDraft = useCallback(async () => {
    if (!draft) {
      return;
    }
    const normalizedDate = draft.date.trim();
    if (!normalizedDate) {
      msgApi.error(PLAN_TEXT.messages.dateRequired);
      return;
    }

    if (
      entries.some((entry) => entry.date === normalizedDate && entry.date !== draft.originalDate)
    ) {
      msgApi.error(PLAN_TEXT.messages.dateExists);
      return;
    }

    const normalizedEntries = draft.entries.map((entry) => {
      const taskText = entry.taskText.trim();
      const commentText = entry.commentText.trim();
      return {
        id: entry.id,
        taskText,
        commentText: commentText.length ? commentText : null,
      };
    });

    if (normalizedEntries.length === 0 || normalizedEntries.some((entry) => !entry.taskText)) {
      msgApi.error(PLAN_TEXT.messages.fillWorkouts);
      return;
    }

    const payload: {
      date: string;
      originalDate?: string;
      isWorkload: boolean;
      entries: { id?: number; taskText: string; commentText: string | null }[];
    } = {
      date: normalizedDate,
      isWorkload: draft.isWorkload,
      entries: normalizedEntries.map((entry) => {
        const base = {
          taskText: entry.taskText,
          commentText: entry.commentText,
        };
        return entry.id ? { ...base, id: entry.id } : base;
      }),
    };

    if (draft.originalDate) {
      payload.originalDate = draft.originalDate;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as {
        entries?: PlanEntry[];
        error?: string;
      } | null;

      if (!res.ok || !data?.entries) {
        const errorCode = data?.error;
        if (res.status === 409 || errorCode === "date_exists") {
          msgApi.error(PLAN_TEXT.messages.dateExists);
        } else if (res.status === 404 || errorCode === "not_found") {
          msgApi.error(PLAN_TEXT.messages.dayNotFound);
        } else if (errorCode === "invalid_entry_id") {
          msgApi.error(PLAN_TEXT.messages.invalidWorkouts);
        } else if (errorCode === "empty_entries") {
          msgApi.error(PLAN_TEXT.messages.fillWorkouts);
        } else {
          msgApi.error(PLAN_TEXT.messages.saveFailed);
        }
        return;
      }

      const updatedEntries = data.entries;
      setEntries((prev) => {
        const removeDates = new Set<string>([normalizedDate]);
        if (draft.originalDate && draft.originalDate !== normalizedDate) {
          removeDates.add(draft.originalDate);
        }
        const filtered = prev.filter((entry) => !removeDates.has(entry.date));
        return sortPlanEntries([...filtered, ...updatedEntries]);
      });

      msgApi.success(PLAN_TEXT.messages.daySaved);
      closeEditor();
    } catch (err) {
      console.error(err);
      msgApi.error(PLAN_TEXT.messages.saveError);
    } finally {
      setSaving(false);
    }
  }, [closeEditor, draft, entries, msgApi, setEntries]);

  const handleDeleteDay = useCallback(() => {
    if (!draft?.originalDate || saving) {
      return;
    }
    const targetDate = draft.originalDate;
    const hasReports = draft.entries.some((entry) => entry.hasReport);
    modalApi.confirm({
      title: PLAN_TEXT.confirm.deleteDayTitle,
      content: hasReports
        ? PLAN_TEXT.confirm.deleteDayWithReports
        : PLAN_TEXT.confirm.deleteDaySimple,
      okText: PLAN_TEXT.confirm.okDelete,
      okType: "danger",
      cancelText: PLAN_TEXT.confirm.cancel,
      onOk: async () => {
        setSaving(true);
        try {
          const res = await fetch(`/api/plans?date=${encodeURIComponent(targetDate)}`, {
            method: "DELETE",
          });
          const data = (await res.json().catch(() => null)) as {
            deleted?: boolean;
            error?: string;
          } | null;
          if (!res.ok || !data?.deleted) {
            const errorCode = data?.error;
            if (res.status === 404 || errorCode === "not_found") {
              msgApi.error(PLAN_TEXT.messages.dayNotFound);
            } else {
              msgApi.error(PLAN_TEXT.messages.deleteFailed);
            }
            return;
          }
          setEntries((prev) => prev.filter((entry) => entry.date !== targetDate));
          msgApi.success(PLAN_TEXT.messages.dayDeleted);
          closeEditor();
        } catch (err) {
          console.error(err);
          msgApi.error(PLAN_TEXT.messages.deleteError);
        } finally {
          setSaving(false);
        }
      },
    });
  }, [closeEditor, draft, modalApi, msgApi, saving, setEntries]);

  return {
    editorOpen,
    saving,
    draft,
    draftDateValue,
    openCreateModal,
    openEditModal,
    handleCancelEditor,
    handleDateChange,
    handleWorkloadChange,
    updateEntry,
    addEntry,
    confirmRemoveEntry,
    handleSaveDraft,
    handleDeleteDay,
  };
};
