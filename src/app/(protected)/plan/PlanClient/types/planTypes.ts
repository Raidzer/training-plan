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

export type PlanImportResult = {
  importId: number;
  inserted: number;
  skipped: number;
  errors?: { row: number; message: string }[];
  error?: string;
};

export type PlanImportFile = UploadFile;
