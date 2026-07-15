"use client";

import { DeleteOutlined, InfoCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input } from "antd";
import { useEffect, type FormEvent } from "react";
import { TimeInput } from "@/components/inputs/TimeInput";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  type PersonalRecordDistanceKey,
} from "@/shared/constants/personalRecords.constants";
import { RECORD_FIELD_ERROR_MESSAGES, RECORDS_LABELS } from "../../constants/recordsConstants";
import type { RecordFieldErrorKey, RecordFieldErrors, RecordRow } from "../../types/recordsTypes";
import { hasRecordDraft, isRecordFilled, normalizeTimeText } from "../../utils/recordsUtils";
import styles from "./RecordEditor.module.scss";

type RecordEditorProps = {
  row: RecordRow;
  errors: RecordFieldErrors;
  saving: boolean;
  disabled: boolean;
  hasChanges: boolean;
  saveError: boolean;
  validationAttempt: number;
  onFieldChange: (distanceKey: PersonalRecordDistanceKey, patch: Partial<RecordRow>) => void;
  onClearRecord: (distanceKey: PersonalRecordDistanceKey) => void;
  onSubmit: () => Promise<void> | void;
};

type FieldMessageProps = {
  id: string;
  error?: string | undefined;
  hint?: string | undefined;
};

const ERROR_FOCUS_ORDER: RecordFieldErrorKey[] = ["time", "date", "raceName", "raceCity", "url"];

const getFieldId = (distanceKey: PersonalRecordDistanceKey, field: RecordFieldErrorKey) =>
  `record-${distanceKey}-${field}`;

function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <span id={id} className={styles.errorText}>
        {error}
      </span>
    );
  }

  if (hint) {
    return (
      <span id={id} className={styles.hintText}>
        {hint}
      </span>
    );
  }

  return null;
}

