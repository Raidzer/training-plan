import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { LastEdited, SavedResult, SplitItem } from "./pace-calculator.types";
import {
  STORAGE_KEY,
  formatTime,
  getCeilSeconds,
  getDistanceLabel,
  safeParseSaved,
  toNonNegativeInt,
} from "./pace-calculator.utils";

type UsePaceCalculatorReturn = {
  distance: number;
  resultHours: number;
  resultMinutes: number;
  resultSeconds: number;
  paceMinutes: number;
  paceSeconds: number;
  lapMinutes: number;
  lapSeconds: number;
  splits: SplitItem[];
  splitGroups: SplitItem[][];
  savedResults: SavedResult[];
  canSave: boolean;
  handleDistanceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDistancePreset: (value: number) => void;
  handleResultHoursChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleResultMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleResultSecondsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceSecondsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleLapMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleLapSecondsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSaveResult: () => void;
  handleDeleteResult: (id: string) => void;
  formatSplitTime: (seconds: number) => string;
  getSavedDistanceLabel: (meters: number) => string;
};

export const usePaceCalculator = (): UsePaceCalculatorReturn => {
  const [distance, setDistance] = useState(10000);
  const [resultHours, setResultHours] = useState(0);
  const [resultMinutes, setResultMinutes] = useState(37);
  const [resultSeconds, setResultSeconds] = useState(30);
  const [paceMinutes, setPaceMinutes] = useState(3);
  const [paceSeconds, setPaceSeconds] = useState(45);
  const [lapMinutes, setLapMinutes] = useState(1);
  const [lapSeconds, setLapSeconds] = useState(30);
  const [lastEdited, setLastEdited] = useState<LastEdited>("result");
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);

  useEffect(() => {
    const stored = safeParseSaved(localStorage.getItem(STORAGE_KEY));
    setSavedResults(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResults));
  }, [savedResults]);

  const resultTotalSeconds =
    resultHours * 3600 + resultMinutes * 60 + resultSeconds;
  const paceTotalSeconds = paceMinutes * 60 + paceSeconds;
  const lapTotalSeconds = lapMinutes * 60 + lapSeconds;

  const setResultFromSeconds = (totalSeconds: number) => {
    const safeSeconds = getCeilSeconds(totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    if (resultHours !== hours) {
      setResultHours(hours);
    }
    if (resultMinutes !== minutes) {
      setResultMinutes(minutes);
    }
    if (resultSeconds !== seconds) {
      setResultSeconds(seconds);
    }
  };

  const setPaceFromSeconds = (totalSeconds: number) => {
    const safeSeconds = getCeilSeconds(totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    if (paceMinutes !== minutes) {
      setPaceMinutes(minutes);
    }
    if (paceSeconds !== seconds) {
      setPaceSeconds(seconds);
    }
  };

  const setLapFromSeconds = (totalSeconds: number) => {
    const safeSeconds = getCeilSeconds(totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    if (lapMinutes !== minutes) {
      setLapMinutes(minutes);
    }
    if (lapSeconds !== seconds) {
      setLapSeconds(seconds);
    }
  };

  const syncFromResult = (nextResultSeconds: number, nextDistance: number) => {
    if (nextDistance <= 0 || nextResultSeconds <= 0) {
      setPaceFromSeconds(0);
      setLapFromSeconds(0);
      return;
    }
    const distanceKm = nextDistance / 1000;
    const paceSecondsValue = Math.ceil(nextResultSeconds / distanceKm);
    const lapSecondsValue = Math.ceil(paceSecondsValue * 0.4);
    setPaceFromSeconds(paceSecondsValue);
    setLapFromSeconds(lapSecondsValue);
  };

  const syncFromPace = (nextPaceSeconds: number, nextDistance: number) => {
    if (nextPaceSeconds <= 0) {
      setLapFromSeconds(0);
      setResultFromSeconds(0);
      return;
    }
    const lapSecondsValue = Math.ceil(nextPaceSeconds * 0.4);
    setLapFromSeconds(lapSecondsValue);
    if (nextDistance <= 0) {
      setResultFromSeconds(0);
      return;
    }
    const distanceKm = nextDistance / 1000;
    const totalSeconds = Math.ceil(nextPaceSeconds * distanceKm);
    setResultFromSeconds(totalSeconds);
  };

  const syncFromLap = (nextLapSeconds: number, nextDistance: number) => {
    if (nextLapSeconds <= 0) {
      setPaceFromSeconds(0);
      setResultFromSeconds(0);
      return;
    }
    const paceSecondsValue = Math.ceil(nextLapSeconds * 2.5);
    setPaceFromSeconds(paceSecondsValue);
    if (nextDistance <= 0) {
      setResultFromSeconds(0);
      return;
    }
    const distanceKm = nextDistance / 1000;
    const totalSeconds = Math.ceil(paceSecondsValue * distanceKm);
    setResultFromSeconds(totalSeconds);
  };

  const updateDistance = (nextDistance: number) => {
    setDistance(nextDistance);
    if (lastEdited === "pace") {
      syncFromPace(paceTotalSeconds, nextDistance);
      return;
    }
    if (lastEdited === "lap") {
      syncFromLap(lapTotalSeconds, nextDistance);
      return;
    }
    syncFromResult(resultTotalSeconds, nextDistance);
  };

  const handleDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    updateDistance(nextValue);
  };

  const handleDistancePreset = (value: number) => {
    updateDistance(value);
  };

  const handleResultHoursChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setResultHours(nextValue);
    setLastEdited("result");
    const nextTotalSeconds =
      nextValue * 3600 + resultMinutes * 60 + resultSeconds;
    syncFromResult(nextTotalSeconds, distance);
  };

  const handleResultMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setResultMinutes(nextValue);
    setLastEdited("result");
    const nextTotalSeconds =
      resultHours * 3600 + nextValue * 60 + resultSeconds;
    syncFromResult(nextTotalSeconds, distance);
  };

  const handleResultSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setResultSeconds(nextValue);
    setLastEdited("result");
    const nextTotalSeconds =
      resultHours * 3600 + resultMinutes * 60 + nextValue;
    syncFromResult(nextTotalSeconds, distance);
  };

  const handlePaceMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setPaceMinutes(nextValue);
    setLastEdited("pace");
    const nextTotalSeconds = nextValue * 60 + paceSeconds;
    syncFromPace(nextTotalSeconds, distance);
  };

  const handlePaceSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setPaceSeconds(nextValue);
    setLastEdited("pace");
    const nextTotalSeconds = paceMinutes * 60 + nextValue;
    syncFromPace(nextTotalSeconds, distance);
  };

  const handleLapMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setLapMinutes(nextValue);
    setLastEdited("lap");
    const nextTotalSeconds = nextValue * 60 + lapSeconds;
    syncFromLap(nextTotalSeconds, distance);
  };

  const handleLapSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeInt(event.target.value);
    setLapSeconds(nextValue);
    setLastEdited("lap");
    const nextTotalSeconds = lapMinutes * 60 + nextValue;
    syncFromLap(nextTotalSeconds, distance);
  };

  const handleSaveResult = () => {
    if (!canSave) {
      return;
    }
    const now = new Date();
    const nextItem: SavedResult = {
      id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      distanceMeters: distance,
      resultSeconds: resultTotalSeconds,
      paceSeconds: paceTotalSeconds,
      lapSeconds: lapTotalSeconds,
      createdAt: now.toISOString(),
    };
    setSavedResults((prev) => [nextItem, ...prev]);
  };

  const handleDeleteResult = (id: string) => {
    setSavedResults((prev) => prev.filter((item) => item.id !== id));
  };

  const splits = useMemo(() => {
    const items: SplitItem[] = [];
    if (distance <= 0) {
      return items;
    }
    if (paceTotalSeconds <= 0) {
      return items;
    }
    const segmentMeters = 1000;
    const segmentCount = Math.ceil(distance / segmentMeters);
    if (segmentCount <= 0) {
      return items;
    }
    const secondsPerMeter = paceTotalSeconds / 1000;
    for (let index = 1; index <= segmentCount; index += 1) {
      const endMeters = Math.min(distance, segmentMeters * index);
      const label = `${endMeters / 1000} км`;
      const seconds = Math.ceil(secondsPerMeter * endMeters);
      items.push({ label, time: formatTime(seconds) });
    }
    return items;
  }, [distance, paceTotalSeconds]);

  const splitGroups = useMemo(() => {
    const mid = Math.ceil(splits.length / 2);
    const groups = [splits.slice(0, mid), splits.slice(mid)];
    return groups.filter((group) => group.length > 0);
  }, [splits]);

  const canSave = distance > 0 && resultTotalSeconds > 0 && paceTotalSeconds > 0;

  return {
    distance,
    resultHours,
    resultMinutes,
    resultSeconds,
    paceMinutes,
    paceSeconds,
    lapMinutes,
    lapSeconds,
    splits,
    splitGroups,
    savedResults,
    canSave,
    handleDistanceChange,
    handleDistancePreset,
    handleResultHoursChange,
    handleResultMinutesChange,
    handleResultSecondsChange,
    handlePaceMinutesChange,
    handlePaceSecondsChange,
    handleLapMinutesChange,
    handleLapSecondsChange,
    handleSaveResult,
    handleDeleteResult,
    formatSplitTime: formatTime,
    getSavedDistanceLabel: getDistanceLabel,
  };
};
