"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Button,
  Card,
  DatePicker,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import styles from "./period.module.scss";

type DayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
};

type PeriodTotals = {
  daysComplete: number;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  weightEntries: number;
};

const { RangePicker } = DatePicker;

const formatDate = (value: Dayjs) => value.format("YYYY-MM-DD");

export function DiaryPeriodClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(13, "day"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayStatus[]>([]);
  const [totals, setTotals] = useState<PeriodTotals>({
    daysComplete: 0,
    workoutsTotal: 0,
    workoutsWithFullReport: 0,
    weightEntries: 0,
  });

  const loadPeriod = useCallback(
    async (from: Dayjs, to: Dayjs) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/diary/period?from=${formatDate(from)}&to=${formatDate(to)}`
        );
        const data = (await res.json().catch(() => null)) as
          | { days?: DayStatus[]; totals?: PeriodTotals; error?: string }
          | null;
        if (!res.ok || !data?.days || !data?.totals) {
          messageApi.error(data?.error ?? "Failed to load period view.");
          return;
        }
        setDays(data.days);
        setTotals(data.totals);
      } catch (err) {
        console.error(err);
        messageApi.error("Failed to load period view.");
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    loadPeriod(range[0], range[1]);
  }, [range, loadPeriod]);

  const columns: ColumnsType<DayStatus> = useMemo(
    () => [
      {
        title: "Date",
        dataIndex: "date",
        width: 130,
      },
      {
        title: "Weight",
        render: (_, record) => (
          <span>
            {record.hasWeightMorning ? "M" : "-"} /{" "}
            {record.hasWeightEvening ? "E" : "-"}
          </span>
        ),
      },
      {
        title: "Workouts",
        render: (_, record) => (
          <span>
            {record.workoutsWithFullReport}/{record.workoutsTotal}
          </span>
        ),
      },
      {
        title: "Status",
        render: (_, record) =>
          record.dayHasReport ? (
            <Tag color="green">Complete</Tag>
          ) : (
            <Tag>Missing</Tag>
          ),
      },
    ],
    []
  );

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space direction="vertical" size="large" className={styles.spaceStyle}>
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <Typography.Title level={3} className={styles.typographyTitle}>
                Diary period
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                Review diary completion over a selected period.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/diary" passHref>
                <Button>Back to day view</Button>
              </Link>
            </Space>
          </div>

          <Card type="inner">
            <Space
              size="middle"
              className={styles.rangeRow}
              wrap
            >
              <RangePicker
                value={range}
                onChange={(values) => {
                  if (!values || values.length !== 2) return;
                  setRange([values[0], values[1]]);
                }}
              />
              <Button onClick={() => setRange([dayjs().subtract(6, "day"), dayjs()])}>
                Last 7 days
              </Button>
              <Button onClick={() => setRange([dayjs().subtract(29, "day"), dayjs()])}>
                Last 30 days
              </Button>
            </Space>
          </Card>

          <div className={styles.summaryRow}>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Days complete</Typography.Text>
              <Typography.Title level={4}>{totals.daysComplete}</Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Workouts total</Typography.Text>
              <Typography.Title level={4}>{totals.workoutsTotal}</Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Workouts full</Typography.Text>
              <Typography.Title level={4}>
                {totals.workoutsWithFullReport}
              </Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Weight entries</Typography.Text>
              <Typography.Title level={4}>{totals.weightEntries}</Typography.Title>
            </Card>
          </div>

          <Table
            size="small"
            columns={columns}
            dataSource={days}
            loading={loading}
            rowKey="date"
            pagination={{ pageSize: 20 }}
          />
        </Space>
      </Card>
    </main>
  );
}
