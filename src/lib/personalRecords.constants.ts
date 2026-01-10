export const PERSONAL_RECORD_DISTANCES = [
  { key: "marathon", label: "Марафон" },
  { key: "21_1k", label: "21,1 км" },
  { key: "10k", label: "10 км" },
  { key: "5k", label: "5 км" },
  { key: "3k", label: "3 км" },
  { key: "1_5k", label: "1,5 км" },
  { key: "1k", label: "1 км" },
  { key: "800m", label: "800 м" },
  { key: "400m", label: "400 м" },
  { key: "200m", label: "200 м" },
  { key: "100m", label: "100 м" },
] as const;

export type PersonalRecordDistanceKey =
  (typeof PERSONAL_RECORD_DISTANCES)[number]["key"];

export const PERSONAL_RECORD_TIME_REGEX =
  /^\d{2}:[0-5]\d:[0-5]\d(?:\.\d{1,2})?$/;

export const MAX_PROTOCOL_URL_LENGTH = 2048;
export const MAX_RACE_NAME_LENGTH = 255;
export const MAX_RACE_CITY_LENGTH = 255;
