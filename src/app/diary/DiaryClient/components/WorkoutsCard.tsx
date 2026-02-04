"use client";

import { useState } from "react";
import {
  AutoComplete,
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { BuildOutlined } from "@ant-design/icons";
import type { MessageInstance } from "antd/es/message/interface";
import type { PlanEntry, SavingWorkoutsState, WorkoutFormState } from "../types/diaryTypes";
import { normalizeStartTimeInput } from "../utils/diaryUtils";
import { TemplateConstructorModal } from "@/components/templates/TemplateConstructorModal";
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
  | "surface"
  | "shoeIds";

type WorkoutsCardProps = {
  userId: number;
  messageApi: MessageInstance;
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
  shoePlaceholder: string;
  weatherPlaceholder: string;
  windPlaceholder: string;
  temperaturePlaceholder: string;
  commentPlaceholder: string;
  saveReportLabel: string;
  surfaceOptions: readonly { value: string; label: string }[];
  shoeOptions: readonly { value: number; label: string }[];
  weatherOptions: readonly { value: string; label: string }[];
  windOptions: readonly { value: string; label: string }[];
  shoeLoading: boolean;
  entries: PlanEntry[];
  workoutForm: WorkoutFormState;
  savingWorkouts: SavingWorkoutsState;
  onChange: (
    entryId: number,
    field: WorkoutField,
    value: string | number | number[] | null
  ) => void;
  onSave: (entryId: number) => void;
};

const normalizeOptions = (options: readonly { value: string | number; label: string }[]) =>
  options.map((option) => ({ value: option.value, label: option.label }));

export function WorkoutsCard({
  userId,
  messageApi,
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
  shoePlaceholder,
  weatherPlaceholder,
  windPlaceholder,
  temperaturePlaceholder,
  commentPlaceholder,
  saveReportLabel,
  surfaceOptions,
  shoeOptions,
  weatherOptions,
  windOptions,
  shoeLoading,
  entries,
  workoutForm,
  savingWorkouts,
  onChange,
  onSave,
}: WorkoutsCardProps) {
  const getDisplayValue = (
    val: string | null | undefined,
    opts: readonly { value: string | number; label: string }[]
  ) => {
    if (!val) return "";
    const match = opts.find((o) => o.value === val);
    return match ? match.label : val;
  };

  const surfaceOptionsAC = surfaceOptions.map((o) => ({ value: o.label, label: o.label }));
  const weatherOptionsAC = weatherOptions.map((o) => ({ value: o.label, label: o.label }));

  const normalizedShoeOptions = normalizeOptions(shoeOptions);
  const normalizedWindOptions = normalizeOptions(windOptions);

  const [constructorState, setConstructorState] = useState<{
    visible: boolean;
    entryId: number | null;
    taskText: string;
  }>({
    visible: false,
    entryId: null,
    taskText: "",
  });

  const openConstructor = (entryId: number, taskText: string) => {
    setConstructorState({
      visible: true,
      entryId,
      taskText,
    });
  };

  const closeConstructor = () => {
    setConstructorState((prev) => ({ ...prev, visible: false }));
  };

  const applyConstructorResult = (resultText: string) => {
    if (constructorState.entryId !== null) {
      onChange(constructorState.entryId, "resultText", resultText);
    }
    closeConstructor();
  };

  return (
    <Card type="inner" title={title}>
      {entries.length ? (
        <Space orientation="vertical" size="middle" className={styles.workoutList}>
          {entries.map((entry) => {
            const form = workoutForm[entry.id];

            const surfaceVal = form?.surface;
            const isIndoorSurface =
              surfaceVal === "manezh" ||
              surfaceVal === "treadmill" ||
              surfaceVal === "Манеж" ||
              surfaceVal === "Беговая дорожка";

            const surfaceValue = form?.surface ? form.surface : null;
            const shoeValue = Array.isArray(form?.shoeIds) ? form.shoeIds : [];
            const weatherValue = form?.weather ? form.weather : null;
            const windValue = form?.hasWind ? form.hasWind : null;
            const isComplete =
              Boolean(form?.resultText?.trim()) && Boolean(form?.commentText?.trim());

            // Strip HTML from task text for matching logic, but keep it for display if needed
            // Actually findMatchingTemplate expects plain text ideally
            const rawTaskText = entry.taskText.replace(/<[^>]*>?/gm, "");

            return (
              <div key={entry.id} className={styles.workoutItem}>
                <div className={styles.workoutHeader}>
                  <div>
                    <Typography.Text strong>
                      {entry.sessionOrder}.{" "}
                      <span
                        className={styles.multilineText}
                        dangerouslySetInnerHTML={{ __html: entry.taskText }}
                      />
                    </Typography.Text>
                    {entry.commentText ? (
                      <Typography.Paragraph type="secondary" className={styles.commentParagraph}>
                        <span
                          className={styles.multilineText}
                          dangerouslySetInnerHTML={{ __html: entry.commentText }}
                        />
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
                      onChange(entry.id, "startTime", normalizeStartTimeInput(event.target.value))
                    }
                  />
                  <div style={{ position: "relative" }}>
                    <Input.TextArea
                      value={form?.resultText ?? ""}
                      autoSize={{ minRows: 4, maxRows: 12 }}
                      placeholder={resultPlaceholder}
                      onChange={(event) => onChange(entry.id, "resultText", event.target.value)}
                      style={{ paddingRight: 40 }}
                    />
                    <Tooltip title="Конструктор отчета">
                      <Button
                        icon={<BuildOutlined />}
                        size="small"
                        type="text"
                        style={{ position: "absolute", top: 8, right: 8, zIndex: 1, opacity: 0.6 }}
                        onClick={() => openConstructor(entry.id, rawTaskText)}
                      />
                    </Tooltip>
                  </div>
                  <Input
                    value={form?.distanceKm ?? ""}
                    placeholder={distancePlaceholder}
                    onChange={(event) => onChange(entry.id, "distanceKm", event.target.value)}
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
                        onChange={(value) => onChange(entry.id, "overallScore", value)}
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
                        onChange={(value) => onChange(entry.id, "functionalScore", value)}
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
                        onChange={(value) => onChange(entry.id, "muscleScore", value)}
                      />
                    </div>
                  </div>
                  <div className={styles.workoutMetaGrid}>
                    <AutoComplete
                      value={getDisplayValue(surfaceValue, surfaceOptions)}
                      placeholder={surfacePlaceholder}
                      options={surfaceOptionsAC}
                      allowClear
                      onChange={(value: string) => onChange(entry.id, "surface", value)}
                      filterOption={(inputValue, option) =>
                        (option?.label ?? "").toUpperCase().includes(inputValue.toUpperCase())
                      }
                    />
                    <Select
                      mode="multiple"
                      value={shoeValue}
                      placeholder={shoePlaceholder}
                      options={normalizedShoeOptions}
                      allowClear
                      loading={shoeLoading}
                      onChange={(value) => onChange(entry.id, "shoeIds", value ?? [])}
                    />
                    {isIndoorSurface ? null : (
                      <>
                        <AutoComplete
                          value={getDisplayValue(weatherValue, weatherOptions)}
                          placeholder={weatherPlaceholder}
                          options={weatherOptionsAC}
                          allowClear
                          onChange={(value: string) => onChange(entry.id, "weather", value)}
                          filterOption={(inputValue, option) =>
                            (option?.label ?? "").toUpperCase().includes(inputValue.toUpperCase())
                          }
                        />
                        <Select<string | null>
                          value={windValue}
                          placeholder={windPlaceholder}
                          options={normalizedWindOptions}
                          allowClear
                          onChange={(value) => onChange(entry.id, "hasWind", value ?? "")}
                        />
                        <Input
                          value={form?.temperatureC ?? ""}
                          placeholder={temperaturePlaceholder}
                          onChange={(event) =>
                            onChange(entry.id, "temperatureC", event.target.value)
                          }
                        />
                      </>
                    )}
                  </div>
                  <Input.TextArea
                    value={form?.commentText ?? ""}
                    autoSize={{ minRows: 3, maxRows: 10 }}
                    placeholder={commentPlaceholder}
                    onChange={(event) => onChange(entry.id, "commentText", event.target.value)}
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

      <TemplateConstructorModal
        visible={constructorState.visible}
        onCancel={closeConstructor}
        onApply={applyConstructorResult}
        taskText={constructorState.taskText}
        userId={userId}
        messageApi={messageApi}
      />
    </Card>
  );
}
