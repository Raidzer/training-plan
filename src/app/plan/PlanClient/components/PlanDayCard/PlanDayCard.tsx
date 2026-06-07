import { BookOutlined, CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Tag, Tooltip } from "antd";
import Link from "next/link";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDayEntry } from "../../types/planTypes";
import { formatDateWithWeekday } from "../../utils/planUtils";
import styles from "./PlanDayCard.module.scss";

type PlanDayCardProps = {
  entry: PlanDayEntry;
  isToday: boolean;
  onEditDay: (date: string) => void;
};

export function PlanDayCard({ entry, isToday, onEditDay }: PlanDayCardProps) {
  const className = [
    styles.mobileDayCard,
    entry.isWorkload ? styles.mobileWorkloadCard : "",
    isToday ? styles.mobileTodayCard : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-plan-entry-key={entry.date}>
      <div className={styles.mobileDayHeader}>
        <div className={styles.mobileDayTitle}>
          <span className={styles.mobileDate}>{formatDateWithWeekday(entry.date)}</span>
          <div className={styles.mobileTags}>
            {isToday ? <Tag color="blue">{PLAN_TEXT.table.todayTag}</Tag> : null}
            {entry.isWorkload ? <Tag color="orange">{PLAN_TEXT.table.workloadTag}</Tag> : null}
            {entry.hasReport ? (
              <Tag icon={<CheckCircleOutlined />} color="green">
                {PLAN_TEXT.table.reportTag}
              </Tag>
            ) : (
              <Tag>{PLAN_TEXT.table.reportMissingTag}</Tag>
            )}
          </div>
        </div>
        <div className={styles.mobileActions}>
          <Tooltip title={PLAN_TEXT.table.editTooltip}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditDay(entry.date)}
              aria-label={PLAN_TEXT.table.editAria(entry.date)}
            />
          </Tooltip>
          <Tooltip title={PLAN_TEXT.table.diaryTooltip}>
            <Link
              href={`/diary?date=${entry.date}`}
              passHref
              aria-label={PLAN_TEXT.table.diaryAria(entry.date)}
            >
              <Button
                size="small"
                type="text"
                icon={<BookOutlined />}
                aria-label={PLAN_TEXT.table.diaryAria(entry.date)}
              />
            </Link>
          </Tooltip>
        </div>
      </div>
      <PlanCardSection title={PLAN_TEXT.table.task} html={entry.taskText} />
      {entry.commentText ? (
        <PlanCardSection title={PLAN_TEXT.table.comment} html={entry.commentText} />
      ) : null}
    </article>
  );
}

function PlanCardSection({ title, html }: { title: string; html: string }) {
  return (
    <section className={styles.mobileSection}>
      <div className={styles.mobileSectionTitle}>{title}</div>
      <div className={styles.multilineText} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
