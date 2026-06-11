import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { MessageInstance } from "antd/es/message/interface";
import {
  PLAN_DATE_FORMAT,
  PLAN_SHIFT_DEFAULT_DAYS,
  PLAN_SHIFT_MAX_DAYS,
} from "../constants/planConstants";
import { PLAN_TEXT } from "../constants/planText";
import type { PlanShiftDirection, PlanShiftDraft } from "../types/planTypes";

type UsePlanShiftParams = {
  msgApi: MessageInstance;
  loadEntries: () => Promise<void>;
};

type PlanShiftApiResponse = {
  shifted?: true;
  shiftedDaysCount?: number;
  error?: string;
};

export type PlanShiftState = {
  shiftOpen: boolean;
  shiftSaving: boolean;
  shiftDraft: PlanShiftDraft | null;
  shiftDateValue: Dayjs | null;
};

export type PlanShiftHandlers = {
  openShiftModal: (fromDate: string) => void;
  handleCancelShift: () => void;
  handleShiftDateChange: (value: Dayjs | null) => void;
  handleShiftDirectionChange: (value: PlanShiftDirection) => void;
  handleShiftDaysChange: (value: number | null) => void;
  handleSaveShift: () => Promise<void>;
};

const getOffsetDays = (draft: PlanShiftDraft) => {
  const multiplier = draft.direction === "forward" ? 1 : -1;
  return draft.days * multiplier;
};

export const usePlanShift = ({
  msgApi,
  loadEntries,
}: UsePlanShiftParams): PlanShiftState & PlanShiftHandlers => {
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftDraft, setShiftDraft] = useState<PlanShiftDraft | null>(null);

  const closeShift = useCallback(() => {
    setShiftOpen(false);
    setShiftDraft(null);
  }, []);

  const openShiftModal = useCallback((fromDate: string) => {
    setShiftDraft({
      fromDate,
      direction: "forward",
      days: PLAN_SHIFT_DEFAULT_DAYS,
    });
    setShiftOpen(true);
  }, []);

  const handleCancelShift = useCallback(() => {
    if (shiftSaving) {
      return;
    }

    closeShift();
  }, [closeShift, shiftSaving]);

  const updateShiftDraft = useCallback((updater: (prev: PlanShiftDraft) => PlanShiftDraft) => {
    setShiftDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  const handleShiftDateChange = useCallback(
    (value: Dayjs | null) => {
      if (!value) {
        return;
      }

      updateShiftDraft((prev) => ({
        ...prev,
        fromDate: value.format(PLAN_DATE_FORMAT),
      }));
    },
    [updateShiftDraft]
  );

  const handleShiftDirectionChange = useCallback(
    (value: PlanShiftDirection) => {
      updateShiftDraft((prev) => ({
        ...prev,
        direction: value,
      }));
    },
    [updateShiftDraft]
  );

  const handleShiftDaysChange = useCallback(
    (value: number | null) => {
      updateShiftDraft((prev) => ({
        ...prev,
        days: value ?? PLAN_SHIFT_DEFAULT_DAYS,
      }));
    },
    [updateShiftDraft]
  );

  const shiftDateValue = useMemo(() => {
    if (!shiftDraft) {
      return null;
    }

    const parsed = dayjs(shiftDraft.fromDate, PLAN_DATE_FORMAT, true);
    return parsed.isValid() ? parsed : null;
  }, [shiftDraft]);

  const handleSaveShift = useCallback(async () => {
    if (!shiftDraft) {
      return;
    }

    if (
      !Number.isInteger(shiftDraft.days) ||
      shiftDraft.days < 1 ||
      shiftDraft.days > PLAN_SHIFT_MAX_DAYS
    ) {
      msgApi.error(PLAN_TEXT.messages.shiftInvalid);
      return;
    }

    setShiftSaving(true);
    try {
      const res = await fetch("/api/plans/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: shiftDraft.fromDate,
          offsetDays: getOffsetDays(shiftDraft),
        }),
      });
      const data = (await res.json().catch(() => null)) as PlanShiftApiResponse | null;

      if (!res.ok || !data?.shifted) {
        const errorCode = data?.error;
        if (errorCode === "date_locked_by_report") {
          msgApi.error(PLAN_TEXT.messages.shiftHasReports);
        } else if (errorCode === "target_date_exists") {
          msgApi.error(PLAN_TEXT.messages.shiftTargetExists);
        } else if (res.status === 404 || errorCode === "not_found") {
          msgApi.error(PLAN_TEXT.messages.shiftNotFound);
        } else if (errorCode === "invalid_shift") {
          msgApi.error(PLAN_TEXT.messages.shiftInvalid);
        } else if (res.status >= 500 || errorCode === "server_error") {
          msgApi.error(PLAN_TEXT.messages.shiftServerError);
        } else {
          msgApi.error(PLAN_TEXT.messages.shiftFailed);
        }
        return;
      }

      msgApi.success(PLAN_TEXT.messages.shiftSuccess(data.shiftedDaysCount ?? 0));
      closeShift();
      await loadEntries();
    } catch (error) {
      console.error(error);
      msgApi.error(PLAN_TEXT.messages.shiftError);
    } finally {
      setShiftSaving(false);
    }
  }, [closeShift, loadEntries, msgApi, shiftDraft]);

  return {
    shiftOpen,
    shiftSaving,
    shiftDraft,
    shiftDateValue,
    openShiftModal,
    handleCancelShift,
    handleShiftDateChange,
    handleShiftDirectionChange,
    handleShiftDaysChange,
    handleSaveShift,
  };
};
