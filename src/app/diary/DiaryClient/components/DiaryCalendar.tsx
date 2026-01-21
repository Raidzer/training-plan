"use client";

import type { Dayjs } from "dayjs";
import { Calendar, Card } from "antd";
import type { DiaryDayMap } from "../types/diaryTypes";
import { formatDate } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type DiaryCalendarProps = {
  title: string;
  loading: boolean;
  selectedDate: Dayjs;
  marks: DiaryDayMap;
  onSelectDate: (value: Dayjs) => void;
  onPanelChange: (value: Dayjs) => void;
};

export function DiaryCalendar({
  title,
  loading,
  selectedDate,
  marks,
  onSelectDate,
  onPanelChange,
}: DiaryCalendarProps) {
  return (
    <Card title={title} loading={loading} className={styles.calendarCard}>
      <Calendar
        value={selectedDate}
        onSelect={(value) => onSelectDate(value)}
        onPanelChange={(value) => onPanelChange(value)}
        fullscreen={false}
        cellRender={(value, info) => {
          if (info.type !== "date") {
            return null;
          }
          const key = formatDate(value);
          const day = marks[key];
          if (!day?.dayHasReport) {
            return null;
          }
          return <span className={styles.markDot} />;
        }}
      />
    </Card>
  );
}
