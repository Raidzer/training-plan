"use client";

import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
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
import { PeriodStatusBadge } from "../PeriodStatusBadge/PeriodStatusBadge";
import styles from "./PeriodTable.module.scss";

type PeriodTableProps = {
  days: DayStatus[];
  loading?: boolean;
};

export function PeriodTable({ days, loading = false }: PeriodTableProps) {
  const columns: ColumnsType<DayStatus> = useMemo(
    () => [
      {
        title: DIARY_PERIOD_LABELS.dateColumn,
        dataIndex: "date",
        width: 148,
        fixed: "left" as const,
        render: (value: string) => (
          <Link
            className={styles.dateLink}
            href={"/diary?date=" + value}
            aria-label={DIARY_PERIOD_LABELS.openDayAction + ": " + formatPeriodDisplayDate(value)}
          >
            {formatPeriodDisplayDate(value)}
          </Link>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.weightColumn,
        width: 128,
        render: (_, record) => (
          <span>{formatWeightStatus(record.hasWeightMorning, record.hasWeightEvening)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.distanceColumn,
        width: 144,
        render: (_, record) => <span>{formatDistanceValue(record.totalDistanceKm)}</span>,
      },
      {
        title: DIARY_PERIOD_LABELS.recoveryColumn,
        width: 184,
        render: (_, record) => (
          <span>{formatRecoveryStatus(record.hasBath, record.hasMfr, record.hasMassage)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.sleepColumn,
        width: 136,
        render: (_, record) => (
          <span>
            {record.hasSleep
              ? DIARY_PERIOD_LABELS.sleepCompleted
              : DIARY_PERIOD_LABELS.sleepMissing}
          </span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.workoutsColumn,
        width: 136,
        render: (_, record) => (
          <span>{formatWorkoutStatus(record.workoutsWithFullReport, record.workoutsTotal)}</span>
        ),
      },
      {
        title: DIARY_PERIOD_LABELS.statusColumn,
        width: 156,
        render: (_, record) => <PeriodStatusBadge completed={record.dayHasReport} />,
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
      scroll={{ x: 1032 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
    />
  );
}
