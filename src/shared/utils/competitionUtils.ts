import { MAX_COMPETITION_DISTANCE_METERS } from "@/shared/constants/competitions";

const DISTANCE_REGEX = /^(\d+(?:[,.]\d+)?)\s*(км|km|k|м|m)$/i;

export const parseCompetitionDistanceMeters = (value: string): number | null => {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(DISTANCE_REGEX);

  if (!match) {
    return null;
  }

  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const unit = match[2];
  const meters = unit === "км" || unit === "km" || unit === "k" ? amount * 1000 : amount;
  const roundedMeters = Math.round(meters);

  if (roundedMeters <= 0 || roundedMeters > MAX_COMPETITION_DISTANCE_METERS) {
    return null;
  }

  return roundedMeters;
};

export const formatCompetitionDate = (value: string) => {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
};
