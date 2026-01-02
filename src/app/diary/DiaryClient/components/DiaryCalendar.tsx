"use client";

import type { Dayjs } from "dayjs";
import { Button, Calendar, Card, Divider, Space } from "antd";
import type { DiaryDayMap } from "../types/diaryTypes";
import { formatDate } from "../utils/diaryUtils";
import styles from "../diary.module.scss";

type QuickAction = {
  label: string;
  action: () => void;
};

type DiaryCalendarProps = {
  title: string;
  loading: boolean;
  selectedDate: Dayjs;
  marks: DiaryDayMap;
  quickActions: QuickAction[];
  onSelectDate: (value: Dayjs) => void;
  onPanelChange: (value: Dayjs) => void;
};

export function DiaryCalendar({
  title,
  loading,
  selectedDate,
  marks,
  quickActions,
  onSelectDate,
  onPanelChange,
}: DiaryCalendarProps) {
  return (
    <Card title={title} loading={loading} className={styles.calendarCard}>
      <Space size="small" wrap className={styles.quickActions}>
        {quickActions.map((item) => (
          <Button key={item.label} size="small" onClick={item.action}>
            {item.label}
          </Button>
        ))}
      </Space>
      <Divider className={styles.dividerTight} />
      <Calendar
        value={selectedDate}
        onSelect={(value) => onSelectDate(value)}
        onPanelChange={(value) => onPanelChange(value)}
        fullscreen={false}
        cellRender={(value, info) => {
          if (info.type !== "date") {
            return info.originNode;
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
