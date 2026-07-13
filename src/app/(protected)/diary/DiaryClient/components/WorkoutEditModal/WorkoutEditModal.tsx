import { Input, Modal, Space } from "antd";
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
      className={styles.modal}
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
          <label className={styles.label} htmlFor="workout-edit-task">
            {labels.taskLabel}
          </label>
          <TextArea
            id="workout-edit-task"
            name="taskText"
            value={form.taskText}
            onChange={(event) => onTaskTextChange(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workout-edit-comment">
            {labels.commentLabel}
          </label>
          <TextArea
            id="workout-edit-comment"
            name="commentText"
            value={form.commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </div>
      </Space>
    </Modal>
  );
}
