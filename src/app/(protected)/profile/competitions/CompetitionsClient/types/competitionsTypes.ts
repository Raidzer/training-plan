import type { Dayjs } from "dayjs";
import type { CompetitionPriority } from "@/shared/constants/competitions";

export type CompetitionItem = {
  id: number;
  blockId: number;
  date: string;
  nameLocation: string;
  distanceMeters: number | null;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CompetitionBlockItem = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  competitions: CompetitionItem[];
};

export type CompetitionBlockFormState = {
  title: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

export type CompetitionFormState = {
  date: Dayjs | null;
  nameLocation: string;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string;
};

export type CompetitionBlockFormUpdate = <Key extends keyof CompetitionBlockFormState>(
  key: Key,
  value: CompetitionBlockFormState[Key]
) => void;

export type CompetitionFormUpdate = <Key extends keyof CompetitionFormState>(
  key: Key,
  value: CompetitionFormState[Key]
) => void;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type CompetitionBlockPayload = {
  title: string;
  startDate: string;
  endDate: string;
};

export type CompetitionPayload = {
  date: string;
  nameLocation: string;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
};
