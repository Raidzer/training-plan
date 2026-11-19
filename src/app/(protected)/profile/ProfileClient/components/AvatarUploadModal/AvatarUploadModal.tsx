"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Upload } from "antd";
import type { UploadFile } from "antd";
import { AVATAR_SOURCE_MIME_TYPES } from "@/shared/constants/profileAvatar";
import { AVATAR_LABELS } from "../../constants/avatarConstants";
import styles from "./AvatarUploadModal.module.scss";

const { Dragger } = Upload;

type AvatarUploadModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  canDelete?: boolean;
  deleting?: boolean;
  onCancel: () => void;
  onFileSelect: (file: File) => void;
  onDelete?: () => Promise<void>;
};

export function AvatarUploadModal({
  open,
  loading,
  error,
  canDelete = false,
  deleting = false,
  onCancel,
  onFileSelect,
  onDelete = async () => {},
}: AvatarUploadModalProps) {
  const handleChange = ({ file }: { file: UploadFile }) => {
    const sourceFile = file.originFileObj ?? (file as unknown as File);

    if (sourceFile instanceof File) {
      onFileSelect(sourceFile);
    }
  };

  return (
    <Modal
      title={AVATAR_LABELS.uploadTitle}
      open={open}
      centered
      width={560}
      destroyOnHidden
      keyboard={!loading && !deleting}
      closable={!loading && !deleting}
      mask={{ closable: false }}
      onCancel={onCancel}
      footer={null}
      rootClassName={styles.modalRoot}
    >
      <div className={styles.content}>
        <p className={styles.description}>{AVATAR_LABELS.uploadDescription}</p>
        <fieldset
          className={styles.fileFieldset}
          disabled={loading || deleting}
          onKeyDownCapture={(event) => {
            if (event.key !== " ") {
              return;
            }
            const target = event.target as HTMLElement;
            if (!target.closest('[role="button"]')) {
              return;
            }
            event.preventDefault();
            event.currentTarget.querySelector<HTMLInputElement>('input[type="file"]')?.click();
          }}
        >
          <legend className={styles.visuallyHidden}>{AVATAR_LABELS.uploadTitle}</legend>
          <Dragger
            className={styles.dropzone}
            name="avatar"
            maxCount={1}
            multiple={false}
            accept={AVATAR_SOURCE_MIME_TYPES.join(",")}
            beforeUpload={() => false}
            onChange={handleChange}
            showUploadList={false}
            disabled={loading || deleting}
          >
            <span className={styles.uploadIcon} aria-hidden>
              <InboxOutlined />
            </span>
            <span className={styles.dragTitle}>{AVATAR_LABELS.uploadDragTitle}</span>
            <span className={styles.dragAction}>{AVATAR_LABELS.uploadDragAction}</span>
            <span className={styles.hint}>{AVATAR_LABELS.uploadHint}</span>
          </Dragger>
        </fieldset>
        {loading ? <p className={styles.status}>{AVATAR_LABELS.loading}</p> : null}
        {error ? <Alert type="error" showIcon title={error} role="alert" /> : null}
      </div>
      {canDelete ? (
        <div className={styles.footer}>
          <Button size="large" disabled={loading || deleting} onClick={onCancel}>
            {AVATAR_LABELS.cancel}
          </Button>
          <Button
            size="large"
            danger
            loading={deleting}
            disabled={loading || deleting}
            onClick={() => void onDelete()}
          >
            {AVATAR_LABELS.remove}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
