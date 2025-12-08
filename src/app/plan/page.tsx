"use client";

import { Button, Card, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./plan.module.scss";

type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
};

export default function PlanPage() {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  const columns: ColumnsType<PlanEntry> = useMemo(
    () => [
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/plans");
        const data = (await res.json().catch(() => null)) as
          | { entries?: PlanEntry[]; error?: string }
          | null;
        if (!res.ok || !data?.entries) {
          msgApi.error(data?.error ?? "Не удалось загрузить план");
          return;
        }
        setEntries(data.entries);
      } catch (err) {
        console.error(err);
        msgApi.error("Ошибка запроса");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [msgApi]);

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space
          orientation="vertical"
          size="large"
          className={styles.spaceStyle}
        >
          <div>
            <Typography.Title level={3} className={styles.typographyTitle}>
              План тренировок
            </Typography.Title>
            <Typography.Paragraph
              type="secondary"
              className={styles.typographyParagraph}
            >
              Ниже — записи плана из базы (сортировка по дате и порядку сессии).
              Для загрузки нового файла воспользуйтесь кнопкой ниже.
            </Typography.Paragraph>
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
            pagination={{ pageSize: 20 }}
          />
        </Space>
      </Card>
    </main>
  );
}
