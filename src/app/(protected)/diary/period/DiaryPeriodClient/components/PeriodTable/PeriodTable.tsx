"use client";

import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { DIARY_PERIOD_LABELS } from "../../constants/periodConstants";
import type { DayStatus } from "../../types/periodTypes";
import {
  formatDistanceValue,
  formatPeriodDisplayDate,
  formatRecoveryStatus,
  formatWeightStatus,
  formatWorkoutStatus,
} from "../../utils/periodUtils";
import styles from "./PeriodTable.module.scss";

type PeriodTableProps = {
  days: DayStatus[];
  loading: boolean;
};

export function PeriodTable({ days, loading }: PeriodTableProps) {
  const columns: ColumnsType<DayStatus> = useMemo(
    () => [
      {
        title: DIARY_PERIOD_LABELS.dateColumn,
        dataIndex: "date",
        width: 130,
        render: (value: string) => formatPeriodDisplayDate(value),
      },
      {
        title: DIARY_PERIOD_LABELS.weightColumn,
        render: (_, record) => (
          <span>{formatWeightStatus(record.hasWeightMorning, record.hasWeightEvening)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.distanceColumn,
        render: (_, record) => <span>{formatDistanceValue(record.totalDistanceKm)}</span>,
      },
      {
        title: DIARY_PERIOD_LABELS.recoveryColumn,
        render: (_, record) => (
          <span>{formatRecoveryStatus(record.hasBath, record.hasMfr, record.hasMassage)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.workoutsColumn,
        render: (_, record) => (
          <span>{formatWorkoutStatus(record.workoutsWithFullReport, record.workoutsTotal)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.statusColumn,
        render: (_, record) =>
          record.dayHasReport ? (
            <Tag color="green">{DIARY_PERIOD_LABELS.completedStatus}</Tag>
          ) : (
            <Tag>{DIARY_PERIOD_LABELS.incompleteStatus}</Tag>
          ),
      },
    ],
    []
  );

  return (
    <Table
      size="small"
      className={styles.periodTable}
      columns={columns}
      dataSource={days}
      loading={loading}
      rowKey="date"
      scroll={{ x: 860 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
    />
  );
}
