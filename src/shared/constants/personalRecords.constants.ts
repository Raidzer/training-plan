export const PERSONAL_RECORD_DISTANCES = [
  { key: "marathon", label: "Марафон", meters: 42195 },
  { key: "21_1k", label: "21,1 км", meters: 21100 },
  { key: "10k", label: "10 км", meters: 10000 },
  { key: "5k", label: "5 км", meters: 5000 },
  { key: "3k", label: "3 км", meters: 3000 },
  { key: "1_5k", label: "1,5 км", meters: 1500 },
  { key: "1k", label: "1 км", meters: 1000 },
  { key: "800m", label: "800 м", meters: 800 },
  { key: "400m", label: "400 м", meters: 400 },
  { key: "200m", label: "200 м", meters: 200 },
  { key: "100m", label: "100 м", meters: 100 },
] as const;

export type PersonalRecordDistanceKey = (typeof PERSONAL_RECORD_DISTANCES)[number]["key"];

export const PERSONAL_RECORD_TIME_REGEX = /^(?:\d{2}:)?[0-5]\d:[0-5]\d(?:\.\d{1,2})?$/;

export const MAX_PROTOCOL_URL_LENGTH = 2048;
export const MAX_RACE_NAME_LENGTH = 255;
export const MAX_RACE_CITY_LENGTH = 255;
