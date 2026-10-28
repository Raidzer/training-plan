import {
  PERSONAL_RECORD_DISTANCES,
  PERSONAL_RECORD_TIME_REGEX,
  type PersonalRecordDistanceKey,
} from "@/shared/constants/personalRecords.constants";

export const getPersonalRecordDistanceKey = (value: string): PersonalRecordDistanceKey | null => {
  const normalized = value.toLowerCase().replace(/\s+/g, "").replace(",", ".");
  const distanceByLabel = PERSONAL_RECORD_DISTANCES.find(
    (distance) => distance.label.toLowerCase().replace(/\s+/g, "").replace(",", ".") === normalized
  );

  if (distanceByLabel) {
    return distanceByLabel.key;
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)(км|km|k|м|m)$/);

  if (!match) {
    return null;
  }

  const [integer, fraction = ""] = match[1].split(".");
  const decimal = fraction.replace(/0+$/, "");
  const amount = `${integer.replace(/^0+(?=\d)/, "")}${decimal ? `.${decimal}` : ""}`;
  const metersPerUnit = match[2] === "м" || match[2] === "m" ? 1 : 1000;

  return (
    PERSONAL_RECORD_DISTANCES.find(
      (distance) =>
        String(distance.meters / metersPerUnit) === amount ||
        (distance.key === "21_1k" && String(21097.5 / metersPerUnit) === amount)
    )?.key ?? null
  );
};

export const parsePersonalRecordTime = (
  value: string
): { timeText: string; hundredths: number } | null => {
  const normalized = value.trim().replace(",", ".");

  if (!PERSONAL_RECORD_TIME_REGEX.test(normalized)) {
    return null;
  }

  const [time, fraction = ""] = normalized.split(".");
  const timeParts = time.split(":");
  const fractionText = fraction.padEnd(2, "0");
  const hundredths =
    timeParts.reduce((total, part) => total * 60 + Number(part), 0) * 100 + Number(fractionText);

  if (hundredths === 0) {
    return null;
  }

  const timeText = timeParts.length === 2 ? `00:${time}` : time;

  return {
    timeText: Number(fractionText) > 0 ? `${timeText}.${fractionText}` : timeText,
    hundredths,
  };
};
