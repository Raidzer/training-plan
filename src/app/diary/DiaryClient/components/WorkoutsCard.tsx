"use client";

import { Button, Card, Input, Space, Tag, Typography } from "antd";
import type {
  PlanEntry,
  SavingWorkoutsState,
  WorkoutFormState,
} from "../types/diaryTypes";
import { normalizeStartTimeInput } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type WorkoutField = "startTime" | "resultText" | "distanceKm" | "commentText";

type WorkoutsCardProps = {
  title: string;
  emptyLabel: string;
  completeLabel: string;
  incompleteLabel: string;
  startTimePlaceholder: string;
  resultPlaceholder: string;
  distancePlaceholder: string;
  commentPlaceholder: string;
  saveReportLabel: string;
  entries: PlanEntry[];
  workoutForm: WorkoutFormState;
  savingWorkouts: SavingWorkoutsState;
  onChange: (entryId: number, field: WorkoutField, value: string) => void;
  onSave: (entryId: number) => void;
};

export function WorkoutsCard({
  title,
  emptyLabel,
  completeLabel,
  incompleteLabel,
  startTimePlaceholder,
  resultPlaceholder,
  distancePlaceholder,
  commentPlaceholder,
  saveReportLabel,
  entries,
  workoutForm,
  savingWorkouts,
  onChange,
  onSave,
}: WorkoutsCardProps) {
  return (
    <Card type="inner" title={title}>
      {entries.length ? (
        <Space orientation="vertical" size="middle">
          {entries.map((entry) => {
            const form = workoutForm[entry.id];
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
