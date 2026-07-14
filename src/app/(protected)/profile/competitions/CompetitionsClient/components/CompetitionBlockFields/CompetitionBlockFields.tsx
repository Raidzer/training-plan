"use client";

import { DatePicker, Input } from "antd";
import { useEffect } from "react";
import {
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type {
  CompetitionBlockFormError,
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
} from "../../types/competitionsTypes";
import styles from "./CompetitionBlockFields.module.scss";

type CompetitionBlockFieldsProps = {
  idPrefix: string;
  form: CompetitionBlockFormState;
  error: CompetitionBlockFormError | null;
  validationAttempt: number;
  disabled: boolean;
  inline?: boolean;
  onChange: CompetitionBlockFormUpdate;
};

export function CompetitionBlockFields({
  idPrefix,
  form,
  error,
  validationAttempt,
  disabled,
  inline = false,
  onChange,
}: CompetitionBlockFieldsProps) {
  const titleId = idPrefix + "-title";
  const startDateId = idPrefix + "-start-date";
  const endDateId = idPrefix + "-end-date";
  const titleHintId = titleId + "-hint";
  const errorId = idPrefix + "-error";

  const fieldIds: Record<keyof CompetitionBlockFormState, string> = {
    title: titleId,
    startDate: startDateId,
    endDate: endDateId,
  };
  const errorFieldId = error ? fieldIds[error.field] : null;

  useEffect(() => {
    if (validationAttempt === 0 || !errorFieldId) {
      return;
    }

    document.getElementById(errorFieldId)?.focus();
  }, [errorFieldId, validationAttempt]);

  const titleHasError = error?.field === "title";
  const startDateHasError = error?.field === "startDate";
  const endDateHasError = error?.field === "endDate";

  return (
    <div className={styles.fields + (inline ? " " + styles.inline : "")}>
      <div className={styles.field + " " + styles.titleField}>
        <label htmlFor={titleId} className={styles.label}>
          {competitionsLabels.blockTitleLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <Input
          id={titleId}
          name="title"
          value={form.title}
          onChange={(event) => {
            onChange("title", event.target.value);
          }}
          placeholder={competitionsLabels.blockTitlePlaceholder}
          autoComplete="off"
          disabled={disabled}
          maxLength={255}
          required
          status={titleHasError ? "error" : ""}
          aria-invalid={titleHasError}
          aria-describedby={titleHintId + (titleHasError ? " " + errorId : "")}
        />
        <span id={titleHintId} className={styles.hint}>
          {competitionsLabels.blockTitleHint}
        </span>
        {titleHasError ? (
          <span id={errorId} className={styles.error} role="alert">
            {error.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={startDateId} className={styles.label}>
          {competitionsLabels.startDateLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <DatePicker
          id={startDateId}
          name="startDate"
          value={form.startDate}
          onChange={(date) => {
            onChange("startDate", date);
          }}
          placeholder={competitionsLabels.startDatePlaceholder}
          disabled={disabled}
          format={COMPETITIONS_DISPLAY_DATE_FORMAT}
          required
          status={startDateHasError ? "error" : ""}
          aria-invalid={startDateHasError}
          {...(startDateHasError ? { "aria-describedby": errorId } : {})}
          className={styles.control}
        />
        {startDateHasError ? (
          <span id={errorId} className={styles.error} role="alert">
            {error.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={endDateId} className={styles.label}>
          {competitionsLabels.endDateLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <DatePicker
          id={endDateId}
          name="endDate"
          value={form.endDate}
          onChange={(date) => {
            onChange("endDate", date);
          }}
          placeholder={competitionsLabels.endDatePlaceholder}
          disabled={disabled}
          format={COMPETITIONS_DISPLAY_DATE_FORMAT}
          required
          status={endDateHasError ? "error" : ""}
          aria-invalid={endDateHasError}
          {...(endDateHasError ? { "aria-describedby": errorId } : {})}
          className={styles.control}
        />
        {endDateHasError ? (
          <span id={errorId} className={styles.error} role="alert">
            {error.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
