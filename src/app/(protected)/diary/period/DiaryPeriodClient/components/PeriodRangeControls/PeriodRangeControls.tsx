"use client";

import { DownloadOutlined } from "@ant-design/icons";
import { Button, DatePicker } from "antd";
import dayjs from "dayjs";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import type { PeriodRange } from "../../types/periodTypes";
import styles from "./PeriodRangeControls.module.scss";

const { RangePicker } = DatePicker;

type PeriodRangeControlsProps = {
  range: PeriodRange;
  exporting: boolean;
  exportingAll: boolean;
  onRangeChange: (range: PeriodRange) => void;
  onPresetRange: (daysCount: number) => void;
  onExport: () => void;
  onExportAll: () => void;
};

const PERIOD_RANGE_TITLE_ID = "period-range-title";
const PERIOD_RANGE_LABEL_ID = "period-range-label";

function isPresetRangeActive(range: PeriodRange, daysCount: number) {
  const today = dayjs();
  const expectedStart = today.subtract(daysCount - 1, "day");

  return range[0].isSame(expectedStart, "day") && range[1].isSame(today, "day");
}

export function PeriodRangeControls({
  range,
  exporting,
  exportingAll,
  onRangeChange,
  onPresetRange,
  onExport,
  onExportAll,
}: PeriodRangeControlsProps) {
  const sevenDaysActive = isPresetRangeActive(range, 7);
  const thirtyDaysActive = isPresetRangeActive(range, 30);

  return (
    <section className={styles.controlsSection} aria-labelledby={PERIOD_RANGE_TITLE_ID}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle} id={PERIOD_RANGE_TITLE_ID}>
          {DIARY_PERIOD_LABELS.rangeTitle}
        </h2>
        <p className={styles.sectionDescription}>{DIARY_PERIOD_LABELS.rangeSubtitle}</p>
      </header>

      <div className={styles.controlsLayout}>
        <div className={styles.rangeZone}>
          <div className={styles.rangeField}>
            <span className={styles.controlLabel} id={PERIOD_RANGE_LABEL_ID}>
              {DIARY_PERIOD_LABELS.rangeLabel}
            </span>
            <RangePicker
              aria-labelledby={PERIOD_RANGE_LABEL_ID}
              className={styles.rangePicker}
              value={range}
              format="DD.MM.YYYY"
              allowClear={false}
              disabledDate={(current) => current.isAfter(dayjs(), "day")}
              onChange={(values) => {
                if (!values || values.length !== 2) {
                  return;
                }

                const [start, end] = values;
                if (!start || !end) {
                  return;
                }

                onRangeChange([start, end]);
              }}
            />
          </div>

          <div className={styles.quickRangeGroup}>
            <span className={styles.controlLabel}>{DIARY_PERIOD_LABELS.quickRangeLabel}</span>
            <div className={styles.quickRangeButtons}>
              <Button
                aria-pressed={sevenDaysActive}
                className={sevenDaysActive ? styles.quickButtonActive : styles.quickButton}
                onClick={() => {
                  onPresetRange(7);
                }}
              >
                {DIARY_PERIOD_LABELS.lastSevenDays}
              </Button>
              <Button
                aria-pressed={thirtyDaysActive}
                className={thirtyDaysActive ? styles.quickButtonActive : styles.quickButton}
                onClick={() => {
                  onPresetRange(30);
                }}
              >
                {DIARY_PERIOD_LABELS.lastThirtyDays}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.exportZone}>
          <span className={styles.controlLabel}>{DIARY_PERIOD_LABELS.exportLabel}</span>
          <div className={styles.exportButtons}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              disabled={exportingAll}
              onClick={onExport}
            >
              {DIARY_PERIOD_LABELS.exportExcel}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exportingAll}
              disabled={exporting}
              onClick={onExportAll}
            >
              {DIARY_PERIOD_LABELS.exportAllExcel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
