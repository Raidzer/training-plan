import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDayWorkout } from "../../types/planTypes";
import styles from "./PlanWorkoutBlock.module.scss";

type PlanWorkoutBlockProps = {
  workout: PlanDayWorkout;
  index: number;
  workoutsCount: number;
};

export function PlanWorkoutBlock({ workout, index, workoutsCount }: PlanWorkoutBlockProps) {
  const workoutLabel = PLAN_TEXT.day.workoutLabel(index + 1);
  const hasMultipleWorkouts = workoutsCount > 1;
  const reportClassName = [styles.reportStatus, workout.hasReport ? styles.reportComplete : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.workout} aria-label={workoutLabel}>
      <header className={styles.header}>
        {hasMultipleWorkouts ? (
          <h3 className={styles.title}>{workoutLabel}</h3>
        ) : (
          <span className={styles.visuallyHidden}>{workoutLabel}</span>
        )}
        <span className={reportClassName}>
          {workout.hasReport ? (
            <CheckCircleOutlined aria-hidden />
          ) : (
            <ClockCircleOutlined aria-hidden />
          )}
          <span>
            {workout.hasReport ? PLAN_TEXT.day.reportFilled : PLAN_TEXT.day.reportMissing}
          </span>
        </span>
      </header>

      <div className={styles.content}>
        <div className={styles.field}>
          <span className={styles.label}>{PLAN_TEXT.day.task}</span>
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: workout.taskText }} />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{PLAN_TEXT.day.comment}</span>
          {workout.commentText ? (
            <div
              className={styles.richText}
              dangerouslySetInnerHTML={{ __html: workout.commentText }}
            />
          ) : (
            <span className={styles.emptyComment}>{PLAN_TEXT.day.noComment}</span>
          )}
        </div>
      </div>
    </section>
  );
}
