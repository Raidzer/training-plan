"use client";
import {
  BookOutlined,
  CalendarOutlined,
  MessageOutlined,
  ShoppingOutlined,
  SnippetsOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import styles from "./dashboard.module.scss";
import { SignOutButton } from "@/components/SingOutButton/SignOutButton";

type Props = { session: Session };

export function DashboardClient({ session }: Props) {
  const isAdmin = session.user?.role === "admin";
  const adminCard = isAdmin ? (
    <Link href="/admin/users" className={styles.cardLink}>
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

  const templatesCard = isAdmin ? (
    <Link href="/tools/templates" className={styles.cardLink}>
      <Card
        hoverable
        className={styles.card}
        title={<CardTitle icon={<SnippetsOutlined />} title="Шаблоны" />}
      >
        <Typography.Text type="secondary">
          Редактор шаблонов для дневника тренировок.
        </Typography.Text>
      </Card>
    </Link>
  ) : null;

  return (
    <div className={styles.wrapper}>
      <Card className={styles.panel}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <Typography.Title level={3} className={styles.paragraphTight}>
              Привет, {session.user?.name ?? session.user?.email}
            </Typography.Title>
            <Typography.Paragraph type="secondary" className={styles.paragraphTight}>
              Что планируем сегодня?
            </Typography.Paragraph>
          </div>
          <div className={styles.headerAction}>
            <SignOutButton />
          </div>
        </div>
        <div className={styles.cards}>
          {adminCard}
          {templatesCard}
          <Link href="/plan" className={styles.cardLink}>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<CalendarOutlined />} title="План" />}
            >
              <Typography.Text type="secondary">
                Планируйте цели и запланированные тренировки.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/diary" className={styles.cardLink}>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<BookOutlined />} title="Дневник" />}
            >
              <Typography.Text type="secondary">
                Записи, графики и метрики восстановления.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/profile/shoes" className={styles.cardLink}>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<ShoppingOutlined />} title="Обувь" />}
            >
              <Typography.Text type="secondary">
                Добавьте и редактируйте список обуви для тренировок.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/profile/records" className={styles.cardLink}>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<TrophyOutlined />} title="Рекорды" />}
            >
              <Typography.Text type="secondary">
                Заполните личные рекорды по дистанциям и добавьте ссылку на протокол.
              </Typography.Text>
            </Card>
          </Link>
          <Link href="/verify-telegram" className={styles.cardLink}>
            <Card
              hoverable
              className={styles.card}
              title={<CardTitle icon={<MessageOutlined />} title="Telegram" />}
            >
              <Typography.Text type="secondary">
                Получите код и свяжите Telegram для плана и рассылки.
              </Typography.Text>
            </Card>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function CardTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className={styles.cardTitle}>
      <span className={styles.cardTitleIcon}>{icon}</span>
      <Typography.Text strong className={styles.cardTitleText}>
        {title}
      </Typography.Text>
    </span>
  );
}
