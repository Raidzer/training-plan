"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Button, Card, DatePicker, Space, Table, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import styles from "./period.module.scss";

type DayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
  totalDistanceKm: number;
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
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(13, "day"), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
        const res = await fetch(`/api/diary/period?from=${formatDate(from)}&to=${formatDate(to)}`);
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          totals?: PeriodTotals;
          error?: string;
        } | null;
        if (!res.ok || !data?.days || !data?.totals) {
          messageApi.error(data?.error ?? "Не удалось загрузить дневник за период.");
          return;
        }
        setDays(data.days);
        setTotals(data.totals);
      } catch (err) {
        console.error(err);
        messageApi.error("Не удалось загрузить дневник за период.");
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    loadPeriod(range[0], range[1]);
  }, [range, loadPeriod]);

  const handleExport = useCallback(async () => {
    const from = formatDate(range[0]);
    const to = formatDate(range[1]);
    setExporting(true);
    try {
      const res = await fetch(`/api/diary/period-export?from=${from}&to=${to}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        messageApi.error(data?.error ?? "Не удалось выгрузить отчет.");
        return;
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] ?? `diary_${from}_${to}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      messageApi.error("Не удалось выгрузить отчет.");
    } finally {
      setExporting(false);
    }
  }, [messageApi, range]);

  const columns: ColumnsType<DayStatus> = useMemo(
    () => [
      {
        title: "Дата",
        dataIndex: "date",
        width: 130,
      },
      {
        title: "Вес",
        render: (_, record) => (
          <span>
            {record.hasWeightMorning ? "У" : "-"} / {record.hasWeightEvening ? "В" : "-"}
          </span>
        ),
      },
      {
        title: "Дистанция, км",
        render: (_, record) => <span>{record.totalDistanceKm.toFixed(2)}</span>,
      },
      {
        title: "Восстановление",
        render: (_, record) => (
          <span>
            {record.hasBath ? "Б" : "-"} / {record.hasMfr ? "МФР" : "-"} /{" "}
            {record.hasMassage ? "М" : "-"}
          </span>
        ),
      },
      {
        title: "Тренировки",
        render: (_, record) => (
          <span>
            {record.workoutsWithFullReport}/{record.workoutsTotal}
          </span>
        ),
      },
      {
        title: "Статус",
        render: (_, record) =>
          record.dayHasReport ? <Tag color="green">Заполнено</Tag> : <Tag>Не заполнено</Tag>,
      },
    ],
    []
  );

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space orientation="vertical" size="large" className={styles.spaceStyle}>
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <Typography.Title level={3} className={styles.typographyTitle}>
                Дневник за период
              </Typography.Title>
              <Typography.Paragraph type="secondary" className={styles.typographyParagraph}>
                Просмотр заполнения дневника за выбранный период.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/diary" passHref>
                <Button icon={<ArrowLeftOutlined />}>Назад к дневному виду</Button>
              </Link>
              <Link href="/" passHref>
                <Button icon={<HomeOutlined />}>На главную</Button>
              </Link>
            </Space>
          </div>

          <Card type="inner">
            <Space size="middle" className={styles.rangeRow} wrap>
              <RangePicker
                value={range}
                onChange={(values) => {
                  if (!values || values.length !== 2) {
                    return;
                  }
                  const [start, end] = values;
                  if (!start || !end) {
                    return;
                  }
                  setRange([start, end]);
                }}
              />
              <Button onClick={() => setRange([dayjs().subtract(6, "day"), dayjs()])}>
                Последние 7 дней
              </Button>
              <Button onClick={() => setRange([dayjs().subtract(29, "day"), dayjs()])}>
                Последние 30 дней
              </Button>
              <Button type="primary" loading={exporting} onClick={handleExport}>
                Выгрузить Excel
              </Button>
            </Space>
          </Card>

          <div className={styles.summaryRow}>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Дней заполнено</Typography.Text>
              <Typography.Title level={4}>{totals.daysComplete}</Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Тренировок всего</Typography.Text>
              <Typography.Title level={4}>{totals.workoutsTotal}</Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Тренировок с полным отчетом</Typography.Text>
              <Typography.Title level={4}>{totals.workoutsWithFullReport}</Typography.Title>
            </Card>
            <Card className={styles.summaryCard}>
              <Typography.Text type="secondary">Записей веса</Typography.Text>
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
