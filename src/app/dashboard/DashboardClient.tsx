"use client";
import { BookOutlined, CalendarOutlined, HeartOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "../../components/SignOutButton";

type Props = { session: Session };

export function DashboardClient({ session }: Props) {
  return (
    <Space size="middle" style={{ display: "flex" }}>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Привет, {session.user?.name ?? session.user?.email}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
              Что делаем сегодня?
            </Typography.Paragraph>
          </div>
          <SignOutButton />
        </div>
        <Space size="middle" wrap>
          <Link href="/plan" legacyBehavior passHref>
            <a style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{ width: 240 }}
                title={<CardTitle icon={<CalendarOutlined />} title="План" />}
              >
                <Typography.Text type="secondary">
                  Посмотреть цели и запланированные тренировки.
                </Typography.Text>
              </Card>
            </a>
          </Link>
          <Link href="/workouts" legacyBehavior passHref>
            <a style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{ width: 240 }}
                title={<CardTitle icon={<HeartOutlined />} title="Тренировки" />}
              >
                <Typography.Text type="secondary">
                  Добавить новую тренировку или оценку нагрузки.
                </Typography.Text>
              </Card>
            </a>
          </Link>
          <Link href="/dashboard" legacyBehavior passHref>
            <a style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{ width: 240 }}
                title={<CardTitle icon={<BookOutlined />} title="Отчеты" />}
              >
                <Typography.Text type="secondary">
                  Скоро: сводки, графики и метрики восстановления.
                </Typography.Text>
              </Card>
            </a>
          </Link>
        </Space>
      </Card>
    </Space>
  );
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Space size={8}>
      {icon}
      <Typography.Text strong>{title}</Typography.Text>
    </Space>
  );
}
