import { CloudUploadOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import type { FormEvent } from "react";
import { DIARY_IMPORT_TEXT } from "../../constants/diaryImportConstants";
import type { DiaryImportFile } from "../../types/diaryImportTypes";
import styles from "./DiaryImportUploadPanel.module.scss";

const { Dragger } = Upload;

type DiaryImportUploadPanelProps = {
  fileList: DiaryImportFile[];
  fileError: string | null;
  loading: boolean;
  onFileChange: (fileList: DiaryImportFile[]) => void;
  onFileRemove: () => boolean;
  onUpload: () => Promise<void>;
};

export function DiaryImportUploadPanel({
  fileList,
  fileError,
  loading,
  onFileChange,
  onFileRemove,
  onUpload,
}: DiaryImportUploadPanelProps) {
  const selectedFileName = fileList[0]?.name;
  let fileState: string = DIARY_IMPORT_TEXT.upload.idle;

  if (selectedFileName) {
    fileState = DIARY_IMPORT_TEXT.upload.selected(selectedFileName);
  }

  if (fileError) {
    fileState = fileError;
  }

  if (loading) {
    fileState = DIARY_IMPORT_TEXT.upload.loading;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onUpload();
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby="diary-import-upload-title"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <div>
          <h2 id="diary-import-upload-title" className={styles.title}>
            {DIARY_IMPORT_TEXT.upload.title}
          </h2>
          <p className={styles.description}>{DIARY_IMPORT_TEXT.upload.description}</p>
        </div>
        <span className={styles.format}>{DIARY_IMPORT_TEXT.upload.format}</span>
      </header>

      <form
        action="/api/diary/import"
        method="post"
        encType="multipart/form-data"
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <fieldset className={styles.fileFieldset} disabled={loading}>
          <legend className={styles.visuallyHidden}>{DIARY_IMPORT_TEXT.upload.title}</legend>
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
            <span className={styles.dragTitle}>{DIARY_IMPORT_TEXT.upload.dragTitle}</span>
            <span className={styles.dragAction}>{DIARY_IMPORT_TEXT.upload.dragAction}</span>
            <span className={styles.hint}>{DIARY_IMPORT_TEXT.upload.hint}</span>
          </Dragger>
        </fieldset>

        <div className={styles.actions}>
          <p id="diary-import-file-state" className={styles.fileState} aria-live="polite">
            {fileState}
          </p>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<CloudUploadOutlined aria-hidden />}
            loading={loading}
            disabled={loading}
            className={styles.submitButton}
            aria-describedby="diary-import-file-state"
          >
            {DIARY_IMPORT_TEXT.actions.upload}
          </Button>
        </div>
      </form>
    </section>
  );
}
