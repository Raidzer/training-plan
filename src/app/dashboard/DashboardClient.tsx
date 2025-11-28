"use client";
import { BookOutlined, CalendarOutlined, HeartOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import Link from "next/link";
import type { Session } from "next-auth";
import styles from "./dashboard.module.scss";
import { SignOutButton } from "@/components/SingOutButton/SignOutButton";

type Props = { session: Session };

export function DashboardClient({ session }: Props) {
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
          <Link href="/plan" legacyBehavior passHref>
            <a className={styles.cardLink}>
              <Card
                hoverable
                className={styles.card}
                title={<CardTitle icon={<CalendarOutlined />} title="План" />}
              >
                <Typography.Text type="secondary">
                  Посмотреть цели и запланированные тренировки.
                </Typography.Text>
              </Card>
            </a>
          </Link>
          <Link href="/workouts" legacyBehavior passHref>
            <a className={styles.cardLink}>
              <Card
                hoverable
                className={styles.card}
                title={<CardTitle icon={<HeartOutlined />} title="Тренировки" />}
              >
                <Typography.Text type="secondary">
                  Добавить новую тренировку или оценку нагрузки.
                </Typography.Text>
              </Card>
            </a>
          </Link>
          <Link href="/dashboard" legacyBehavior passHref>
            <a className={styles.cardLink}>
              <Card
                hoverable
                className={styles.card}
                title={<CardTitle icon={<BookOutlined />} title="Отчеты" />}
              >
                <Typography.Text type="secondary">
                  Скоро: сводки, графики и метрики восстановления.
                </Typography.Text>
              </Card>
            </a>
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
