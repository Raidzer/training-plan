import { Button, Input, Typography } from "antd";
import { ShoeNotificationOptions } from "../ShoeNotificationOptions/ShoeNotificationOptions";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import { formatMileageValue } from "../../utils/shoesUtils";
import styles from "./ShoeEditForm.module.scss";

type ShoeEditFormProps = {
  form: ShoeFormState;
  currentMileageKm: string | null;
  updating: boolean;
  notificationAvailability: ShoeNotificationAvailability;
  onChange: ShoeFormUpdate;
  onSave: () => void;
  onCancel: () => void;
};

export function ShoeEditForm({
  form,
  currentMileageKm,
  updating,
  notificationAvailability,
  onChange,
  onSave,
  onCancel,
}: ShoeEditFormProps) {
  return (
    <div className={styles.editForm}>
      <div className={styles.editRow}>
        <Input
          value={form.name}
          onChange={(event) => {
            onChange("name", event.target.value);
          }}
          disabled={updating}
          className={styles.editInput}
        />
        <Input
          value={form.mileageLimitKm}
          onChange={(event) => {
            onChange("mileageLimitKm", event.target.value);
          }}
          placeholder={shoesLabels.mileageLimitPlaceholder}
          disabled={updating}
          inputMode="decimal"
          className={styles.limitInput}
        />
      </div>
      <Typography.Text type="secondary" className={styles.itemMetaText}>
        {shoesLabels.currentMileageLabel}: {formatMileageValue(currentMileageKm)}
      </Typography.Text>
      <ShoeNotificationOptions
        form={form}
        disabled={updating}
        notificationAvailability={notificationAvailability}
        onChange={onChange}
      />
      <div className={styles.editActions}>
        <Button type="primary" onClick={onSave} loading={updating}>
          {shoesLabels.saveButton}
        </Button>
        <Button onClick={onCancel} disabled={updating}>
          {shoesLabels.cancelButton}
        </Button>
      </div>
    </div>
  );
}
