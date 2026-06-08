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
  setOnlyWithoutReports: (value: boolean) => void;
  today: string;
  loadEntries: () => Promise<void>;
};

const getTodayPage = (items: PlanDayEntry[], today: string) => {
  const todayIndex = items.findIndex((entry) => entry.date === today);
  return todayIndex < 0 ? 1 : Math.floor(todayIndex / PLAN_PAGE_SIZE) + 1;
};

export const usePlanEntries = ({ msgApi }: UsePlanEntriesParams): UsePlanEntriesResult => {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

      const nextGroupedEntries = buildPlanDays(data.entries);
      setEntries(data.entries);
      setCurrentPage(onlyWithoutReports ? 1 : getTodayPage(nextGroupedEntries, today));
    } catch (error) {
      console.error(error);
      msgApi.error(PLAN_TEXT.messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [msgApi, onlyWithoutReports, today]);

  useEffect(() => {
    let active = true;
    fetch("/api/plans")
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as PlansApiResponse | null;
        if (!active) {
          return;
        }
        if (!response.ok || !data?.entries) {
          msgApi.error(data?.error ?? PLAN_TEXT.messages.loadFailed);
          return;
        }
        const nextGroupedEntries = buildPlanDays(data.entries);
        setEntries(data.entries);
        setCurrentPage(getTodayPage(nextGroupedEntries, today));
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
        msgApi.error(PLAN_TEXT.messages.loadError);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [msgApi, today]);

  const handleOnlyWithoutReportsChange = useCallback(
    (value: boolean) => {
      scrolledToTodayRef.current = false;
      setOnlyWithoutReports(value);
      setCurrentPage(value ? 1 : getTodayPage(groupedEntries, today));
    },
    [groupedEntries, today]
  );

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
    setOnlyWithoutReports: handleOnlyWithoutReportsChange,
    today,
    loadEntries,
  };
};
