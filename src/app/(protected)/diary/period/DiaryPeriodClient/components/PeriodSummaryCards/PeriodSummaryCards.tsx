"use client";

import { DIARY_PERIOD_LABELS, PERIOD_SUMMARY_ITEMS } from "../../constants/periodConstants";
import type { PeriodTotals } from "../../types/periodTypes";
import styles from "./PeriodSummaryCards.module.scss";

type PeriodSummaryCardsProps = {
  totals: PeriodTotals;
  daysCount: number;
  loading: boolean;
};

type PeriodSummaryDetail = string | ((totals: PeriodTotals, daysCount: number) => string);

type PeriodSummaryItem = {
  key: keyof PeriodTotals;
  label: string;
  detail?: PeriodSummaryDetail;
};

const PERIOD_SUMMARY_TITLE_ID = "period-summary-title";
const summaryItems = PERIOD_SUMMARY_ITEMS as readonly PeriodSummaryItem[];

function getSummaryDetail(item: PeriodSummaryItem, totals: PeriodTotals, daysCount: number) {
  if (typeof item.detail === "function") {
    return item.detail(totals, daysCount);
  }

  return item.detail;
}

export function PeriodSummaryCards({ totals, daysCount, loading }: PeriodSummaryCardsProps) {
  return (
    <section className={styles.summarySection} aria-labelledby={PERIOD_SUMMARY_TITLE_ID}>
      <h2 className={styles.sectionTitle} id={PERIOD_SUMMARY_TITLE_ID}>
        {DIARY_PERIOD_LABELS.summaryTitle}
      </h2>

      <dl className={styles.summaryGrid} aria-busy={loading}>
        {summaryItems.map((item) => {
          const detail = getSummaryDetail(item, totals, daysCount);

          return (
            <div className={styles.summaryCard} key={item.key}>
              <dt className={styles.summaryLabel}>{item.label}</dt>
              <dd className={styles.summaryContent}>
                {loading ? (
                  <>
                    <span className={styles.valueSkeleton} aria-hidden="true" />
                    <span className={styles.detailSkeleton} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className={styles.summaryValue}>{totals[item.key]}</span>
                    {detail ? <span className={styles.summaryDetail}>{detail}</span> : null}
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
