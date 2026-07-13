import { BookOutlined, EditOutlined, SwapOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import Link from "next/link";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDayEntry } from "../../types/planTypes";
import { getPlanDateParts } from "../../utils/planUtils";
import { MicrocycleMarker } from "../MicrocycleMarker/MicrocycleMarker";
import { PlanStatusBadge } from "../PlanStatusBadge/PlanStatusBadge";
import { PlanWorkoutBlock } from "../PlanWorkoutBlock/PlanWorkoutBlock";
import styles from "./PlanDayCard.module.scss";

type PlanDayCardProps = {
  entry: PlanDayEntry;
  isToday: boolean;
  onEditDay: (date: string) => void;
  onShiftPlanFromDate: (date: string) => void;
};

export function PlanDayCard({ entry, isToday, onEditDay, onShiftPlanFromDate }: PlanDayCardProps) {
  const dateParts = getPlanDateParts(entry.date);
  const className = [
    styles.card,
    entry.isWorkload ? styles.workloadCard : "",
    isToday ? styles.todayCard : "",
  ]
    .filter(Boolean)
    .join(" ");
  const reportValue = entry.reportedWorkoutCount + "/" + entry.workoutCount;
  const shiftTooltip = entry.hasAnyReport
    ? PLAN_TEXT.table.shiftDisabledTooltip
    : PLAN_TEXT.table.shiftTooltip;

  return (
    <article className={className} data-plan-entry-key={entry.date}>
      <header className={styles.cardHeader}>
        <div className={styles.markerBlock}>
          <MicrocycleMarker
            activeDayIndex={dateParts.weekdayIndex}
            isToday={isToday}
            isWorkload={entry.isWorkload}
          />
        </div>

        <div className={styles.dateBlock}>
          <h3 className={styles.dateHeading}>
            <time dateTime={entry.date} aria-current={isToday ? "date" : undefined}>
              <span className={styles.dateLabel}>{dateParts.dateLabel}</span>
              <span className={styles.dateMeta}>
                {dateParts.weekdayLabel}, {dateParts.yearLabel}
              </span>
            </time>
          </h3>
        </div>

        <div className={styles.statuses} aria-label="Статусы дня">
          {isToday ? <PlanStatusBadge value={PLAN_TEXT.day.today} emphasized /> : null}
          {entry.isWorkload ? <PlanStatusBadge value={PLAN_TEXT.day.workload} /> : null}
          <PlanStatusBadge
            label={PLAN_TEXT.day.reports}
            value={reportValue}
            emphasized={entry.hasAllReports}
          />
        </div>
      </header>

      <div className={styles.workouts}>
        {entry.workouts.map((workout, index) => (
          <PlanWorkoutBlock
            key={workout.id}
            workout={workout}
            index={index}
            workoutsCount={entry.workoutCount}
          />
        ))}
      </div>

      <footer className={styles.actions} role="group" aria-label={"Действия на " + entry.date}>
        <Button
          className={styles.actionButton}
          icon={<EditOutlined aria-hidden />}
          onClick={() => {
            onEditDay(entry.date);
          }}
          aria-label={PLAN_TEXT.table.editAria(entry.date)}
        >
          {PLAN_TEXT.day.editAction}
        </Button>

        <Tooltip title={shiftTooltip}>
          <span className={styles.actionControl}>
            <Button
              className={styles.actionButton}
              icon={<SwapOutlined aria-hidden />}
              onClick={() => {
                onShiftPlanFromDate(entry.date);
              }}
              disabled={entry.hasAnyReport}
              aria-label={PLAN_TEXT.table.shiftAria(entry.date)}
            >
              {PLAN_TEXT.day.shiftAction}
            </Button>
          </span>
        </Tooltip>

        <Link
          href={"/diary?date=" + entry.date}
          className={styles.diaryLink}
          aria-label={PLAN_TEXT.table.diaryAria(entry.date)}
        >
          <BookOutlined aria-hidden />
          <span>{PLAN_TEXT.day.diaryAction}</span>
        </Link>
      </footer>
    </article>
  );
}
