"use client";

import { DatePicker, Input, Select } from "antd";
import { useEffect } from "react";
import { TimeInput } from "@/components/inputs/TimeInput";
import {
  COMPETITION_PRIORITY_OPTIONS,
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type {
  CompetitionFormError,
  CompetitionFormState,
  CompetitionFormUpdate,
} from "../../types/competitionsTypes";
import { CompetitionDistanceInput } from "../CompetitionDistanceInput/CompetitionDistanceInput";
import styles from "./CompetitionFormFields.module.scss";

type CompetitionFormFieldsProps = {
  idPrefix: string;
  form: CompetitionFormState;
  error: CompetitionFormError | null;
  validationAttempt: number;
  disabled: boolean;
  onChange: CompetitionFormUpdate;
};

export function CompetitionFormFields({
  idPrefix,
  form,
  error,
  validationAttempt,
  disabled,
  onChange,
}: CompetitionFormFieldsProps) {
  const dateId = idPrefix + "-date";
  const nameLocationId = idPrefix + "-name-location";
  const distanceId = idPrefix + "-distance";
  const priorityId = idPrefix + "-priority";
  const resultId = idPrefix + "-result";
  const resultHintId = resultId + "-hint";
  const errorId = idPrefix + "-error";

  const fieldIds: Record<keyof CompetitionFormState, string> = {
    date: dateId,
    nameLocation: nameLocationId,
    distanceLabel: distanceId,
    priority: priorityId,
    result: resultId,
  };
  const errorFieldId = error ? fieldIds[error.field] : null;

  useEffect(() => {
    if (validationAttempt === 0 || !errorFieldId) {
      return;
    }

    document.getElementById(errorFieldId)?.focus();
  }, [errorFieldId, validationAttempt]);

  const hasError = (field: keyof CompetitionFormState) => error?.field === field;

  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label htmlFor={dateId}>
          {competitionsLabels.competitionDateLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <DatePicker
          id={dateId}
          name="date"
          value={form.date}
          onChange={(date) => {
            onChange("date", date);
          }}
          placeholder={competitionsLabels.competitionDatePlaceholder}
          disabled={disabled}
          format={COMPETITIONS_DISPLAY_DATE_FORMAT}
          required
          status={hasError("date") ? "error" : ""}
          aria-invalid={hasError("date")}
          {...(hasError("date") ? { "aria-describedby": errorId } : {})}
          className={styles.control}
        />
        {hasError("date") ? (
          <span id={errorId} className={styles.error} role="alert">
            {error?.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field + " " + styles.nameField}>
        <label htmlFor={nameLocationId}>
          {competitionsLabels.nameLocationLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <Input
          id={nameLocationId}
          name="nameLocation"
          value={form.nameLocation}
          onChange={(event) => {
            onChange("nameLocation", event.target.value);
          }}
          placeholder={competitionsLabels.nameLocationPlaceholder}
          disabled={disabled}
          autoComplete="off"
          maxLength={255}
          required
          status={hasError("nameLocation") ? "error" : ""}
          aria-invalid={hasError("nameLocation")}
          {...(hasError("nameLocation") ? { "aria-describedby": errorId } : {})}
        />
        {hasError("nameLocation") ? (
          <span id={errorId} className={styles.error} role="alert">
            {error?.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={distanceId}>
          {competitionsLabels.distanceLabel}
          <span className={styles.required} aria-hidden />
        </label>
        <CompetitionDistanceInput
          id={distanceId}
          value={form.distanceLabel}
          onChange={(value) => {
            onChange("distanceLabel", value);
          }}
          disabled={disabled}
          aria-required="true"
          status={hasError("distanceLabel") ? "error" : ""}
          aria-invalid={hasError("distanceLabel")}
          {...(hasError("distanceLabel") ? { "aria-describedby": errorId } : {})}
          className={styles.control}
        />
        {hasError("distanceLabel") ? (
          <span id={errorId} className={styles.error} role="alert">
            {error?.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={priorityId}>{competitionsLabels.priorityLabel}</label>
        <Select
          id={priorityId}
          value={form.priority}
          onChange={(value) => {
            onChange("priority", value);
          }}
          options={[...COMPETITION_PRIORITY_OPTIONS]}
          disabled={disabled}
          status={hasError("priority") ? "error" : ""}
          aria-invalid={hasError("priority")}
          {...(hasError("priority") ? { "aria-describedby": errorId } : {})}
          className={styles.control}
        />
        {hasError("priority") ? (
          <span id={errorId} className={styles.error} role="alert">
            {error?.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={resultId}>{competitionsLabels.resultLabel}</label>
        <TimeInput
          id={resultId}
          name="result"
          value={form.result}
          onChange={(value) => {
            onChange("result", value);
          }}
          placeholder={competitionsLabels.resultPlaceholder}
          disabled={disabled}
          autoComplete="off"
          maxLength={32}
          status={hasError("result") ? "error" : ""}
          aria-invalid={hasError("result")}
          aria-describedby={resultHintId + (hasError("result") ? " " + errorId : "")}
          className={styles.resultInput}
        />
        <span id={resultHintId} className={styles.hint}>
          {competitionsLabels.resultHint}
        </span>
        {hasError("result") ? (
          <span id={errorId} className={styles.error} role="alert">
            {error?.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
