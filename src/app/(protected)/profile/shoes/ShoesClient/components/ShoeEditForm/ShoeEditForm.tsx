import { Button, Input, Typography } from "antd";
import type { InputRef } from "antd";
import { useEffect, useId, useRef } from "react";
import { ShoeNotificationOptions } from "../ShoeNotificationOptions/ShoeNotificationOptions";
import { MAX_NAME_LENGTH, shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormErrors,
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import { formatMileageValue } from "../../utils/shoesUtils";
import styles from "./ShoeEditForm.module.scss";

type ShoeEditFormProps = {
  form: ShoeFormState;
  errors?: ShoeFormErrors;
  validationAttempt?: number;
  currentMileageKm: string | null;
  updating: boolean;
  notificationAvailability: ShoeNotificationAvailability;
  onChange: ShoeFormUpdate;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
};

export function ShoeEditForm({
  form,
  errors = {},
  validationAttempt = 0,
  currentMileageKm,
  updating,
  notificationAvailability,
  onChange,
  onSave,
  onCancel,
}: ShoeEditFormProps) {
  const nameInputRef = useRef<InputRef>(null);
  const mileageInputRef = useRef<InputRef>(null);
  const handledValidationAttemptRef = useRef(0);
  const formId = useId();
  const nameId = `${formId}-name`;
  const nameErrorId = `${formId}-name-error`;
  const mileageId = `${formId}-mileage`;
  const mileageHintId = `${formId}-mileage-hint`;
  const mileageErrorId = `${formId}-mileage-error`;

  useEffect(() => {
    nameInputRef.current?.focus({ cursor: "end" });
  }, []);

  useEffect(() => {
    if (validationAttempt === 0 || handledValidationAttemptRef.current === validationAttempt) {
      return;
    }

    handledValidationAttemptRef.current = validationAttempt;

    if (errors.name) {
      nameInputRef.current?.focus({ cursor: "end" });
      return;
    }

    if (errors.mileageLimitKm) {
      mileageInputRef.current?.focus({ cursor: "end" });
    }
  }, [errors.mileageLimitKm, errors.name, validationAttempt]);

  return (
    <form
      className={styles.editForm}
      aria-label={shoesLabels.editSectionTitle}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <Typography.Title level={3} className={styles.title}>
        {shoesLabels.editSectionTitle}
      </Typography.Title>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={nameId} className={styles.label}>
            {shoesLabels.nameLabel}
            <span className={styles.required} aria-hidden>
              *
            </span>
          </label>
          <Input
            ref={nameInputRef}
            id={nameId}
            name="name"
            value={form.name}
            onChange={(event) => {
              onChange("name", event.target.value);
            }}
            disabled={updating}
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrorId : undefined}
          />
          {errors.name ? (
            <span id={nameErrorId} className={styles.error} role="alert">
              {errors.name}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor={mileageId} className={styles.label}>
            {shoesLabels.mileageLimitInputLabel}
          </label>
          <Input
            ref={mileageInputRef}
            id={mileageId}
            name="mileageLimitKm"
            value={form.mileageLimitKm}
            onChange={(event) => {
              onChange("mileageLimitKm", event.target.value);
            }}
            placeholder={shoesLabels.mileageLimitPlaceholder}
            disabled={updating}
            autoComplete="off"
            inputMode="decimal"
            aria-invalid={Boolean(errors.mileageLimitKm)}
            aria-describedby={`${mileageHintId}${
              errors.mileageLimitKm ? ` ${mileageErrorId}` : ""
            }`}
          />
          <span id={mileageHintId} className={styles.hint}>
            {shoesLabels.mileageLimitHint}
          </span>
          {errors.mileageLimitKm ? (
            <span id={mileageErrorId} className={styles.error} role="alert">
              {errors.mileageLimitKm}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.currentMileage}>
        <span>{shoesLabels.currentMileageLabel}:</span>{" "}
        <strong>{formatMileageValue(currentMileageKm)}</strong>
      </div>

      <ShoeNotificationOptions
        idPrefix={`${formId}-notifications`}
        form={form}
        disabled={updating}
        notificationAvailability={notificationAvailability}
        onChange={onChange}
      />
      <div className={styles.editActions}>
        <Button type="primary" htmlType="submit" loading={updating}>
          {shoesLabels.saveButton}
        </Button>
        <Button htmlType="button" onClick={onCancel} disabled={updating}>
          {shoesLabels.cancelButton}
        </Button>
      </div>
    </form>
  );
}
