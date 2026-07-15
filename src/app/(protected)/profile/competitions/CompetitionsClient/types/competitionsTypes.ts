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

export type FormFieldError<Field extends PropertyKey> = {
  field: Field;
  message: string;
};

export type CompetitionBlockFormError = FormFieldError<keyof CompetitionBlockFormState>;
export type CompetitionFormError = FormFieldError<keyof CompetitionFormState>;

export type ValidationResult<T, Field extends PropertyKey> =
  | { ok: true; value: T }
  | { ok: false; error: string; field: Field };

export type CompetitionBlockEditorController = {
  editingId: number | null;
  form: CompetitionBlockFormState;
  error: CompetitionBlockFormError | null;
  validationAttempt: number;
  updatingId: number | null;
  deletingId: number | null;
  onStart: (block: CompetitionBlockItem) => void;
  onChange: CompetitionBlockFormUpdate;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
  onDelete: (block: CompetitionBlockItem) => void;
};

export type CompetitionCreatorController = {
  creatingBlockId: number | null;
  getForm: (blockId: number) => CompetitionFormState;
  getError: (blockId: number) => CompetitionFormError | null;
  getValidationAttempt: (blockId: number) => number;
  onChange: <Key extends keyof CompetitionFormState>(
    blockId: number,
    key: Key,
    value: CompetitionFormState[Key]
  ) => void;
  onCreate: (blockId: number) => Promise<boolean> | boolean;
};

export type CompetitionEditorController = {
  editingId: number | null;
  form: CompetitionFormState;
  error: CompetitionFormError | null;
  validationAttempt: number;
  updatingId: number | null;
  deletingId: number | null;
  onStart: (competition: CompetitionItem) => void;
  onChange: CompetitionFormUpdate;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
  onDelete: (competition: CompetitionItem) => void;
};

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
