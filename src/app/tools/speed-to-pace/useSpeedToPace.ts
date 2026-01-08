import { useState, type ChangeEvent } from "react";
import {
  KM_PER_MILE,
  roundTo,
  splitMinutesSeconds,
  toNonNegativeFloat,
  toNonNegativeInt,
  toTotalMinutes,
} from "./speed-to-pace.utils";

type SpeedToPaceValues = {
  speedKmh: number;
  speedMps: number;
  speedMph: number;
  paceKmMinutes: number;
  paceKmSeconds: number;
  paceMileMinutes: number;
  paceMileSeconds: number;
};

type UseSpeedToPaceReturn = SpeedToPaceValues & {
  handleSpeedKmhChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSpeedMpsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSpeedMphChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceKmMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceKmSecondsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceMileMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceMileSecondsChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const DEFAULT_KMH = 10;

const ZERO_VALUES: SpeedToPaceValues = {
  speedKmh: 0,
  speedMps: 0,
  speedMph: 0,
  paceKmMinutes: 0,
  paceKmSeconds: 0,
  paceMileMinutes: 0,
  paceMileSeconds: 0,
};

const roundSpeed = (value: number) => {
  const rounded = roundTo(value, 2);
  if (rounded <= 0) {
    return 0;
  }
  return rounded;
};

const buildStateFromKmH = (kmh: number): SpeedToPaceValues => {
  if (!Number.isFinite(kmh)) {
    return ZERO_VALUES;
  }
  if (kmh <= 0) {
    return ZERO_VALUES;
  }
  const speedMps = kmh / 3.6;
  const speedMph = kmh / KM_PER_MILE;
  const paceKm = splitMinutesSeconds(60 / kmh);
  const paceMile = splitMinutesSeconds(60 / speedMph);
  return {
    speedKmh: roundSpeed(kmh),
    speedMps: roundSpeed(speedMps),
    speedMph: roundSpeed(speedMph),
    paceKmMinutes: paceKm.minutes,
    paceKmSeconds: paceKm.seconds,
    paceMileMinutes: paceMile.minutes,
    paceMileSeconds: paceMile.seconds,
  };
};

const buildStateFromMps = (mps: number): SpeedToPaceValues => {
  if (!Number.isFinite(mps)) {
    return ZERO_VALUES;
  }
  if (mps <= 0) {
    return ZERO_VALUES;
  }
  return buildStateFromKmH(mps * 3.6);
};

const buildStateFromMph = (mph: number): SpeedToPaceValues => {
  if (!Number.isFinite(mph)) {
    return ZERO_VALUES;
  }
  if (mph <= 0) {
    return ZERO_VALUES;
  }
  return buildStateFromKmH(mph * KM_PER_MILE);
};

const buildStateFromPaceKm = (totalMinutes: number): SpeedToPaceValues => {
  if (!Number.isFinite(totalMinutes)) {
    return ZERO_VALUES;
  }
  if (totalMinutes <= 0) {
    return ZERO_VALUES;
  }
  const speedKmh = 60 / totalMinutes;
  const base = buildStateFromKmH(speedKmh);
  const paceKm = splitMinutesSeconds(totalMinutes);
  return {
    ...base,
    paceKmMinutes: paceKm.minutes,
    paceKmSeconds: paceKm.seconds,
  };
};

const buildStateFromPaceMile = (totalMinutes: number): SpeedToPaceValues => {
  if (!Number.isFinite(totalMinutes)) {
    return ZERO_VALUES;
  }
  if (totalMinutes <= 0) {
    return ZERO_VALUES;
  }
  const speedMph = 60 / totalMinutes;
  const speedKmh = speedMph * KM_PER_MILE;
  const base = buildStateFromKmH(speedKmh);
  const paceMile = splitMinutesSeconds(totalMinutes);
  return {
    ...base,
    paceMileMinutes: paceMile.minutes,
    paceMileSeconds: paceMile.seconds,
  };
};

export const useSpeedToPace = (): UseSpeedToPaceReturn => {
  const [values, setValues] = useState<SpeedToPaceValues>(() =>
    buildStateFromKmH(DEFAULT_KMH)
  );

  const handleSpeedKmhChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeFloat(event.target.value);
    setValues(buildStateFromKmH(nextValue));
  };

  const handleSpeedMpsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeFloat(event.target.value);
    setValues(buildStateFromMps(nextValue));
  };

  const handleSpeedMphChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toNonNegativeFloat(event.target.value);
    setValues(buildStateFromMph(nextValue));
  };

  const handlePaceKmMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMinutes = toNonNegativeInt(event.target.value);
    const totalMinutes = toTotalMinutes(nextMinutes, values.paceKmSeconds);
    setValues(buildStateFromPaceKm(totalMinutes));
  };

  const handlePaceKmSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSeconds = toNonNegativeInt(event.target.value);
    const totalMinutes = toTotalMinutes(values.paceKmMinutes, nextSeconds);
    setValues(buildStateFromPaceKm(totalMinutes));
  };

  const handlePaceMileMinutesChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextMinutes = toNonNegativeInt(event.target.value);
    const totalMinutes = toTotalMinutes(nextMinutes, values.paceMileSeconds);
    setValues(buildStateFromPaceMile(totalMinutes));
  };

  const handlePaceMileSecondsChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextSeconds = toNonNegativeInt(event.target.value);
    const totalMinutes = toTotalMinutes(values.paceMileMinutes, nextSeconds);
    setValues(buildStateFromPaceMile(totalMinutes));
  };

  return {
    ...values,
    handleSpeedKmhChange,
    handleSpeedMpsChange,
    handleSpeedMphChange,
    handlePaceKmMinutesChange,
    handlePaceKmSecondsChange,
    handlePaceMileMinutesChange,
    handlePaceMileSecondsChange,
  };
};
