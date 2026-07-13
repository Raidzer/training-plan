"use client";

import { PeriodDayCard } from "../PeriodDayCard/PeriodDayCard";
import type { DayStatus } from "../../types/periodTypes";
import styles from "./PeriodMobileList.module.scss";

type PeriodMobileListProps = {
  days: DayStatus[];
};

export function PeriodMobileList({ days }: PeriodMobileListProps) {
  return (
    <ul className={styles.mobilePeriodList} role="list">
      {days.map((day) => (
        <li className={styles.item} key={day.date}>
          <PeriodDayCard day={day} />
        </li>
      ))}
    </ul>
  );
}
