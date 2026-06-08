"use client";

import { message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { DIARY_PERIOD_LABELS, INITIAL_PERIOD_TOTALS } from "../constants/periodConstants";
import type {
  DayStatus,
  DiaryPeriodApiResponse,
  PeriodExportErrorResponse,
  PeriodRange,
  PeriodTotals,
} from "../types/periodTypes";
import {
  createPeriodExportFilename,
  createPeriodRange,
  downloadBlob,
  formatPeriodApiDate,
  getFilenameFromContentDisposition,
} from "../utils/periodUtils";

export const useDiaryPeriod = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [range, setRange] = useState<PeriodRange>(() => createPeriodRange(14));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [days, setDays] = useState<DayStatus[]>([]);
  const [totals, setTotals] = useState<PeriodTotals>(INITIAL_PERIOD_TOTALS);

  useEffect(() => {
    let active = true;
    const from = formatPeriodApiDate(range[0]);
    const to = formatPeriodApiDate(range[1]);

    fetch(`/api/diary/period?from=${from}&to=${to}`)
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as DiaryPeriodApiResponse | null;

        if (!active) {
          return;
        }
        if (!response.ok || !data?.days || !data?.totals) {
          messageApi.error(data?.error ?? DIARY_PERIOD_LABELS.loadFail);
          return;
        }

        setDays(data.days);
        setTotals(data.totals);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
        messageApi.error(DIARY_PERIOD_LABELS.loadFail);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi, range]);

  const handleRangeChange = (nextRange: PeriodRange) => {
    setLoading(true);
    setRange(nextRange);
  };

  const handlePresetRange = (daysCount: number) => {
    setLoading(true);
    setRange(createPeriodRange(daysCount));
  };

  const handleExport = useCallback(async () => {
    const from = formatPeriodApiDate(range[0]);
    const to = formatPeriodApiDate(range[1]);
    setExporting(true);

    try {
      const response = await fetch(`/api/diary/period-export?from=${from}&to=${to}`);

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as PeriodExportErrorResponse | null;
        messageApi.error(data?.error ?? DIARY_PERIOD_LABELS.exportFail);
        return;
      }

      const blob = await response.blob();
      const filename =
        getFilenameFromContentDisposition(response.headers.get("content-disposition")) ??
        createPeriodExportFilename(from, to);
      downloadBlob(blob, filename);
    } catch (error) {
      console.error(error);
      messageApi.error(DIARY_PERIOD_LABELS.exportFail);
    } finally {
      setExporting(false);
    }
  }, [messageApi, range]);

  return {
    contextHolder,
    range,
    loading,
    exporting,
    days,
    totals,
    handleRangeChange,
    handlePresetRange,
    handleExport,
  };
};
