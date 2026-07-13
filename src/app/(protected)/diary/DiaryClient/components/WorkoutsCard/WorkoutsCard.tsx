"use client";

import { useState } from "react";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Tabs, Typography } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { WORKOUT_LABELS } from "../../constants/diaryConstants";
import type {
  PlanEntry,
  SavingWorkoutsState,
  WorkoutFormEntry,
  WorkoutFormState,
} from "../../types/diaryTypes";
import { TemplateConstructorModal } from "@/components/templates/TemplateConstructorModal";
import { WorkoutReportCard } from "../WorkoutReportCard/WorkoutReportCard";
import type { WorkoutField } from "../WorkoutReportCard/WorkoutReportCard.types";
import styles from "./WorkoutsCard.module.scss";

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
  shoeMileagePlaceholder: string;
  weatherPlaceholder: string;
  windPlaceholder: string;
  temperaturePlaceholder: string;
  commentPlaceholder: string;
  saveReportLabel: string;
  editWorkoutLabel?: string;
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
    value: string | number | number[] | Record<number, string> | null
  ) => void;
  onSave: (entryId: number) => void;
  onEditWorkout?: (entryId: number) => void;
};

type ConstructorState = {
  visible: boolean;
  entryId: number | null;
  taskText: string;
};

const INITIAL_CONSTRUCTOR_STATE: ConstructorState = {
  visible: false,
  entryId: null,
  taskText: "",
};

const isWorkoutComplete = (form: WorkoutFormEntry | undefined) =>
  Boolean(form?.resultText?.trim()) && Boolean(form?.commentText?.trim());

const getWorkoutTabLabel = (
  entry: PlanEntry,
  form: WorkoutFormEntry | undefined,
  completeLabel: string,
  incompleteLabel: string
) => {
  const isComplete = isWorkoutComplete(form);
  const statusLabel = isComplete ? completeLabel : incompleteLabel;

  return (
    <span className={styles.tabLabel}>
      {isComplete ? (
        <CheckCircleOutlined className={styles.tabIcon} aria-hidden />
      ) : (
        <ClockCircleOutlined className={styles.tabIcon} aria-hidden />
      )}
      <span className={styles.tabText}>
        <span className={styles.tabTitle}>
          {WORKOUT_LABELS.sessionLabel} {entry.sessionOrder}
        </span>
        <span className={styles.tabStatus} aria-hidden>
          {statusLabel}
        </span>
        <span className={styles.srOnly}>, {statusLabel}</span>
      </span>
    </span>
  );
};

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
  shoeMileagePlaceholder,
  weatherPlaceholder,
  windPlaceholder,
  temperaturePlaceholder,
  commentPlaceholder,
  saveReportLabel,
  editWorkoutLabel,
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
  onEditWorkout,
}: WorkoutsCardProps) {
  const [constructorState, setConstructorState] =
    useState<ConstructorState>(INITIAL_CONSTRUCTOR_STATE);
  const [activeWorkoutKey, setActiveWorkoutKey] = useState<string | null>(null);

  const openConstructor = (entryId: number, taskText: string) => {
    setConstructorState({
      visible: true,
      entryId,
      taskText,
    });
  };

  const closeConstructor = () => {
    setConstructorState((previousState) => ({ ...previousState, visible: false }));
  };

  const applyConstructorResult = (resultText: string) => {
    if (constructorState.entryId !== null) {
      onChange(constructorState.entryId, "resultText", resultText);
    }

    closeConstructor();
  };

  const workoutItems = entries.map((entry) => {
    const form = workoutForm[entry.id];

    return {
      key: String(entry.id),
      label: getWorkoutTabLabel(entry, form, completeLabel, incompleteLabel),
      children: (
        <WorkoutReportCard
          entry={entry}
          form={form}
          saving={Boolean(savingWorkouts[entry.id])}
          completeLabel={completeLabel}
          incompleteLabel={incompleteLabel}
          startTimeLabel={startTimePlaceholder}
          resultLabel={resultPlaceholder}
          distanceLabel={distancePlaceholder}
          overallScoreLabel={overallScoreLabel}
          functionalScoreLabel={functionalScoreLabel}
          muscleScoreLabel={muscleScoreLabel}
          scorePlaceholder={scorePlaceholder}
          surfaceLabel={surfacePlaceholder}
          shoeLabel={shoePlaceholder}
          shoeMileageLabel={shoeMileagePlaceholder}
          weatherLabel={weatherPlaceholder}
          windLabel={windPlaceholder}
          temperatureLabel={temperaturePlaceholder}
          commentLabel={commentPlaceholder}
          saveReportLabel={saveReportLabel}
          editWorkoutLabel={editWorkoutLabel}
          surfaceOptions={surfaceOptions}
          shoeOptions={shoeOptions}
          weatherOptions={weatherOptions}
          windOptions={windOptions}
          shoeLoading={shoeLoading}
          onChange={onChange}
          onSave={onSave}
          onOpenConstructor={openConstructor}
          onEditWorkout={onEditWorkout}
        />
      ),
    };
  });
  const resolvedActiveWorkoutKey = workoutItems.some((item) => item.key === activeWorkoutKey)
    ? (activeWorkoutKey ?? "")
    : (workoutItems[0]?.key ?? "");

  return (
    <section className={styles.sectionPanel} aria-labelledby="daily-workouts-title">
      <div className={styles.sectionHeader}>
        <h3 id="daily-workouts-title" className={styles.sectionTitle}>
          {title}
        </h3>
      </div>

      {entries.length > 0 ? (
        <Tabs
          className={styles.tabs}
          activeKey={resolvedActiveWorkoutKey}
          destroyOnHidden={false}
          items={workoutItems}
          onChange={setActiveWorkoutKey}
        />
      ) : (
        <Typography.Text type="secondary" className={styles.emptyState}>
          {emptyLabel}
        </Typography.Text>
      )}

      <TemplateConstructorModal
        visible={constructorState.visible}
        onCancel={closeConstructor}
        onApply={applyConstructorResult}
        taskText={constructorState.taskText}
        userId={userId}
        messageApi={messageApi}
      />
    </section>
  );
}
