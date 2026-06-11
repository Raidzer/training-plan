import { Input, Modal, Space, Typography } from "antd";
import type { WorkoutEditForm } from "../../types/diaryTypes";
import styles from "./WorkoutEditModal.module.scss";

type WorkoutEditModalLabels = {
  title: string;
  taskLabel: string;
  commentLabel: string;
  saveLabel: string;
  cancelLabel: string;
};

type WorkoutEditModalProps = {
  open: boolean;
  saving: boolean;
  form: WorkoutEditForm;
  labels: WorkoutEditModalLabels;
  onTaskTextChange: (value: string) => void;
  onCommentTextChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

const { TextArea } = Input;

export function WorkoutEditModal({
  open,
  saving,
  form,
  labels,
  onTaskTextChange,
  onCommentTextChange,
  onCancel,
  onSave,
}: WorkoutEditModalProps) {
  return (
    <Modal
      open={open}
      title={labels.title}
      onCancel={onCancel}
      onOk={onSave}
      okText={labels.saveLabel}
      cancelText={labels.cancelLabel}
      confirmLoading={saving}
      maskClosable={!saving}
      closable={!saving}
      destroyOnHidden
      okButtonProps={{
        disabled: saving,
      }}
      cancelButtonProps={{
        disabled: saving,
      }}
    >
      <Space orientation="vertical" size="middle" className={styles.form}>
        <div className={styles.field}>
          <Typography.Text type="secondary">{labels.taskLabel}</Typography.Text>
          <TextArea
            value={form.taskText}
            onChange={(event) => onTaskTextChange(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
        </div>
        <div className={styles.field}>
          <Typography.Text type="secondary">{labels.commentLabel}</Typography.Text>
          <TextArea
            value={form.commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </div>
      </Space>
    </Modal>
  );
}
