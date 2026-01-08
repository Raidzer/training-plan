"use client";
import {
  BookOutlined,
  CalendarOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import Link from "next/link";
import type { Session } from "next-auth";
import styles from "./dashboard.module.scss";
import { SignOutButton } from "@/components/SingOutButton/SignOutButton";

type Props = { session: Session };

export function DashboardClient({ session }: Props) {
  const isAdmin = session.user?.role === "admin";
  console.log(isAdmin);
  const adminCard = isAdmin ? (
    <Link href="/admin/users" passHref>
      <Card
        hoverable
        className={styles.card}
        title={<CardTitle icon={<TeamOutlined />} title="Администрирование" />}
      >
        <Typography.Text type="secondary">
          Управление пользователями: роли, доступ и пароли.
        </Typography.Text>
      </Card>
    </Link>
  ) : null;

  return (
    <Space size="middle" className={styles.wrapper}>
      <Card>
        <div className={styles.cardHeader}>
          <div>
            <Typography.Title level={3} className={styles.paragraphTight}>
              Привет, {session.user?.name ?? session.user?.email}
            </Typography.Title>
            <Typography.Paragraph
              type="secondary"
              className={styles.paragraphTight}
            >
              Что делаем сегодня?
            </Typography.Paragraph>
          </div>
          <SignOutButton />
        </div>
        <div className={styles.cards}>
          {adminCard}
          <Link href="/plan" passHref>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<CalendarOutlined />} title="План" />}
            >
              <Typography.Text type="secondary">
                Посмотреть цели и запланированные тренировки.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/diary" passHref>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<BookOutlined />} title="Дневник" />}
            >
              <Typography.Text type="secondary">
                Скоро: сводки, графики и метрики восстановления.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/verify-telegram" passHref>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<MessageOutlined />} title="Telegram" />}
            >
              <Typography.Text type="secondary">
                Получить код и связать Telegram для получения плана и рассылки.
              </Typography.Text>
            </Card>
          </Link>
        </div>
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
