import { Button, Input, Typography } from "antd";
import { ShoeNotificationOptions } from "../ShoeNotificationOptions/ShoeNotificationOptions";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import styles from "./ShoeCreateForm.module.scss";

type ShoeCreateFormProps = {
  form: ShoeFormState;
  saving: boolean;
  notificationAvailability: ShoeNotificationAvailability;
  onChange: ShoeFormUpdate;
  onSubmit: () => void;
};

export function ShoeCreateForm({
  form,
  saving,
  notificationAvailability,
  onChange,
  onSubmit,
}: ShoeCreateFormProps) {
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
      <ShoeNotificationOptions
        form={form}
        disabled={saving}
        notificationAvailability={notificationAvailability}
        onChange={onChange}
      />
    </div>
  );
}
