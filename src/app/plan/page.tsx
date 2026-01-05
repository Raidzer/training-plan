"use client";

import { FireOutlined, HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
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
};

const PAGE_SIZE = 20;

export default function PlanPage() {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [msgApi, contextHolder] = message.useMessage();
  const scrolledToTodayRef = useRef(false);
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const todayEntryId = useMemo(
    () => entries.find((entry) => entry.date === today)?.id ?? null,
    [entries, today]
  );

  const columns: ColumnsType<PlanEntry> = useMemo(
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
      },
      {
        title: "Комментарий",
        dataIndex: "commentText",
      },
    ],
    []
  );

  const updateCurrentPageForToday = useCallback(
    (items: PlanEntry[]) => {
      const todayIndex = items.findIndex((entry) => entry.date === today);
      if (todayIndex < 0) return;
      setCurrentPage(Math.floor(todayIndex / PAGE_SIZE) + 1);
    },
    [today]
  );

  const load = useCallback(async () => {
    scrolledToTodayRef.current = false;
    setLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = (await res.json().catch(() => null)) as
        | { entries?: PlanEntry[]; error?: string }
        | null;
      if (!res.ok || !data?.entries) {
        msgApi.error(data?.error ?? "Не удалось загрузить записи плана");
        return;
      }
      setEntries(data.entries);
      updateCurrentPageForToday(data.entries);
    } catch (err) {
      console.error(err);
      msgApi.error("Произошла ошибка при загрузке плана");
    } finally {
      setLoading(false);
    }
  }, [msgApi, updateCurrentPageForToday]);

  useEffect(() => {
    load();
  }, [load]);

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
          <Table
            size="small"
            columns={columns}
            dataSource={entries}
            loading={loading}
            rowKey="id"
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