export function RecordEditor({
  row,
  errors,
  saving,
  disabled,
  hasChanges,
  saveError,
  validationAttempt,
  onFieldChange,
  onClearRecord,
  onSubmit,
}: RecordEditorProps) {
  const filled = isRecordFilled(row);
  const draftExists = hasRecordDraft(row);
  const hasValidationErrors = Object.values(errors).some(Boolean);
  const normalizedTime = normalizeTimeText(row.timeText);
  let statusLabel: string = RECORDS_LABELS.emptyStatus;
  let statusClassName = styles.statusEmpty;

  if (hasValidationErrors) {
    statusLabel = RECORDS_LABELS.invalidStatus;
    statusClassName = styles.statusInvalid;
  } else if (filled) {
    statusLabel = RECORDS_LABELS.completedStatus;
    statusClassName = styles.statusFilled;
  }

  const timeId = getFieldId(row.distanceKey, "time");
  const dateId = getFieldId(row.distanceKey, "date");
  const raceNameId = getFieldId(row.distanceKey, "raceName");
  const raceCityId = getFieldId(row.distanceKey, "raceCity");
  const protocolId = getFieldId(row.distanceKey, "url");
  const timeMessageId = `${timeId}-message`;
  const dateMessageId = `${dateId}-message`;
  const raceNameMessageId = `${raceNameId}-message`;
  const raceCityMessageId = `${raceCityId}-message`;
  const protocolMessageId = `${protocolId}-message`;

  useEffect(() => {
    if (validationAttempt === 0) {
      return;
    }

    const firstErrorKey = ERROR_FOCUS_ORDER.find((field) => errors[field]);
    if (!firstErrorKey) {
      return;
    }

    document.getElementById(getFieldId(row.distanceKey, firstErrorKey))?.focus();
  }, [errors, row.distanceKey, validationAttempt]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <section className={styles.editor} aria-labelledby="record-editor-title">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>{RECORDS_LABELS.editorEyebrow}</span>
          <h2 id="record-editor-title" className={styles.title}>
            {row.label}
          </h2>
          <span className={statusClassName}>
            <span className={styles.statusMarker} aria-hidden />
            {statusLabel}
          </span>
        </div>
        <div
          className={styles.timePreview}
          aria-label={`${RECORDS_LABELS.timeLabel}: ${normalizedTime || statusLabel}`}
        >
          {normalizedTime || "—"}
        </div>
      </header>

      <div className={styles.guide}>
        <InfoCircleOutlined className={styles.guideIcon} aria-hidden />
        <div>
          <strong>{RECORDS_LABELS.alertTitle}</strong>
          <p>{RECORDS_LABELS.alertText}</p>
        </div>
      </div>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.resultGrid}>
          <div className={styles.field}>
            <label htmlFor={timeId}>
              {RECORDS_LABELS.timeLabel}
              {draftExists ? <span className={styles.requiredMark}>*</span> : null}
            </label>
            <TimeInput
              id={timeId}
              name={`${row.distanceKey}-time`}
              value={row.timeText}
              onChange={(value) => {
                onFieldChange(row.distanceKey, { timeText: value });
              }}
              placeholder={RECORDS_LABELS.timePlaceholder}
              status={errors.time ? "error" : ""}
              aria-invalid={errors.time ? "true" : undefined}
              aria-describedby={timeMessageId}
              required={draftExists}
              disabled={disabled || saving}
              maxLength={16}
              autoComplete="off"
              className={styles.timeInput}
            />
            <FieldMessage
              id={timeMessageId}
              error={errors.time ? RECORD_FIELD_ERROR_MESSAGES.time : undefined}
              hint={errors.time ? undefined : RECORDS_LABELS.clearHint}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={dateId}>
              {RECORDS_LABELS.dateLabel}
              {filled ? <span className={styles.requiredMark}>*</span> : null}
            </label>
            <DatePicker
              id={dateId}
              name={`${row.distanceKey}-date`}
              value={row.recordDate}
              onChange={(date) => {
                onFieldChange(row.distanceKey, { recordDate: date });
              }}
              placeholder={RECORDS_LABELS.datePlaceholder}
              status={errors.date ? "error" : ""}
              aria-invalid={errors.date ? "true" : undefined}
              aria-describedby={errors.date ? dateMessageId : undefined}
              required={filled}
              disabled={disabled || saving}
              format="DD.MM.YYYY"
              className={styles.control}
            />
            <FieldMessage
              id={dateMessageId}
              error={errors.date ? RECORD_FIELD_ERROR_MESSAGES.date : undefined}
            />
          </div>
        </div>

        <fieldset className={styles.eventDetails}>
          <legend>{RECORDS_LABELS.eventDetailsTitle}</legend>
          <p className={styles.eventDescription}>{RECORDS_LABELS.eventDetailsDescription}</p>

          <div className={styles.eventGrid}>
            <div className={styles.field}>
              <label htmlFor={raceNameId}>{RECORDS_LABELS.raceNameLabel}</label>
              <Input
                id={raceNameId}
                name={`${row.distanceKey}-race-name`}
                value={row.raceName}
                onChange={(event) => {
                  onFieldChange(row.distanceKey, { raceName: event.target.value });
                }}
                placeholder={RECORDS_LABELS.raceNamePlaceholder}
                status={errors.raceName ? "error" : ""}
                aria-invalid={errors.raceName ? "true" : undefined}
                aria-describedby={errors.raceName ? raceNameMessageId : undefined}
                disabled={disabled || saving}
                maxLength={MAX_RACE_NAME_LENGTH}
                autoComplete="off"
              />
              <FieldMessage
                id={raceNameMessageId}
                error={errors.raceName ? RECORD_FIELD_ERROR_MESSAGES.raceName : undefined}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={raceCityId}>{RECORDS_LABELS.raceCityLabel}</label>
              <Input
                id={raceCityId}
                name={`${row.distanceKey}-race-city`}
                value={row.raceCity}
                onChange={(event) => {
                  onFieldChange(row.distanceKey, { raceCity: event.target.value });
                }}
                placeholder={RECORDS_LABELS.raceCityPlaceholder}
                status={errors.raceCity ? "error" : ""}
                aria-invalid={errors.raceCity ? "true" : undefined}
                aria-describedby={errors.raceCity ? raceCityMessageId : undefined}
                disabled={disabled || saving}
                maxLength={MAX_RACE_CITY_LENGTH}
                autoComplete="address-level2"
              />
              <FieldMessage
                id={raceCityMessageId}
                error={errors.raceCity ? RECORD_FIELD_ERROR_MESSAGES.raceCity : undefined}
              />
            </div>

            <div className={`${styles.field} ${styles.protocolField}`}>
              <label htmlFor={protocolId}>{RECORDS_LABELS.protocolLabel}</label>
              <Input
                id={protocolId}
                name={`${row.distanceKey}-protocol-url`}
                value={row.protocolUrl}
                onChange={(event) => {
                  onFieldChange(row.distanceKey, { protocolUrl: event.target.value });
                }}
                placeholder={RECORDS_LABELS.protocolPlaceholder}
                status={errors.url ? "error" : ""}
                aria-invalid={errors.url ? "true" : undefined}
                aria-describedby={errors.url ? protocolMessageId : undefined}
                disabled={disabled || saving}
                type="url"
                maxLength={MAX_PROTOCOL_URL_LENGTH}
                autoComplete="url"
              />
              <FieldMessage
                id={protocolMessageId}
                error={errors.url ? RECORD_FIELD_ERROR_MESSAGES.url : undefined}
              />
            </div>
          </div>
        </fieldset>

        <div className={styles.clearRow}>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            disabled={disabled || saving || !draftExists}
            onClick={() => onClearRecord(row.distanceKey)}
          >
            {RECORDS_LABELS.clearButton}
          </Button>
          <span>{RECORDS_LABELS.clearHint}</span>
        </div>

        {saveError ? (
          <div className={styles.saveError} role="alert">
            {RECORDS_LABELS.saveErrorDescription}
          </div>
        ) : null}

        <footer className={styles.actions}>
          <span className={hasChanges ? styles.unsavedState : styles.savedState} aria-live="polite">
            {hasChanges ? RECORDS_LABELS.unsavedState : RECORDS_LABELS.savedState}
          </span>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={disabled || saving || !hasChanges}
          >
            {RECORDS_LABELS.saveButton}
          </Button>
        </footer>
      </form>
    </section>
  );
}
