import type { UploadFile } from "antd";

export type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
  isWorkload: boolean;
  hasReport: boolean;
};

export type PlanDayEntry = {
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  hasReport: boolean;
};

export type PlanDraftEntry = {
  id?: number;
  taskText: string;
  commentText: string;
  hasReport: boolean;
};

export type PlanDraft = {
  date: string;
  originalDate?: string;
  isWorkload: boolean;
  entries: PlanDraftEntry[];
};

export type PlanShiftDirection = "forward" | "backward";

export type PlanShiftDraft = {
  fromDate: string;
  direction: PlanShiftDirection;
  days: number;
};

export type PlanImportIssue = {
  row: number;
  message: string;
};

export type PlanImportResult = {
  importId?: number;
  inserted?: number;
  skipped?: number;
  errors?: PlanImportIssue[];
  warnings?: PlanImportIssue[];
  error?: string;
  details?: string[];
  foundHeaders?: string[];
  sheetName?: string;
  totalRows?: number;
};

export type PlanImportFile = UploadFile;
