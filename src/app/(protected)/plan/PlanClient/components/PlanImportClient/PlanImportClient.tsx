"use client";

import { message } from "antd";
import { usePlanImport } from "../../hooks/usePlanImport";
import { PlanImportGuide } from "../PlanImportGuide/PlanImportGuide";
import { PlanImportHeader } from "../PlanImportHeader/PlanImportHeader";
import { PlanImportResult } from "../PlanImportResult/PlanImportResult";
import { PlanImportUploadPanel } from "../PlanImportUploadPanel/PlanImportUploadPanel";
import styles from "./PlanImportClient.module.scss";

export function PlanImportClient() {
  const [msgApi, contextHolder] = message.useMessage();
  const { fileList, loading, result, handleFileChange, handleFileRemove, handleUpload } =
    usePlanImport({ msgApi });

  return (
    <div className={styles.mainContainer}>
      {contextHolder}
      <div className={styles.pageStack}>
        <PlanImportHeader />

        <div className={styles.workspace}>
          <div className={styles.uploadSlot}>
            <PlanImportUploadPanel
              fileList={fileList}
              loading={loading}
              onFileChange={handleFileChange}
              onFileRemove={handleFileRemove}
              onUpload={handleUpload}
            />
          </div>

          {result ? (
            <div className={styles.resultSlot}>
              <PlanImportResult result={result} />
            </div>
          ) : null}

          <div className={styles.guideSlot}>
            <PlanImportGuide />
          </div>
        </div>
      </div>
    </div>
  );
}
