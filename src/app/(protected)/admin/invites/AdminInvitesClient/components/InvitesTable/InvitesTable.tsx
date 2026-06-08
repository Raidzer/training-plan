"use client";

import { CopyOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import {
  ADMIN_INVITES_LABELS,
  ROLE_META,
  STATUS_META,
} from "../../constants/adminInvitesConstants";
import type { AdminInviteRow, InviteStatus, InviteUser } from "../../types/adminInvitesTypes";
import { buildInviteUrl, formatDate, getUserLabel } from "../../utils/adminInvitesUtils";
import styles from "./InvitesTable.module.scss";

type InvitesTableProps = {
  rows: AdminInviteRow[];
  tokenById: Record<number, string>;
  onCopy: (value: string) => void;
};

export function InvitesTable({ rows, tokenById, onCopy }: InvitesTableProps) {
  const columns: ColumnsType<AdminInviteRow> = useMemo(
    () => [
      {
        title: ADMIN_INVITES_LABELS.linkColumn,
        key: "link",
        className: styles.linkColumn,
        width: 160,
        render: (_, record) => {
          const token = tokenById[record.id];

          if (!token) {
            return (
              <Typography.Text type="secondary">
                {ADMIN_INVITES_LABELS.unavailableLink}
              </Typography.Text>
            );
          }

          const inviteUrl = buildInviteUrl(token);
          return (
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                onCopy(inviteUrl);
              }}
            >
              {ADMIN_INVITES_LABELS.copyButton}
            </Button>
          );
        },
      },
      {
        title: ADMIN_INVITES_LABELS.statusColumn,
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (value: InviteStatus) => {
          const meta = STATUS_META[value];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: ADMIN_INVITES_LABELS.roleColumn,
        dataIndex: "role",
        key: "role",
        width: 120,
        render: (value) => {
          const meta = ROLE_META[String(value)] ?? { label: String(value) };
          return meta.color ? <Tag color={meta.color}>{meta.label}</Tag> : <Tag>{meta.label}</Tag>;
        },
      },
      {
        title: ADMIN_INVITES_LABELS.createdAtColumn,
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (value) => formatDate(String(value ?? "")),
      },
      {
        title: ADMIN_INVITES_LABELS.expiresAtColumn,
        dataIndex: "expiresAt",
        key: "expiresAt",
        width: 180,
        render: (value) => formatDate(String(value ?? "")),
      },
      {
        title: ADMIN_INVITES_LABELS.createdByColumn,
        dataIndex: "createdBy",
        key: "createdBy",
        width: 180,
        render: (value: InviteUser | null) => (
          <Typography.Text className={styles.userCell}>{getUserLabel(value)}</Typography.Text>
        ),
      },
      {
        title: ADMIN_INVITES_LABELS.usedAtColumn,
        dataIndex: "usedAt",
        key: "usedAt",
        width: 180,
        responsive: ["lg"],
        render: (value) => formatDate(value ?? null),
      },
      {
        title: ADMIN_INVITES_LABELS.usedByColumn,
        dataIndex: "usedBy",
        key: "usedBy",
        width: 180,
        responsive: ["lg"],
        render: (value: InviteUser | null) => (
          <Typography.Text className={styles.userCell}>{getUserLabel(value)}</Typography.Text>
        ),
      },
    ],
    [onCopy, tokenById]
  );

  return (
    <Table
      className={styles.table}
      rowKey={(record) => record.id}
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 950 }}
    />
  );
}
