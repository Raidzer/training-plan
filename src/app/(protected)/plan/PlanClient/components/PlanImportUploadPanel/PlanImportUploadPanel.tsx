import { CloudUploadOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import type { FormEvent } from "react";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanImportFile } from "../../types/planTypes";
import styles from "./PlanImportUploadPanel.module.scss";

const { Dragger } = Upload;

type PlanImportUploadPanelProps = {
  fileList: PlanImportFile[];
  loading: boolean;
  onFileChange: (fileList: PlanImportFile[]) => void;
  onFileRemove: () => boolean;
  onUpload: () => Promise<void>;
};

export function PlanImportUploadPanel({
  fileList,
  loading,
  onFileChange,
  onFileRemove,
  onUpload,
}: PlanImportUploadPanelProps) {
  const selectedFileName = fileList[0]?.name;
  let fileState: string = PLAN_TEXT.importPage.upload.idle;

  if (selectedFileName) {
    fileState = PLAN_TEXT.importPage.upload.selected(selectedFileName);
  }

  if (loading) {
    fileState = PLAN_TEXT.importPage.upload.loading;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onUpload();
  };

  return (
    <section className={styles.panel} aria-labelledby="plan-import-upload-title">
      <header className={styles.header}>
        <div>
          <h2 id="plan-import-upload-title" className={styles.title}>
            {PLAN_TEXT.importPage.upload.title}
          </h2>
          <p className={styles.description}>{PLAN_TEXT.importPage.upload.description}</p>
        </div>
        <span className={styles.format}>{PLAN_TEXT.importPage.upload.format}</span>
      </header>

      <form
        action="/api/plans/import"
        method="post"
        encType="multipart/form-data"
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <Dragger
          className={styles.dropzone}
          name="file"
          maxCount={1}
          multiple={false}
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          beforeUpload={() => false}
          onRemove={onFileRemove}
          onChange={(info) => {
            onFileChange(info.fileList);
          }}
          fileList={fileList}
          disabled={loading}
          showUploadList={{ showDownloadIcon: false, showPreviewIcon: false }}
        >
          <span className={styles.uploadIcon} aria-hidden>
            <InboxOutlined />
          </span>
          <span className={styles.dragTitle}>{PLAN_TEXT.importPage.upload.dragTitle}</span>
          <span className={styles.dragAction}>{PLAN_TEXT.importPage.upload.dragAction}</span>
          <span className={styles.hint}>{PLAN_TEXT.importPage.upload.hint}</span>
        </Dragger>

        <div className={styles.actions}>
          <p id="plan-import-file-state" className={styles.fileState} aria-live="polite">
            {fileState}
          </p>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<CloudUploadOutlined aria-hidden />}
            loading={loading}
            className={styles.submitButton}
            aria-describedby="plan-import-file-state"
          >
            {PLAN_TEXT.actions.upload}
          </Button>
        </div>
      </form>
    </section>
  );
}
