import { PlusOutlined } from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import type { InputRef } from "antd";
import { useEffect, useRef } from "react";
import { ShoeNotificationOptions } from "../ShoeNotificationOptions/ShoeNotificationOptions";
import { MAX_NAME_LENGTH, shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormErrors,
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import styles from "./ShoeCreateForm.module.scss";

type ShoeCreateFormProps = {
  form: ShoeFormState;
  errors?: ShoeFormErrors;
  validationAttempt?: number;
  saving: boolean;
  disabled?: boolean;
  notificationAvailability: ShoeNotificationAvailability;
  onChange: ShoeFormUpdate;
  onSubmit: () => void | Promise<void>;
};

export function ShoeCreateForm({
  form,
  errors = {},
  validationAttempt = 0,
  saving,
  disabled = false,
  notificationAvailability,
  onChange,
  onSubmit,
}: ShoeCreateFormProps) {
  const nameInputRef = useRef<InputRef>(null);
  const mileageInputRef = useRef<InputRef>(null);
  const handledValidationAttemptRef = useRef(0);
  const formDisabled = saving || disabled;
  const nameHintId = "shoe-create-name-hint";
  const nameErrorId = "shoe-create-name-error";
  const mileageHintId = "shoe-create-mileage-hint";
  const mileageErrorId = "shoe-create-mileage-error";

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
    <section className={styles.panel} aria-labelledby="shoe-create-title">
      <header className={styles.header}>
        <div>
          <Typography.Title level={2} id="shoe-create-title" className={styles.title}>
            {shoesLabels.createSectionTitle}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.description}>
            {shoesLabels.createSectionDescription}
          </Typography.Paragraph>
        </div>
      </header>

      <form
        className={styles.form}
        aria-labelledby="shoe-create-title"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className={styles.field}>
          <label htmlFor="shoe-create-name" className={styles.label}>
            {shoesLabels.nameLabel}
            <span className={styles.required} aria-hidden>
              *
            </span>
          </label>
          <Input
            ref={nameInputRef}
            id="shoe-create-name"
            name="name"
            value={form.name}
            onChange={(event) => {
              onChange("name", event.target.value);
            }}
            placeholder={shoesLabels.inputPlaceholder}
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            required
            disabled={formDisabled}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={`${nameHintId}${errors.name ? ` ${nameErrorId}` : ""}`}
          />
          <span id={nameHintId} className={styles.hint}>
            {shoesLabels.nameHint}
          </span>
          {errors.name ? (
            <span id={nameErrorId} className={styles.error} role="alert">
              {errors.name}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="shoe-create-mileage" className={styles.label}>
            {shoesLabels.mileageLimitInputLabel}
          </label>
          <Input
            ref={mileageInputRef}
            id="shoe-create-mileage"
            name="mileageLimitKm"
            value={form.mileageLimitKm}
            onChange={(event) => {
              onChange("mileageLimitKm", event.target.value);
            }}
            placeholder="800"
            autoComplete="off"
            disabled={formDisabled}
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

        <ShoeNotificationOptions
          idPrefix="shoe-create"
          form={form}
          disabled={formDisabled}
          notificationAvailability={notificationAvailability}
          onChange={onChange}
        />

        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined aria-hidden />}
          loading={saving}
          disabled={disabled}
          className={styles.submitButton}
        >
          {shoesLabels.addButton}
        </Button>
      </form>
    </section>
  );
}
