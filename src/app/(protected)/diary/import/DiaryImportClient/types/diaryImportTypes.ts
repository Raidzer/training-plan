import type { UploadFile } from "antd";

export type DiaryImportIssue = {
  row: number;
  message: string;
};

export type DiaryImportResult = {
  sheetName: string;
  parsedRows: number;
  matchedRows: number;
  reportsUpserted: number;
  reportsSkipped: number;
  weightEntriesUpserted: number;
  recoveryEntriesUpserted: number;
  skippedRows: number;
  errors?: DiaryImportIssue[];
  warnings?: DiaryImportIssue[];
  error?: string;
};

export type DiaryImportFile = UploadFile;
