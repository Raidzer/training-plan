import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Input, Modal, Space, Switch, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { PLAN_DATE_DISPLAY_FORMAT } from "../../constants/planConstants";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDraft, PlanDraftEntry } from "../../types/planTypes";
import styles from "./PlanEditorModal.module.scss";

const { TextArea } = Input;

type PlanEditorModalProps = {
  open: boolean;
  draft: PlanDraft | null;
  saving: boolean;
  dateValue: Dayjs | null;
  onCancel: () => void;
  onSave: () => void;
  onDateChange: (value: Dayjs | null) => void;
  onWorkloadChange: (value: boolean) => void;
  onEntryChange: (index: number, patch: Partial<PlanDraftEntry>) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onDeleteDay: () => void;
};

export function PlanEditorModal({
  open,
  draft,
  saving,
  dateValue,
  onCancel,
  onSave,
  onDateChange,
  onWorkloadChange,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onDeleteDay,
}: PlanEditorModalProps) {
  if (!draft) {
    return null;
  }
  const isEditing = Boolean(draft.originalDate);
  const isDateLocked = isEditing && draft.entries.some((entry) => entry.hasReport);

  return (
    <Modal
      open={open}
      title={isEditing ? PLAN_TEXT.editor.titleEdit : PLAN_TEXT.editor.titleCreate}
      width="min(720px, calc(100vw - 24px))"
      className={styles.modal}
      onCancel={onCancel}
      onOk={onSave}
      okText={PLAN_TEXT.editor.save}
      cancelText={PLAN_TEXT.editor.cancel}
      confirmLoading={saving}
      mask={{ closable: !saving }}
      closable={!saving}
      destroyOnHidden
      okButtonProps={{
        disabled: saving,
      }}
      cancelButtonProps={{
        disabled: saving,
      }}
    >
      <Space orientation="vertical" size="middle" className={styles.editorForm}>
        <Space size="middle" align="center" wrap className={styles.editorTopRow}>
          <div className={styles.editorField}>
            <label className={styles.fieldLabel} htmlFor="plan-editor-date">
              {PLAN_TEXT.editor.dateLabel}
            </label>
            <DatePicker
              id="plan-editor-date"
              value={dateValue}
              onChange={onDateChange}
              format={PLAN_DATE_DISPLAY_FORMAT}
              allowClear={false}
              disabled={isDateLocked}
              aria-describedby={isDateLocked ? "plan-editor-date-hint" : undefined}
            />
            {isDateLocked ? (
              <Typography.Text id="plan-editor-date-hint" type="secondary">
                {PLAN_TEXT.editor.dateLockedByReport}
              </Typography.Text>
            ) : null}
          </div>
          <Space size="small" align="center">
            <Switch
              checked={draft.isWorkload}
              onChange={onWorkloadChange}
              aria-label={PLAN_TEXT.editor.workloadLabel}
            />
            <Typography.Text>{PLAN_TEXT.editor.workloadLabel}</Typography.Text>
          </Space>
        </Space>
        <Space orientation="vertical" size="middle" className={styles.editorEntries}>
          {draft.entries.map((entry, index) => (
            <Card key={entry.id ?? `new-${index}`} size="small">
              <Space orientation="vertical" size="small" className={styles.editorEntryBody}>
                <div className={styles.editorEntryHeader}>
                  <Typography.Text strong>
                    {PLAN_TEXT.editor.workoutLabel(index + 1)}
                  </Typography.Text>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined aria-hidden />}
                    onClick={() => onRemoveEntry(index)}
                    aria-label={PLAN_TEXT.editor.deleteWorkoutAria(index + 1)}
                    className={styles.deleteWorkoutButton}
                  >
                    {PLAN_TEXT.confirm.okDelete}
                  </Button>
                </div>
                <div className={styles.editorField}>
                  <label className={styles.fieldLabel} htmlFor={`plan-editor-task-${index}`}>
                    {PLAN_TEXT.editor.taskLabel}
                  </label>
                  <TextArea
                    id={`plan-editor-task-${index}`}
                    name={`planWorkoutTask${index}`}
                    value={entry.taskText}
                    onChange={(event) => onEntryChange(index, { taskText: event.target.value })}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </div>
                <div className={styles.editorField}>
                  <label className={styles.fieldLabel} htmlFor={`plan-editor-comment-${index}`}>
                    {PLAN_TEXT.editor.commentLabel}
                  </label>
                  <TextArea
                    id={`plan-editor-comment-${index}`}
                    name={`planWorkoutComment${index}`}
                    value={entry.commentText}
                    onChange={(event) =>
                      onEntryChange(index, {
                        commentText: event.target.value,
                      })
                    }
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </div>
              </Space>
            </Card>
          ))}
        </Space>
        <Space size="middle" wrap className={styles.editorActions}>
          <Button icon={<PlusOutlined />} onClick={onAddEntry}>
            {PLAN_TEXT.editor.addWorkout}
          </Button>
          {isEditing ? (
            <Button danger onClick={onDeleteDay}>
              {PLAN_TEXT.editor.deleteDay}
            </Button>
          ) : null}
        </Space>
      </Space>
    </Modal>
  );
}
