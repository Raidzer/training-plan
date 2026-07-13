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
  createFullDiaryExportFilename,
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
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [days, setDays] = useState<DayStatus[]>([]);
  const [totals, setTotals] = useState<PeriodTotals>(INITIAL_PERIOD_TOTALS);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    const from = formatPeriodApiDate(range[0]);
    const to = formatPeriodApiDate(range[1]);

    const loadPeriod = async () => {
      try {
        const response = await fetch(`/api/diary/period?from=${from}&to=${to}`, {
          signal: abortController.signal,
        });
        const data = (await response.json().catch(() => null)) as DiaryPeriodApiResponse | null;

        if (abortController.signal.aborted) {
          return;
        }
        if (!response.ok || !data?.days || !data?.totals) {
          const errorMessage = data?.error ?? DIARY_PERIOD_LABELS.loadFail;
          setDays([]);
          setTotals(INITIAL_PERIOD_TOTALS);
          setError(errorMessage);
          messageApi.error(errorMessage);
          return;
        }

        setDays(data.days);
        setTotals(data.totals);
        setError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error(error);
        setDays([]);
        setTotals(INITIAL_PERIOD_TOTALS);
        setError(DIARY_PERIOD_LABELS.loadFail);
        messageApi.error(DIARY_PERIOD_LABELS.loadFail);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPeriod();

    return () => {
      abortController.abort();
    };
  }, [messageApi, range, reloadKey]);

  const handleRangeChange = (nextRange: PeriodRange) => {
    setLoading(true);
    setError(null);
    setRange(nextRange);
  };

  const handlePresetRange = (daysCount: number) => {
    setLoading(true);
    setError(null);
    setRange(createPeriodRange(daysCount));
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const downloadExport = useCallback(
    async (params: {
      url: string;
      fallbackFilename: string;
      setExportingState: (exporting: boolean) => void;
    }) => {
      params.setExportingState(true);

      try {
        const response = await fetch(params.url);

        if (!response.ok) {
          const data = (await response
            .json()
            .catch(() => null)) as PeriodExportErrorResponse | null;
          messageApi.error(data?.error ?? DIARY_PERIOD_LABELS.exportFail);
          return;
        }

        const blob = await response.blob();
        const filename =
          getFilenameFromContentDisposition(response.headers.get("content-disposition")) ??
          params.fallbackFilename;
        downloadBlob(blob, filename);
      } catch (error) {
        console.error(error);
        messageApi.error(DIARY_PERIOD_LABELS.exportFail);
      } finally {
        params.setExportingState(false);
      }
    },
    [messageApi]
  );

  const handleExport = useCallback(async () => {
    const from = formatPeriodApiDate(range[0]);
    const to = formatPeriodApiDate(range[1]);

    await downloadExport({
      url: `/api/diary/period-export?from=${from}&to=${to}`,
      fallbackFilename: createPeriodExportFilename(from, to),
      setExportingState: setExporting,
    });
  }, [downloadExport, range]);

  const handleExportAll = useCallback(async () => {
    await downloadExport({
      url: "/api/diary/period-export?scope=all",
      fallbackFilename: createFullDiaryExportFilename(),
      setExportingState: setExportingAll,
    });
  }, [downloadExport]);

  return {
    contextHolder,
    range,
    loading,
    error,
    exporting,
    exportingAll,
    days,
    totals,
    handleRangeChange,
    handlePresetRange,
    handleExport,
    handleExportAll,
    handleRetry,
  };
};
