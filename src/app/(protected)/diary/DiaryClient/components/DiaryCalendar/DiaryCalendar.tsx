"use client";

import type { Dayjs } from "dayjs";
import { DownOutlined } from "@ant-design/icons";
import { Badge, Button, Calendar, Skeleton, Spin } from "antd";
import type { CalendarProps } from "antd";
import { useId, useState } from "react";
import { CALENDAR_LABELS } from "../../constants/diaryConstants";
import type { DiaryDayMap } from "../../types/diaryTypes";
import { formatDate } from "../../utils/diaryUtils";
import styles from "./DiaryCalendar.module.scss";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const calendarPanelId = useId();
  const calendarTitleId = useId();

  const handleToggle = () => {
    setIsExpanded((currentValue) => !currentValue);
  };

  const handleSelectDate: NonNullable<CalendarProps<Dayjs>["onSelect"]> = (value, info) => {
    onSelectDate(value);
    if (info.source === "date") {
      setIsExpanded(false);
    }
  };

  const panelClassName = [styles.calendarPanel, isExpanded && styles.calendarPanelExpanded]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.calendarCard} aria-labelledby={calendarTitleId} aria-busy={loading}>
      <div className={styles.cardHeader}>
        <div className={styles.headerText}>
          <h2 id={calendarTitleId} className={styles.title}>
            {title}
          </h2>
          {loading ? (
            <span className={styles.loadingIndicator} role="status" aria-live="polite">
              <Spin size="small" aria-hidden />
              <span>{CALENDAR_LABELS.loading}</span>
            </span>
          ) : (
            <Badge
              className={styles.legend}
              status="success"
              text={CALENDAR_LABELS.reportComplete}
            />
          )}
        </div>
        <Button
          type="text"
          className={styles.toggleButton}
          aria-expanded={isExpanded}
          aria-controls={calendarPanelId}
          onClick={handleToggle}
        >
          <span>{isExpanded ? CALENDAR_LABELS.collapse : CALENDAR_LABELS.expand}</span>
          <DownOutlined
            aria-hidden
            className={[styles.toggleIcon, isExpanded && styles.toggleIconExpanded]
              .filter(Boolean)
              .join(" ")}
          />
        </Button>
      </div>
      <div id={calendarPanelId} className={panelClassName}>
        {loading ? (
          <div className={styles.loadingState}>
            <Skeleton active title={false} paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <Calendar
            className={styles.calendar}
            value={selectedDate}
            onSelect={handleSelectDate}
            onPanelChange={onPanelChange}
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

              return (
                <span className={styles.reportMark}>
                  <Badge status="success" />
                  <span className={styles.srOnly}>{CALENDAR_LABELS.reportComplete}</span>
                </span>
              );
            }}
          />
        )}
      </div>
    </section>
  );
}
