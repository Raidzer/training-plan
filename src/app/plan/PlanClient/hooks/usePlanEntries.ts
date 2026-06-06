import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import dayjs from "dayjs";
import { PLAN_DATE_FORMAT, PLAN_PAGE_SIZE } from "../constants/planConstants";
import { PLAN_TEXT } from "../constants/planText";
import type { PlanDayEntry, PlanEntry } from "../types/planTypes";
import { buildPlanDays } from "../utils/planUtils";

type UsePlanEntriesParams = {
  msgApi: MessageInstance;
};

type PlansApiResponse = {
  entries?: PlanEntry[];
  error?: string;
};

type UsePlanEntriesResult = {
  entries: PlanEntry[];
  setEntries: Dispatch<SetStateAction<PlanEntry[]>>;
  filteredEntries: PlanDayEntry[];
  loading: boolean;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  onlyWithoutReports: boolean;
  setOnlyWithoutReports: Dispatch<SetStateAction<boolean>>;
  today: string;
  loadEntries: () => Promise<void>;
};

export const usePlanEntries = ({ msgApi }: UsePlanEntriesParams): UsePlanEntriesResult => {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyWithoutReports, setOnlyWithoutReports] = useState(false);
  const scrolledToTodayRef = useRef(false);
  const today = useMemo(() => dayjs().format(PLAN_DATE_FORMAT), []);

  const groupedEntries = useMemo(() => buildPlanDays(entries), [entries]);
  const filteredEntries = useMemo(() => {
    if (onlyWithoutReports) {
      return groupedEntries.filter((entry) => !entry.hasReport);
    }

    return groupedEntries;
  }, [groupedEntries, onlyWithoutReports]);

  const todayEntryId = useMemo(
    () => filteredEntries.find((entry) => entry.date === today)?.date ?? null,
    [filteredEntries, today]
  );

  const loadEntries = useCallback(async () => {
    scrolledToTodayRef.current = false;
    setLoading(true);
    try {
      const response = await fetch("/api/plans");
      const data = (await response.json().catch(() => null)) as PlansApiResponse | null;

      if (!response.ok || !data?.entries) {
        msgApi.error(data?.error ?? PLAN_TEXT.messages.loadFailed);
        return;
      }

      setEntries(data.entries);
    } catch (error) {
      console.error(error);
      msgApi.error(PLAN_TEXT.messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [msgApi]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    scrolledToTodayRef.current = false;

    if (onlyWithoutReports) {
      setCurrentPage((prev) => {
        if (prev === 1) {
          return prev;
        }

        return 1;
      });
      return;
    }

    const todayIndex = filteredEntries.findIndex((entry) => entry.date === today);
    const nextPage = todayIndex < 0 ? 1 : Math.floor(todayIndex / PLAN_PAGE_SIZE) + 1;
    setCurrentPage((prev) => {
      if (prev === nextPage) {
        return prev;
      }

      return nextPage;
    });
  }, [filteredEntries, onlyWithoutReports, today]);

  useEffect(() => {
    if (!todayEntryId || scrolledToTodayRef.current) {
      return;
    }

    const entryTargets = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-plan-entry-key="${todayEntryId}"]`)
    );
    const visibleTarget =
      entryTargets.find((target) => target.getClientRects().length > 0) ?? entryTargets[0];

    if (!visibleTarget) {
      return;
    }

    visibleTarget.scrollIntoView({ block: "center", behavior: "smooth" });
    scrolledToTodayRef.current = true;
  }, [todayEntryId, currentPage]);

  return {
    entries,
    setEntries,
    filteredEntries,
    loading,
    currentPage,
    setCurrentPage,
    onlyWithoutReports,
    setOnlyWithoutReports,
    today,
    loadEntries,
  };
};
