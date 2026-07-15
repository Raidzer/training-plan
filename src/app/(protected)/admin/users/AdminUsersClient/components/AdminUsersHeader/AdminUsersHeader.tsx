import { AppstoreOutlined, UserAddOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import styles from "./AdminUsersHeader.module.scss";

export function AdminUsersHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{ADMIN_USERS_LABELS.eyebrow}</span>
        <h1 className={styles.title}>{ADMIN_USERS_LABELS.title}</h1>
        <p className={styles.subtitle}>{ADMIN_USERS_LABELS.subtitle}</p>
      </div>

      <nav className={styles.actions} aria-label="Навигация раздела пользователей">
        <Link href="/admin/invites" className={styles.primaryLink}>
          <UserAddOutlined aria-hidden />
          <span>{ADMIN_USERS_LABELS.invitesButton}</span>
        </Link>
        <Link href="/dashboard" className={styles.secondaryLink}>
          <AppstoreOutlined aria-hidden />
          <span>{ADMIN_USERS_LABELS.dashboardButton}</span>
        </Link>
      </nav>
    </header>
  );
}
