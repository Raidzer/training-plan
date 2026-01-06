"use client";

import {
  BookOutlined,
  CheckCircleOutlined,
  FireOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./plan.module.scss";

type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
  isWorkload: boolean;
  hasReport: boolean;
};

type PlanDayEntry = {
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  hasReport: boolean;
};

const PAGE_SIZE = 20;

const formatNumberedLines = (
  values: Array<string | null | undefined>,
  options?: { emptyValue?: string; includeIfAllEmpty?: boolean }
) => {
  const emptyValue = options?.emptyValue ?? "-";
  if (!values.length) return options?.includeIfAllEmpty ? emptyValue : "";
  const normalized = values.map((value) => {
    if (value === null || value === undefined) return emptyValue;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : emptyValue;
  });
  const hasNonEmpty = normalized.some((value) => value !== emptyValue);
  if (!hasNonEmpty && !options?.includeIfAllEmpty) return "";
  if (normalized.length === 1) return normalized[0];
  return normalized.map((value, index) => `${index + 1}) ${value}`).join("\n");
};

const buildPlanDays = (entries: PlanEntry[]): PlanDayEntry[] => {
  const grouped = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const existing = grouped.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.date, [entry]);
    }
  }

  const rows: PlanDayEntry[] = [];
  for (const [date, dayEntries] of grouped) {
    const sorted = [...dayEntries].sort(
      (a, b) => a.sessionOrder - b.sessionOrder
    );
    const tasks = sorted.map((entry) => entry.taskText);
    const comments = sorted.map((entry) => entry.commentText ?? "");
    const commentText = formatNumberedLines(comments, {
      includeIfAllEmpty: false,
    });
    rows.push({
      date,
      taskText: formatNumberedLines(tasks, { includeIfAllEmpty: true }),
      commentText: commentText.length ? commentText : null,
      isWorkload: sorted.some((entry) => entry.isWorkload),
      hasReport: sorted.every((entry) => entry.hasReport),
    });
  }
  return rows;
};

export default function PlanPage() {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyWithoutReports, setOnlyWithoutReports] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const scrolledToTodayRef = useRef(false);
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const groupedEntries = useMemo(() => buildPlanDays(entries), [entries]);
  const filteredEntries = useMemo(
    () =>
      onlyWithoutReports
        ? groupedEntries.filter((entry) => !entry.hasReport)
        : groupedEntries,
    [groupedEntries, onlyWithoutReports]
  );

  const todayEntryId = useMemo(
    () => filteredEntries.find((entry) => entry.date === today)?.date ?? null,
    [filteredEntries, today]
  );

  const columns: ColumnsType<PlanDayEntry> = useMemo(
    () => [
      {
        title: "Нагрузка",
        dataIndex: "isWorkload",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<FireOutlined />} color="volcano">
              Рабочая
            </Tag>
          ) : null,
      },
      {
        title: "Дата",
        dataIndex: "date",
        width: 120,
      },
      {
        title: "Задание",
        dataIndex: "taskText",
        render: (value: string) => (
          <span className={styles.multilineText}>{value}</span>
        ),
      },
      {
        title: "Комментарий",
        dataIndex: "commentText",
        render: (value: string | null) =>
          value ? (
            <span className={styles.multilineText}>{value}</span>
          ) : null,
      },
      {
        title: "Отчет",
        dataIndex: "hasReport",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<CheckCircleOutlined />} color="green">
              Заполнен
            </Tag>
          ) : null,
      },
      {
        title: "Дневник",
        key: "diary",
        width: 64,
        render: (_, record) => (
          <Tooltip title="Открыть дневник">
            <Link href={`/diary?date=${record.date}`} passHref>
              <Button
                size="small"
                type="text"
                icon={<BookOutlined />}
                aria-label={`Открыть дневник на ${record.date}`}
              />
            </Link>
          </Tooltip>
        ),
      },
    ],
    []
  );

  const load = useCallback(async () => {
    scrolledToTodayRef.current = false;
    setLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = (await res.json().catch(() => null)) as {
        entries?: PlanEntry[];
        error?: string;
      } | null;
      if (!res.ok || !data?.entries) {
        msgApi.error(data?.error ?? "Не удалось загрузить записи плана");
        return;
      }
      setEntries(data.entries);
    } catch (err) {
      console.error(err);
      msgApi.error("Произошла ошибка при загрузке плана");
    } finally {
      setLoading(false);
    }
  }, [msgApi]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    scrolledToTodayRef.current = false;
    if (onlyWithoutReports) {
      setCurrentPage((prev) => (prev === 1 ? prev : 1));
      return;
    }
    const todayIndex = filteredEntries.findIndex(
      (entry) => entry.date === today
    );
    const nextPage =
      todayIndex < 0 ? 1 : Math.floor(todayIndex / PAGE_SIZE) + 1;
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [filteredEntries, onlyWithoutReports, today]);

  useEffect(() => {
    if (!todayEntryId || scrolledToTodayRef.current) return;
    const row = document.querySelector(`[data-row-key="${todayEntryId}"]`);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    scrolledToTodayRef.current = true;
  }, [todayEntryId, currentPage]);

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space
          orientation="vertical"
          size="large"
          className={styles.spaceStyle}
        >
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <Typography.Title level={3} className={styles.typographyTitle}>
                План тренировок
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                Ниже — записи плана из базы (сортировка по дате и порядку
                сессии). Для загрузки нового файла воспользуйтесь кнопкой ниже.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/dashboard" passHref>
                <Button icon={<HomeOutlined />}>Главная</Button>
              </Link>
              <Button
                icon={<ReloadOutlined />}
                onClick={load}
                loading={loading}
              >
                Обновить план
              </Button>
            </Space>
          </div>
          <Link href="/plan/import" passHref>
            <Button type="primary" block>
              Импортировать план из Excel
            </Button>
          </Link>
          <Space size="small" align="center">
            <Switch
              checked={onlyWithoutReports}
              onChange={setOnlyWithoutReports}
            />
            <Typography.Text>Только без отчетов</Typography.Text>
          </Space>
          <Table
            size="small"
            columns={columns}
            dataSource={filteredEntries}
            loading={loading}
            rowKey="date"
            rowClassName={(record) => {
              const rowClasses = [];
              if (record.isWorkload) rowClasses.push(styles.workloadRow);
              if (record.date === today) rowClasses.push(styles.todayRow);
              return rowClasses.join(" ");
            }}
            pagination={{
              pageSize: PAGE_SIZE,
              current: currentPage,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </Space>
      </Card>
    </main>
  );
}
