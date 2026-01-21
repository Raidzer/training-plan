import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Input, Modal, Space, Switch, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { PLAN_DATE_DISPLAY_FORMAT } from "../planConstants";
import styles from "../plan.module.scss";
import { PLAN_TEXT } from "../planText";
import type { PlanDraft, PlanDraftEntry } from "../planUtils";

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

  return (
    <Modal
      open={open}
      title={isEditing ? PLAN_TEXT.editor.titleEdit : PLAN_TEXT.editor.titleCreate}
      onCancel={onCancel}
      onOk={onSave}
      okText={PLAN_TEXT.editor.save}
      cancelText={PLAN_TEXT.editor.cancel}
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
      <Space orientation="vertical" size="middle" className={styles.editorForm}>
        <Space size="middle" align="center" wrap className={styles.editorTopRow}>
          <div className={styles.editorField}>
            <Typography.Text>{PLAN_TEXT.editor.dateLabel}</Typography.Text>
            <DatePicker
              value={dateValue}
              onChange={onDateChange}
              format={PLAN_DATE_DISPLAY_FORMAT}
              allowClear={false}
            />
          </div>
          <Space size="small" align="center">
            <Switch checked={draft.isWorkload} onChange={onWorkloadChange} />
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
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveEntry(index)}
                    aria-label={PLAN_TEXT.editor.deleteWorkoutAria(index + 1)}
                  />
                </div>
                <div className={styles.editorField}>
                  <Typography.Text type="secondary">{PLAN_TEXT.editor.taskLabel}</Typography.Text>
                  <TextArea
                    value={entry.taskText}
                    onChange={(event) => onEntryChange(index, { taskText: event.target.value })}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </div>
                <div className={styles.editorField}>
                  <Typography.Text type="secondary">
                    {PLAN_TEXT.editor.commentLabel}
                  </Typography.Text>
                  <TextArea
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
        <Space size="middle" wrap>
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
