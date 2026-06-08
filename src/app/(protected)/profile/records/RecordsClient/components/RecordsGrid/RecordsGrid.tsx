"use client";

import { DatePicker, Input, Typography } from "antd";
import { TimeInput } from "@/components/inputs/TimeInput";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  type PersonalRecordDistanceKey,
} from "@/shared/constants/personalRecords.constants";
import { RECORDS_LABELS } from "../../constants/recordsConstants";
import type { RecordFieldErrors, RecordRow } from "../../types/recordsTypes";
import styles from "./RecordsGrid.module.scss";

type RecordsGridProps = {
  rows: RecordRow[];
  loading: boolean;
  saving: boolean;
  errors: Record<string, RecordFieldErrors>;
  onFieldChange: (distanceKey: PersonalRecordDistanceKey, patch: Partial<RecordRow>) => void;
};

export function RecordsGrid({ rows, loading, saving, errors, onFieldChange }: RecordsGridProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.gridHeader}>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.distanceLabel}
        </Typography.Text>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.timeLabel}
        </Typography.Text>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.dateLabel}
        </Typography.Text>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.raceNameLabel}
        </Typography.Text>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.raceCityLabel}
        </Typography.Text>
        <Typography.Text type="secondary" className={styles.gridLabel}>
          {RECORDS_LABELS.protocolLabel}
        </Typography.Text>
      </div>

      {loading ? (
        <Typography.Text type="secondary">{RECORDS_LABELS.loadingText}</Typography.Text>
      ) : (
        <div className={styles.rows}>
          {rows.map((row) => {
            const rowErrors = errors[row.distanceKey];

            return (
              <div className={styles.row} key={row.distanceKey}>
                <div className={styles.distance}>
                  <Typography.Text>{row.label}</Typography.Text>
                </div>
                <div className={styles.field}>
                  <Typography.Text className={styles.fieldLabel}>
                    {RECORDS_LABELS.timeLabel}
                  </Typography.Text>
                  <TimeInput
                    value={row.timeText}
                    onChange={(value) => {
                      onFieldChange(row.distanceKey, {
                        timeText: value,
                      });
                    }}
                    placeholder={RECORDS_LABELS.timePlaceholder}
                    status={rowErrors?.time ? "error" : ""}
                    disabled={saving}
                    maxLength={16}
                  />
                </div>
                <div className={styles.field}>
                  <Typography.Text className={styles.fieldLabel}>
                    {RECORDS_LABELS.dateLabel}
                  </Typography.Text>
                  <DatePicker
                    value={row.recordDate}
                    onChange={(date) => {
                      onFieldChange(row.distanceKey, {
                        recordDate: date,
                      });
                    }}
                    placeholder={RECORDS_LABELS.datePlaceholder}
                    status={rowErrors?.date ? "error" : ""}
                    disabled={saving}
                    format="DD.MM.YYYY"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className={styles.field}>
                  <Typography.Text className={styles.fieldLabel}>
                    {RECORDS_LABELS.raceNameLabel}
                  </Typography.Text>
                  <Input
                    value={row.raceName}
                    onChange={(event) => {
                      onFieldChange(row.distanceKey, {
                        raceName: event.target.value,
                      });
                    }}
                    placeholder={RECORDS_LABELS.raceNamePlaceholder}
                    status={rowErrors?.raceName ? "error" : ""}
                    disabled={saving}
                    maxLength={MAX_RACE_NAME_LENGTH}
                  />
                </div>
                <div className={styles.field}>
                  <Typography.Text className={styles.fieldLabel}>
                    {RECORDS_LABELS.raceCityLabel}
                  </Typography.Text>
                  <Input
                    value={row.raceCity}
                    onChange={(event) => {
                      onFieldChange(row.distanceKey, {
                        raceCity: event.target.value,
                      });
                    }}
                    placeholder={RECORDS_LABELS.raceCityPlaceholder}
                    status={rowErrors?.raceCity ? "error" : ""}
                    disabled={saving}
                    maxLength={MAX_RACE_CITY_LENGTH}
                  />
                </div>
                <div className={styles.field}>
                  <Typography.Text className={styles.fieldLabel}>
                    {RECORDS_LABELS.protocolLabel}
                  </Typography.Text>
                  <Input
                    value={row.protocolUrl}
                    onChange={(event) => {
                      onFieldChange(row.distanceKey, {
                        protocolUrl: event.target.value,
                      });
                    }}
                    placeholder={RECORDS_LABELS.protocolPlaceholder}
                    status={rowErrors?.url ? "error" : ""}
                    disabled={saving}
                    type="url"
                    maxLength={MAX_PROTOCOL_URL_LENGTH}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
