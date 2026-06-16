import { Button, DatePicker, Input } from "antd";
import {
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
} from "../../types/competitionsTypes";
import styles from "./CompetitionBlockEditForm.module.scss";

type CompetitionBlockEditFormProps = {
  form: CompetitionBlockFormState;
  updating: boolean;
  onChange: CompetitionBlockFormUpdate;
  onSave: () => void;
  onCancel: () => void;
};

export function CompetitionBlockEditForm({
  form,
  updating,
  onChange,
  onSave,
  onCancel,
}: CompetitionBlockEditFormProps) {
  return (
    <div className={styles.editForm}>
      <Input
        value={form.title}
        onChange={(event) => {
          onChange("title", event.target.value);
        }}
        disabled={updating}
        maxLength={255}
        className={styles.titleInput}
      />
      <DatePicker
        value={form.startDate}
        onChange={(date) => {
          onChange("startDate", date);
        }}
        disabled={updating}
        format={COMPETITIONS_DISPLAY_DATE_FORMAT}
        className={styles.dateInput}
      />
      <DatePicker
        value={form.endDate}
        onChange={(date) => {
          onChange("endDate", date);
        }}
        disabled={updating}
        format={COMPETITIONS_DISPLAY_DATE_FORMAT}
        className={styles.dateInput}
      />
      <div className={styles.actions}>
        <Button type="primary" onClick={onSave} loading={updating}>
          {competitionsLabels.saveButton}
        </Button>
        <Button onClick={onCancel} disabled={updating}>
          {competitionsLabels.cancelButton}
        </Button>
      </div>
    </div>
  );
}
