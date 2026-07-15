"use client";

import { PeriodHeader } from "./components/PeriodHeader/PeriodHeader";
import { PeriodRangeControls } from "./components/PeriodRangeControls/PeriodRangeControls";
import { PeriodResults } from "./components/PeriodResults/PeriodResults";
import { PeriodSummaryCards } from "./components/PeriodSummaryCards/PeriodSummaryCards";
import { DIARY_PERIOD_LABELS } from "./constants/periodConstants";
import { useDiaryPeriod } from "./hooks/useDiaryPeriod";
import styles from "./DiaryPeriodClient.module.scss";

export function DiaryPeriodClient() {
  const {
    contextHolder,
    range,
    loading,
    exporting,
    exportingAll,
    days,
    totals,
    error,
    handleRangeChange,
    handlePresetRange,
    handleExport,
    handleExportAll,
    handleRetry,
  } = useDiaryPeriod();

  return (
    <div className={styles.mainContainer}>
      {contextHolder}
      <div className={styles.pageStack}>
        <PeriodHeader
          eyebrow={DIARY_PERIOD_LABELS.eyebrow}
          title={DIARY_PERIOD_LABELS.title}
          subtitle={DIARY_PERIOD_LABELS.subtitle}
          dailyReportAction={DIARY_PERIOD_LABELS.dailyReportAction}
          dashboardAction={DIARY_PERIOD_LABELS.dashboardAction}
        />

        <PeriodRangeControls
          range={range}
          exporting={exporting}
          exportingAll={exportingAll}
          onRangeChange={handleRangeChange}
          onPresetRange={handlePresetRange}
          onExport={handleExport}
          onExportAll={handleExportAll}
        />

        <PeriodSummaryCards totals={totals} loading={loading} daysCount={days.length} />
        <PeriodResults days={days} loading={loading} error={error} onRetry={handleRetry} />
      </div>
    </div>
  );
}
