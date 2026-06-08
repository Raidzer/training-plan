import type { Dayjs } from "dayjs";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";

export type ApiRecord = {
  distanceKey: string;
  timeText: string;
  recordDate: string;
  protocolUrl: string | null;
  raceName: string | null;
  raceCity: string | null;
};

export type RecordRow = {
  distanceKey: PersonalRecordDistanceKey;
  label: string;
  timeText: string;
  recordDate: Dayjs | null;
  protocolUrl: string;
  raceName: string;
  raceCity: string;
};

export type RecordFieldErrors = {
  time?: boolean;
  date?: boolean;
  url?: boolean;
  raceName?: boolean;
  raceCity?: boolean;
};

export type RecordsClientProps = {
  apiUrl?: string;
};
