"use client";

import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { Button, Card } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PeriodMobileList } from "./components/PeriodMobileList/PeriodMobileList";
import { PeriodRangeControls } from "./components/PeriodRangeControls/PeriodRangeControls";
import { PeriodSummaryCards } from "./components/PeriodSummaryCards/PeriodSummaryCards";
import { PeriodTable } from "./components/PeriodTable/PeriodTable";
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
    handleRangeChange,
    handlePresetRange,
    handleExport,
    handleExportAll,
  } = useDiaryPeriod();

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <div className={styles.spaceStyle}>
          <PageHeader
            title={DIARY_PERIOD_LABELS.title}
            subtitle={DIARY_PERIOD_LABELS.subtitle}
            actions={
              <>
                <Link href="/diary" passHref>
                  <Button icon={<ArrowLeftOutlined />}>{DIARY_PERIOD_LABELS.backToDiary}</Button>
                </Link>
                <Link href="/" passHref>
                  <Button icon={<HomeOutlined />}>{DIARY_PERIOD_LABELS.backHome}</Button>
                </Link>
              </>
            }
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

          <PeriodSummaryCards totals={totals} />
          <PeriodTable days={days} loading={loading} />
          <PeriodMobileList days={days} />
        </div>
      </Card>
    </main>
  );
}
