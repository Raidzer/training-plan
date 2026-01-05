"use client";

import { Button, Card, Input, InputNumber, Select, Space, Tag, Typography } from "antd";
import type {
  PlanEntry,
  SavingWorkoutsState,
  WorkoutFormState,
} from "../types/diaryTypes";
import { normalizeStartTimeInput } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type WorkoutField =
  | "startTime"
  | "resultText"
  | "distanceKm"
  | "commentText"
  | "overallScore"
  | "functionalScore"
  | "muscleScore"
  | "weather"
  | "hasWind"
  | "temperatureC"
  | "surface";

type WorkoutsCardProps = {
  title: string;
  emptyLabel: string;
  completeLabel: string;
  incompleteLabel: string;
  startTimePlaceholder: string;
  resultPlaceholder: string;
  distancePlaceholder: string;
  overallScoreLabel: string;
  functionalScoreLabel: string;
  muscleScoreLabel: string;
  scorePlaceholder: string;
  surfacePlaceholder: string;
  weatherPlaceholder: string;
  windPlaceholder: string;
  temperaturePlaceholder: string;
  commentPlaceholder: string;
  saveReportLabel: string;
  surfaceOptions: readonly { value: string; label: string }[];
  weatherOptions: readonly { value: string; label: string }[];
  windOptions: readonly { value: string; label: string }[];
  entries: PlanEntry[];
  workoutForm: WorkoutFormState;
  savingWorkouts: SavingWorkoutsState;
  onChange: (entryId: number, field: WorkoutField, value: string | number | null) => void;
  onSave: (entryId: number) => void;
};

const normalizeOptions = (
  options: readonly { value: string; label: string }[]
) => options.map((option) => ({ value: option.value, label: option.label }));

