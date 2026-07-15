import { AppstoreOutlined, TeamOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ADMIN_INVITES_LABELS } from "../../constants/adminInvitesConstants";
import styles from "./AdminInvitesHeader.module.scss";

export function AdminInvitesHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{ADMIN_INVITES_LABELS.eyebrow}</span>
        <h1 className={styles.title}>{ADMIN_INVITES_LABELS.title}</h1>
        <p className={styles.subtitle}>{ADMIN_INVITES_LABELS.subtitle}</p>
      </div>

      <nav className={styles.actions} aria-label="Навигация раздела приглашений">
        <Link href="/admin/users" className={styles.primaryLink}>
          <TeamOutlined aria-hidden />
          <span>{ADMIN_INVITES_LABELS.usersButton}</span>
        </Link>
        <Link href="/dashboard" className={styles.secondaryLink}>
          <AppstoreOutlined aria-hidden />
          <span>{ADMIN_INVITES_LABELS.dashboardButton}</span>
        </Link>
      </nav>
    </header>
  );
}
