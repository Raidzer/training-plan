"use client";

import type { FormEvent } from "react";
import { AutoComplete, Button, Collapse, Input, InputNumber, Select, Tag, Tooltip } from "antd";
import {
  BuildOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { PlanEntry, WorkoutFormEntry } from "../../types/diaryTypes";
import { WORKOUT_LABELS } from "../../constants/diaryConstants";
import { normalizeStartTimeInput } from "../../utils/diaryUtils";
import { WorkoutShoesFieldset } from "../WorkoutShoesFieldset/WorkoutShoesFieldset";
import type { ShoeOption, TextOption, WorkoutField } from "./WorkoutReportCard.types";
import styles from "./WorkoutReportCard.module.scss";

type WorkoutReportCardProps = {
  entry: PlanEntry;
  form: WorkoutFormEntry | undefined;
  saving: boolean;
  completeLabel: string;
  incompleteLabel: string;
  startTimeLabel: string;
  resultLabel: string;
  distanceLabel: string;
  overallScoreLabel: string;
  functionalScoreLabel: string;
  muscleScoreLabel: string;
  scorePlaceholder: string;
  surfaceLabel: string;
  shoeLabel: string;
  shoeMileageLabel: string;
  weatherLabel: string;
  windLabel: string;
  temperatureLabel: string;
  commentLabel: string;
  saveReportLabel: string;
  editWorkoutLabel?: string | undefined;
  surfaceOptions: readonly TextOption[];
  shoeOptions: readonly ShoeOption[];
  weatherOptions: readonly TextOption[];
  windOptions: readonly TextOption[];
  shoeLoading: boolean;
  onChange: (
    entryId: number,
    field: WorkoutField,
    value: string | number | number[] | Record<number, string> | null
  ) => void;
  onSave: (entryId: number) => void;
  onOpenConstructor: (entryId: number, taskText: string) => void;
  onEditWorkout?: ((entryId: number) => void) | undefined;
};

const INDOOR_SURFACES = new Set(["manezh", "treadmill", "Манеж", "Беговая дорожка"]);

const getDisplayValue = (value: string | null, options: readonly TextOption[]) => {
  if (!value) {
    return "";
  }

  const matchingOption = options.find((option) => option.value === value);
  return matchingOption?.label ?? value;
};

const getAutocompleteOptions = (options: readonly TextOption[]) =>
  options.map((option) => ({ value: option.label, label: option.label }));

const getPlainText = (html: string) => html.replace(/<[^>]*>?/gm, "");

const filterOption = (inputValue: string, option?: { label?: string }) =>
  (option?.label ?? "").toLocaleUpperCase().includes(inputValue.toLocaleUpperCase());

export function WorkoutReportCard({
  entry,
  form,
  saving,
  completeLabel,
  incompleteLabel,
  startTimeLabel,
  resultLabel,
  distanceLabel,
  overallScoreLabel,
  functionalScoreLabel,
  muscleScoreLabel,
  scorePlaceholder,
  surfaceLabel,
  shoeLabel,
  shoeMileageLabel,
  weatherLabel,
  windLabel,
  temperatureLabel,
  commentLabel,
  saveReportLabel,
  editWorkoutLabel,
  surfaceOptions,
  shoeOptions,
  weatherOptions,
  windOptions,
  shoeLoading,
  onChange,
  onSave,
  onOpenConstructor,
  onEditWorkout,
}: WorkoutReportCardProps) {
  const fieldPrefix = `workout-${entry.id}`;
  const titleId = `${fieldPrefix}-title`;
  const isComplete = Boolean(form?.resultText?.trim()) && Boolean(form?.commentText?.trim());
  const isIndoorSurface = INDOOR_SURFACES.has(form?.surface ?? "");
  const selectedShoeIds = Array.isArray(form?.shoeIds) ? form.shoeIds : [];
  const shoeMileageKm = form?.shoeMileageKm ?? {};
  const surfaceValue = form?.surface ?? null;
  const weatherValue = form?.weather ?? null;
  const windValue = form?.hasWind ?? null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(entry.id);
  };

  const assessmentContent = (
    <div className={styles.scoresGrid}>
      <div className={styles.field}>
        <label htmlFor={`${fieldPrefix}-overallScore`} className={styles.label}>
          {overallScoreLabel}
        </label>
        <InputNumber
          id={`${fieldPrefix}-overallScore`}
          name={`${fieldPrefix}-overallScore`}
          min={1}
          max={10}
          step={1}
          precision={0}
          placeholder={scorePlaceholder}
          value={form?.overallScore ?? null}
          onChange={(value) => onChange(entry.id, "overallScore", value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${fieldPrefix}-functionalScore`} className={styles.label}>
          {functionalScoreLabel}
        </label>
        <InputNumber
          id={`${fieldPrefix}-functionalScore`}
          name={`${fieldPrefix}-functionalScore`}
          min={1}
          max={10}
          step={1}
          precision={0}
          placeholder={scorePlaceholder}
          value={form?.functionalScore ?? null}
          onChange={(value) => onChange(entry.id, "functionalScore", value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${fieldPrefix}-muscleScore`} className={styles.label}>
          {muscleScoreLabel}
        </label>
        <InputNumber
          id={`${fieldPrefix}-muscleScore`}
          name={`${fieldPrefix}-muscleScore`}
          min={1}
          max={10}
          step={1}
          precision={0}
          placeholder={scorePlaceholder}
          value={form?.muscleScore ?? null}
          onChange={(value) => onChange(entry.id, "muscleScore", value)}
        />
      </div>
    </div>
  );

  const conditionsContent = (
    <div className={styles.conditionsStack}>
      <div className={styles.conditionsGrid}>
        <div className={styles.field}>
          <label htmlFor={`${fieldPrefix}-surface`} className={styles.label}>
            {surfaceLabel}
          </label>
          <AutoComplete
            id={`${fieldPrefix}-surface`}
            value={getDisplayValue(surfaceValue, surfaceOptions)}
            placeholder={surfaceLabel}
            options={getAutocompleteOptions(surfaceOptions)}
            allowClear
            onChange={(value: string) => onChange(entry.id, "surface", value)}
            filterOption={filterOption}
          />
          <input type="hidden" name={`${fieldPrefix}-surface`} value={surfaceValue ?? ""} />
        </div>

        {isIndoorSurface ? null : (
          <>
            <div className={styles.field}>
              <label htmlFor={`${fieldPrefix}-weather`} className={styles.label}>
                {weatherLabel}
              </label>
              <AutoComplete
                id={`${fieldPrefix}-weather`}
                value={getDisplayValue(weatherValue, weatherOptions)}
                placeholder={weatherLabel}
                options={getAutocompleteOptions(weatherOptions)}
                allowClear
                onChange={(value: string) => onChange(entry.id, "weather", value)}
                filterOption={filterOption}
              />
              <input type="hidden" name={`${fieldPrefix}-weather`} value={weatherValue ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldPrefix}-wind`} className={styles.label}>
                {windLabel}
              </label>
              <Select<string | null>
                id={`${fieldPrefix}-wind`}
                value={windValue}
                placeholder={windLabel}
                options={windOptions.map((option) => ({ ...option }))}
                allowClear
                onChange={(value) => onChange(entry.id, "hasWind", value ?? "")}
              />
              <input type="hidden" name={`${fieldPrefix}-wind`} value={windValue ?? ""} />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldPrefix}-temperature`} className={styles.label}>
                {temperatureLabel}
              </label>
              <Input
                id={`${fieldPrefix}-temperature`}
                name={`${fieldPrefix}-temperature`}
                value={form?.temperatureC ?? ""}
                inputMode="decimal"
                placeholder={temperatureLabel}
                onChange={(event) => onChange(entry.id, "temperatureC", event.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <WorkoutShoesFieldset
        fieldPrefix={fieldPrefix}
        selectedShoeIds={selectedShoeIds}
        shoeMileageKm={shoeMileageKm}
        shoeOptions={shoeOptions}
        shoeLoading={shoeLoading}
        shoeLabel={shoeLabel}
        shoeMileageLabel={shoeMileageLabel}
        onShoeIdsChange={(value) => onChange(entry.id, "shoeIds", value)}
        onMileageChange={(shoeId, value) =>
          onChange(entry.id, "shoeMileageKm", {
            ...shoeMileageKm,
            [shoeId]: value,
          })
        }
      />
    </div>
  );

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <div className={styles.taskBlock}>
            <h4 id={titleId} className={styles.taskTitle}>
              <span
                className={styles.multilineText}
                dangerouslySetInnerHTML={{ __html: entry.taskText }}
              />
            </h4>
            {entry.commentText ? (
              <div className={styles.coachComment}>
                <span className={styles.coachCommentLabel}>{WORKOUT_LABELS.coachCommentLabel}</span>
                <span
                  className={styles.multilineText}
                  dangerouslySetInnerHTML={{ __html: entry.commentText }}
                />
              </div>
            ) : null}
          </div>

          <div className={styles.headerActions}>
            {onEditWorkout && editWorkoutLabel ? (
              <Tooltip title={editWorkoutLabel}>
                <Button
                  aria-label={`${editWorkoutLabel} ${entry.sessionOrder}`}
                  icon={<EditOutlined />}
                  type="text"
                  htmlType="button"
                  className={styles.iconButton}
                  onClick={() => onEditWorkout(entry.id)}
                />
              </Tooltip>
            ) : null}
            <Tag className={styles.statusTag}>
              {isComplete ? (
                <CheckCircleOutlined aria-hidden />
              ) : (
                <ClockCircleOutlined aria-hidden />
              )}
              <span>{isComplete ? completeLabel : incompleteLabel}</span>
            </Tag>
          </div>
        </header>

        <div className={styles.primaryFields}>
          <div className={styles.compactGrid}>
            <div className={styles.field}>
              <label htmlFor={`${fieldPrefix}-startTime`} className={styles.label}>
                {startTimeLabel}
              </label>
              <Input
                id={`${fieldPrefix}-startTime`}
                name={`${fieldPrefix}-startTime`}
                value={form?.startTime ?? ""}
                maxLength={5}
                placeholder={startTimeLabel}
                onChange={(event) =>
                  onChange(entry.id, "startTime", normalizeStartTimeInput(event.target.value))
                }
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldPrefix}-distance`} className={styles.label}>
                {distanceLabel}
              </label>
              <Input
                id={`${fieldPrefix}-distance`}
                name={`${fieldPrefix}-distance`}
                value={form?.distanceKm ?? ""}
                inputMode="decimal"
                placeholder={distanceLabel}
                onChange={(event) => onChange(entry.id, "distanceKm", event.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor={`${fieldPrefix}-result`} className={styles.label}>
                {resultLabel}
              </label>
              <Tooltip title={WORKOUT_LABELS.constructorLabel}>
                <Button
                  aria-label={WORKOUT_LABELS.constructorLabel}
                  icon={<BuildOutlined />}
                  type="text"
                  htmlType="button"
                  className={styles.iconButton}
                  onClick={() => onOpenConstructor(entry.id, getPlainText(entry.taskText))}
                />
              </Tooltip>
            </div>
            <Input.TextArea
              id={`${fieldPrefix}-result`}
              name={`${fieldPrefix}-result`}
              value={form?.resultText ?? ""}
              autoSize={{ minRows: 4, maxRows: 12 }}
              placeholder={resultLabel}
              onChange={(event) => onChange(entry.id, "resultText", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${fieldPrefix}-comment`} className={styles.label}>
              {commentLabel}
            </label>
            <Input.TextArea
              id={`${fieldPrefix}-comment`}
              name={`${fieldPrefix}-comment`}
              value={form?.commentText ?? ""}
              autoSize={{ minRows: 3, maxRows: 10 }}
              placeholder={commentLabel}
              onChange={(event) => onChange(entry.id, "commentText", event.target.value)}
            />
          </div>
        </div>

        <Collapse
          className={styles.collapse}
          ghost
          items={[
            {
              key: "assessment",
              label: WORKOUT_LABELS.assessmentSectionLabel,
              children: assessmentContent,
            },
            {
              key: "conditions",
              label: WORKOUT_LABELS.conditionsSectionLabel,
              children: conditionsContent,
            },
          ]}
        />

        <div className={styles.actions}>
          <Button type="primary" htmlType="submit" loading={saving}>
            {saveReportLabel}
          </Button>
        </div>
      </form>
    </article>
  );
}