export function WorkoutsCard({
  title,
  emptyLabel,
  completeLabel,
  incompleteLabel,
  startTimePlaceholder,
  resultPlaceholder,
  distancePlaceholder,
  overallScoreLabel,
  functionalScoreLabel,
  muscleScoreLabel,
  scorePlaceholder,
  surfacePlaceholder,
  weatherPlaceholder,
  windPlaceholder,
  temperaturePlaceholder,
  commentPlaceholder,
  saveReportLabel,
  surfaceOptions,
  weatherOptions,
  windOptions,
  entries,
  workoutForm,
  savingWorkouts,
  onChange,
  onSave,
}: WorkoutsCardProps) {
  const normalizedSurfaceOptions = normalizeOptions(surfaceOptions);
  const normalizedWeatherOptions = normalizeOptions(weatherOptions);
  const normalizedWindOptions = normalizeOptions(windOptions);

  return (
    <Card type="inner" title={title}>
      {entries.length ? (
        <Space orientation="vertical" size="middle">
          {entries.map((entry) => {
            const form = workoutForm[entry.id];
            const isManezh = form?.surface === "manezh";
            const surfaceValue = form?.surface ? form.surface : null;
            const weatherValue = form?.weather ? form.weather : null;
            const windValue = form?.hasWind ? form.hasWind : null;
            const isComplete =
              Boolean(form?.resultText?.trim()) &&
              Boolean(form?.commentText?.trim());
            return (
              <div key={entry.id} className={styles.workoutItem}>
                <div className={styles.workoutHeader}>
                  <div>
                    <Typography.Text strong>
                      {entry.sessionOrder}. {entry.taskText}
                    </Typography.Text>
                    {entry.commentText ? (
                      <Typography.Paragraph
                        type="secondary"
                        className={styles.paragraphTight}
                      >
                        {entry.commentText}
                      </Typography.Paragraph>
                    ) : null}
                  </div>
                  <Tag color={isComplete ? "green" : "default"}>
                    {isComplete ? completeLabel : incompleteLabel}
                  </Tag>
                </div>
                <div className={styles.workoutInputs}>
                  <Input
                    value={form?.startTime ?? ""}
                    maxLength={5}
                    placeholder={startTimePlaceholder}
                    onChange={(event) =>
                      onChange(
                        entry.id,
                        "startTime",
                        normalizeStartTimeInput(event.target.value)
                      )
                    }
                  />
                  <Input.TextArea
                    value={form?.resultText ?? ""}
                    autoSize={{ minRows: 4, maxRows: 12 }}
                    placeholder={resultPlaceholder}
                    onChange={(event) =>
                      onChange(entry.id, "resultText", event.target.value)
                    }
                  />
                  <Input
                    value={form?.distanceKm ?? ""}
                    placeholder={distancePlaceholder}
                    onChange={(event) =>
                      onChange(entry.id, "distanceKm", event.target.value)
                    }
                  />
                  <div className={styles.workoutScores}>
                    <div className={styles.workoutScoreField}>
                      <Typography.Text>{overallScoreLabel}</Typography.Text>
                      <InputNumber
                        className={styles.workoutScoreInput}
                        min={1}
                        max={10}
                        step={1}
                        precision={0}
                        placeholder={scorePlaceholder}
                        value={form?.overallScore ?? null}
                        onChange={(value) =>
                          onChange(entry.id, "overallScore", value)
                        }
                      />
                    </div>
                    <div className={styles.workoutScoreField}>
                      <Typography.Text>{functionalScoreLabel}</Typography.Text>
                      <InputNumber
                        className={styles.workoutScoreInput}
                        min={1}
                        max={10}
                        step={1}
                        precision={0}
                        placeholder={scorePlaceholder}
                        value={form?.functionalScore ?? null}
                        onChange={(value) =>
                          onChange(entry.id, "functionalScore", value)
                        }
                      />
                    </div>
                    <div className={styles.workoutScoreField}>
                      <Typography.Text>{muscleScoreLabel}</Typography.Text>
                      <InputNumber
                        className={styles.workoutScoreInput}
                        min={1}
                        max={10}
                        step={1}
                        precision={0}
                        placeholder={scorePlaceholder}
                        value={form?.muscleScore ?? null}
                        onChange={(value) =>
                          onChange(entry.id, "muscleScore", value)
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.workoutMetaGrid}>
                    <Select<string | null>
                      value={surfaceValue}
                      placeholder={surfacePlaceholder}
                      options={normalizedSurfaceOptions}
                      allowClear
                      onChange={(value) =>
                        onChange(entry.id, "surface", value ?? "")
                      }
                    />
                    {isManezh ? null : (
                      <>
                        <Select<string | null>
                          value={weatherValue}
                          placeholder={weatherPlaceholder}
                          options={normalizedWeatherOptions}
                          allowClear
                          onChange={(value) =>
                            onChange(entry.id, "weather", value ?? "")
                          }
                        />
                        <Select<string | null>
                          value={windValue}
                          placeholder={windPlaceholder}
                          options={normalizedWindOptions}
                          allowClear
                          onChange={(value) =>
                            onChange(entry.id, "hasWind", value ?? "")
                          }
                        />
                        <Input
                          value={form?.temperatureC ?? ""}
                          placeholder={temperaturePlaceholder}
                          onChange={(event) =>
                            onChange(
                              entry.id,
                              "temperatureC",
                              event.target.value
                            )
                          }
                        />
                      </>
                    )}
                  </div>
                  <Input.TextArea
                    value={form?.commentText ?? ""}
                    autoSize={{ minRows: 3, maxRows: 10 }}
                    placeholder={commentPlaceholder}
                    onChange={(event) =>
                      onChange(entry.id, "commentText", event.target.value)
                    }
                  />
                </div>
                <div className={styles.workoutActions}>
                  <Button
                    type="primary"
                    loading={savingWorkouts[entry.id]}
                    onClick={() => onSave(entry.id)}
                  >
                    {saveReportLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </Space>
      ) : (
        <Typography.Text type="secondary">{emptyLabel}</Typography.Text>
      )}
    </Card>
  );
}
