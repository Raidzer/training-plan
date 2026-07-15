"use client";

import { message } from "antd";
import { DiaryImportGuide } from "./components/DiaryImportGuide/DiaryImportGuide";
import { DiaryImportHeader } from "./components/DiaryImportHeader/DiaryImportHeader";
import { DiaryImportResult } from "./components/DiaryImportResult/DiaryImportResult";
import { DiaryImportUploadPanel } from "./components/DiaryImportUploadPanel/DiaryImportUploadPanel";
import { DIARY_IMPORT_TEXT } from "./constants/diaryImportConstants";
import { useDiaryImport } from "./hooks/useDiaryImport";
import styles from "./DiaryImportClient.module.scss";

export function DiaryImportClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const { fileList, fileError, loading, result, handleFileChange, handleFileRemove, handleUpload } =
    useDiaryImport({ messageApi });

  return (
    <div className={styles.mainContainer}>
      {contextHolder}
      <p className={styles.statusAnnouncer} role="status" aria-live="polite" aria-atomic="true">
        {result && !result.error ? DIARY_IMPORT_TEXT.messages.resultReady : ""}
      </p>
      <div className={styles.pageStack}>
        <DiaryImportHeader />

        <div className={styles.workspace}>
          <div className={styles.uploadSlot}>
            <DiaryImportUploadPanel
              fileList={fileList}
              fileError={fileError}
              loading={loading}
              onFileChange={handleFileChange}
              onFileRemove={handleFileRemove}
              onUpload={handleUpload}
            />
          </div>

          {result ? (
            <div className={styles.resultSlot}>
              <DiaryImportResult result={result} />
            </div>
          ) : null}

          <div className={styles.guideSlot}>
            <DiaryImportGuide />
          </div>
        </div>
      </div>
    </div>
  );
}
