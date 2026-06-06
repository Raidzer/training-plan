import { Button, Checkbox, Input, Typography } from "antd";
import { shoesLabels } from "../shoes.constants";
import type { ShoeFormState, ShoeFormUpdate } from "../shoes.types";
import styles from "./ShoeCreateForm.module.scss";

type ShoeCreateFormProps = {
  form: ShoeFormState;
  saving: boolean;
  onChange: ShoeFormUpdate;
  onSubmit: () => void;
};

export function ShoeCreateForm({ form, saving, onChange, onSubmit }: ShoeCreateFormProps) {
  return (
    <div className={styles.form}>
      <Typography.Text type="secondary">{shoesLabels.helperText}</Typography.Text>
      <div className={styles.formRow}>
        <Input
          value={form.name}
          onChange={(event) => {
            onChange("name", event.target.value);
          }}
          placeholder={shoesLabels.inputPlaceholder}
          disabled={saving}
          className={styles.formInput}
        />
        <Input
          value={form.mileageLimitKm}
          onChange={(event) => {
            onChange("mileageLimitKm", event.target.value);
          }}
          placeholder={shoesLabels.mileageLimitPlaceholder}
          disabled={saving}
          inputMode="decimal"
          className={styles.limitInput}
        />
        <Button type="primary" onClick={onSubmit} loading={saving}>
          {shoesLabels.addButton}
        </Button>
      </div>
      <div className={styles.settingsRow}>
        <Checkbox
          checked={form.notifyOnLimitEmail}
          disabled={saving}
          onChange={(event) => {
            onChange("notifyOnLimitEmail", event.target.checked);
          }}
        >
          {shoesLabels.emailNotification}
        </Checkbox>
        <Checkbox
          checked={form.notifyOnLimitTelegram}
          disabled={saving}
          onChange={(event) => {
            onChange("notifyOnLimitTelegram", event.target.checked);
          }}
        >
          {shoesLabels.telegramNotification}
        </Checkbox>
      </div>
    </div>
  );
}
