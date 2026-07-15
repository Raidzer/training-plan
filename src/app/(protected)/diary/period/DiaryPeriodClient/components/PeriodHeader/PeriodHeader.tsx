import { AppstoreOutlined, CalendarOutlined } from "@ant-design/icons";
import Link from "next/link";
import styles from "./PeriodHeader.module.scss";

type PeriodHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  dailyReportAction: string;
  dashboardAction: string;
};

export function PeriodHeader({
  eyebrow,
  title,
  subtitle,
  dailyReportAction,
  dashboardAction,
}: PeriodHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.actions} role="group" aria-label="Действия страницы">
        <Link href="/diary" className={styles.actionLink}>
          <CalendarOutlined aria-hidden />
          <span>{dailyReportAction}</span>
        </Link>
        <Link href="/dashboard" className={styles.actionLink}>
          <AppstoreOutlined aria-hidden />
          <span>{dashboardAction}</span>
        </Link>
      </div>
    </header>
  );
}
