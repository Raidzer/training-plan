"use client";

import { DownloadOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker } from "antd";
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

export function PeriodRangeControls({
  range,
  exporting,
  exportingAll,
  onRangeChange,
  onPresetRange,
  onExport,
  onExportAll,
}: PeriodRangeControlsProps) {
  return (
    <Card type="inner" className={styles.rangeCard}>
      <div className={styles.rangeRow}>
        <RangePicker
          className={styles.rangePicker}
          value={range}
          format="DD.MM.YYYY"
          allowClear={false}
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
        <Button
          onClick={() => {
            onPresetRange(7);
          }}
        >
          {DIARY_PERIOD_LABELS.lastSevenDays}
        </Button>
        <Button
          onClick={() => {
            onPresetRange(30);
          }}
        >
          {DIARY_PERIOD_LABELS.lastThirtyDays}
        </Button>
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
    </Card>
  );
}
