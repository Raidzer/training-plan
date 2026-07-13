"use client";

import { FileSearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Skeleton } from "antd";
import { useId } from "react";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import type { DayStatus } from "../../types/periodTypes";
import { PeriodMobileList } from "../PeriodMobileList/PeriodMobileList";
import { PeriodTable } from "../PeriodTable/PeriodTable";
import styles from "./PeriodResults.module.scss";

type PeriodResultsProps = {
  days: DayStatus[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function PeriodResults({ days, loading, error, onRetry }: PeriodResultsProps) {
  const titleId = useId();
  const daysCountValue = loading ? "—" : String(days.length);
  const daysCountLabel = loading
    ? DIARY_PERIOD_LABELS.loadingLabel
    : [daysCountValue, DIARY_PERIOD_LABELS.daysCountSuffix].join(" ");

  return (
    <section className={styles.resultsSection} aria-labelledby={titleId} aria-busy={loading}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h2 id={titleId} className={styles.title}>
            {DIARY_PERIOD_LABELS.resultsTitle}
          </h2>
          <p className={styles.subtitle}>{DIARY_PERIOD_LABELS.resultsSubtitle}</p>
        </div>
        <span className={styles.count} aria-label={daysCountLabel}>
          <strong>{daysCountValue}</strong>
          <span>{DIARY_PERIOD_LABELS.daysCountSuffix}</span>
        </span>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <span className={styles.loadingLabel}>{DIARY_PERIOD_LABELS.loadingLabel}</span>
            <Skeleton active title={{ width: "32%" }} paragraph={{ rows: 6 }} />
          </div>
        ) : error ? (
          <div className={styles.feedbackState} role="alert">
            <ReloadOutlined className={styles.feedbackIcon} aria-hidden />
            <div className={styles.feedbackCopy}>
              <h3 className={styles.feedbackTitle}>{DIARY_PERIOD_LABELS.errorTitle}</h3>
              <p className={styles.feedbackDescription}>{error}</p>
            </div>
            <Button icon={<ReloadOutlined />} onClick={onRetry}>
              {DIARY_PERIOD_LABELS.retryAction}
            </Button>
          </div>
        ) : days.length === 0 ? (
          <div className={styles.feedbackState}>
            <FileSearchOutlined className={styles.feedbackIcon} aria-hidden />
            <div className={styles.feedbackCopy}>
              <h3 className={styles.feedbackTitle}>{DIARY_PERIOD_LABELS.emptyTitle}</h3>
              <p className={styles.feedbackDescription}>{DIARY_PERIOD_LABELS.emptyDescription}</p>
            </div>
          </div>
        ) : (
          <>
            <PeriodTable days={days} />
            <PeriodMobileList days={days} />
          </>
        )}
      </div>
    </section>
  );
}
