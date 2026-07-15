import { SaveOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import type { TemplateSaveStatus } from "../../types/templateEditorTypes";
import styles from "./TemplateEditorActions.module.scss";

type TemplateEditorActionsProps = {
  isSaving: boolean;
  saveStatus: TemplateSaveStatus;
  saveStatusLabel: string;
  onCancel: () => void;
};

export function TemplateEditorActions({
  isSaving,
  saveStatus,
  saveStatusLabel,
  onCancel,
}: TemplateEditorActionsProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.status} data-status={saveStatus} role="status" aria-live="polite">
        <span aria-hidden />
        {saveStatusLabel}
      </div>

      <div className={styles.actions}>
        <Button size="large" disabled={isSaving} onClick={onCancel}>
          {TEMPLATE_EDITOR_LABELS.cancelButton}
        </Button>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={isSaving}
          icon={<SaveOutlined aria-hidden />}
        >
          {TEMPLATE_EDITOR_LABELS.saveButton}
        </Button>
      </div>
    </div>
  );
}
