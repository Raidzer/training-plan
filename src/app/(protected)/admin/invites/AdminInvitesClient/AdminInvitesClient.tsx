"use client";

import { HomeOutlined, TeamOutlined } from "@ant-design/icons";
import { App, Button, Card } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CreatedInvitePanel } from "./components/CreatedInvitePanel/CreatedInvitePanel";
import { InviteCreateForm } from "./components/InviteCreateForm/InviteCreateForm";
import { InvitesTable } from "./components/InvitesTable/InvitesTable";
import { ADMIN_INVITES_LABELS } from "./constants/adminInvitesConstants";
import { useAdminInvites } from "./hooks/useAdminInvites";
import type { AdminInvitesClientProps } from "./types/adminInvitesTypes";
import styles from "./AdminInvitesClient.module.scss";

export function AdminInvitesClient({ invites }: AdminInvitesClientProps) {
  const { message: messageApi } = App.useApp();
  const { form, rows, creating, tokenById, lastInviteUrl, handleCopy, handleCreate } =
    useAdminInvites({
      invites,
      messageApi,
    });

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <PageHeader
          className={styles.pageHeader}
          title={ADMIN_INVITES_LABELS.title}
          subtitle={ADMIN_INVITES_LABELS.subtitle}
          actions={
            <>
              <Link href="/admin/users" passHref>
                <Button icon={<TeamOutlined />}>{ADMIN_INVITES_LABELS.usersButton}</Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button icon={<HomeOutlined />}>{ADMIN_INVITES_LABELS.dashboardButton}</Button>
              </Link>
            </>
          }
        />

        <InviteCreateForm form={form} creating={creating} onSubmit={handleCreate} />
        <CreatedInvitePanel inviteUrl={lastInviteUrl} onCopy={handleCopy} />
        <InvitesTable rows={rows} tokenById={tokenById} onCopy={handleCopy} />
      </Card>
    </div>
  );
}
