import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { RecordsClient } from "@/app/profile/records/RecordsClient/RecordsClient";
import { ADMIN_USER_RECORDS_LABELS } from "./constants/adminUserRecordsConstants";
import styles from "./AdminUserRecordsPage.module.scss";

type AdminUserRecordsContentProps = {
  userId: number;
  userLabel: string;
};

export function AdminUserRecordsContent({ userId, userLabel }: AdminUserRecordsContentProps) {
  return (
    <main className={styles.page}>
      <div className={styles.actions}>
        <Link href="/admin/users">
          <Button icon={<ArrowLeftOutlined />}>{ADMIN_USER_RECORDS_LABELS.backToUsers}</Button>
        </Link>
      </div>

      <h3 className={styles.title}>
        {ADMIN_USER_RECORDS_LABELS.titlePrefix}: {userLabel}
      </h3>

      <RecordsClient apiUrl={`/api/admin/users/${userId}/records`} />
    </main>
  );
}
