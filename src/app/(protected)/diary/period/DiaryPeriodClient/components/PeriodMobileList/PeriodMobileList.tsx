"use client";

import { PeriodDayCard } from "../PeriodDayCard/PeriodDayCard";
import type { DayStatus } from "../../types/periodTypes";
import styles from "./PeriodMobileList.module.scss";

type PeriodMobileListProps = {
  days: DayStatus[];
};

export function PeriodMobileList({ days }: PeriodMobileListProps) {
  return (
    <div className={styles.mobilePeriodList}>
      {days.map((day) => (
        <PeriodDayCard key={day.date} day={day} />
      ))}
    </div>
  );
}
