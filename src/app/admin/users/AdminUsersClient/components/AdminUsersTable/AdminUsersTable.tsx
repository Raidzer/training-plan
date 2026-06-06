"use client";

import {
  CheckCircleOutlined,
  LockOutlined,
  StopOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";
import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import type { AdminUserRow } from "../../types/adminUsersTypes";
import { formatDate, getGenderLabel, getRoleMeta } from "../../utils/adminUsersUtils";
import styles from "./AdminUsersTable.module.scss";

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  savingStatusId: number | null;
  onOpenRoleModal: (user: AdminUserRow) => void;
  onOpenPasswordModal: (user: AdminUserRow) => void;
  onStatusToggle: (user: AdminUserRow) => void;
};

export function AdminUsersTable({
  rows,
  savingStatusId,
  onOpenRoleModal,
  onOpenPasswordModal,
  onStatusToggle,
}: AdminUsersTableProps) {
  const columns: ColumnsType<AdminUserRow> = useMemo(
    () => [
      {
        title: ADMIN_USERS_LABELS.userColumn,
        key: "user",
        width: 280,
        render: (_, record) => (
          <Space orientation="vertical" size={0} className={styles.userCell}>
            <Typography.Text strong>
              {record.name} {record.lastName}
            </Typography.Text>
            <Typography.Text type="secondary">{record.email}</Typography.Text>
          </Space>
        ),
      },
      {
        title: ADMIN_USERS_LABELS.genderColumn,
        dataIndex: "gender",
        key: "gender",
        width: 110,
        responsive: ["lg"],
        render: (value) => getGenderLabel(String(value ?? "")),
      },
      {
        title: ADMIN_USERS_LABELS.loginColumn,
        dataIndex: "login",
        key: "login",
        width: 140,
        render: (value) => (
          <Typography.Text className={styles.nowrap}>{String(value ?? "-")}</Typography.Text>
        ),
      },
      {
        title: ADMIN_USERS_LABELS.roleColumn,
        dataIndex: "role",
        key: "role",
        width: 150,
        render: (value) => {
          const meta = getRoleMeta(String(value ?? ""));
          return meta.color ? <Tag color={meta.color}>{meta.label}</Tag> : <Tag>{meta.label}</Tag>;
        },
      },
      {
        title: ADMIN_USERS_LABELS.createdAtColumn,
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        responsive: ["xl"],
        render: (value) => formatDate(String(value ?? "")),
      },
      {
        title: ADMIN_USERS_LABELS.statusColumn,
        dataIndex: "isActive",
        key: "isActive",
        width: 130,
        render: (value) => (
          <Tag color={value ? "green" : "red"}>
            {value ? ADMIN_USERS_LABELS.activeStatus : ADMIN_USERS_LABELS.disabledStatus}
          </Tag>
        ),
      },
      {
        title: ADMIN_USERS_LABELS.actionsColumn,
        key: "actions",
        width: 360,
        render: (_, record) => {
          const isActive = record.isActive;
          const statusLabel = isActive
            ? ADMIN_USERS_LABELS.disableButton
            : ADMIN_USERS_LABELS.enableButton;
          const statusIcon = isActive ? <StopOutlined /> : <CheckCircleOutlined />;

          return (
            <Space size="small" wrap>
              <Link href={`/admin/users/${record.id}/records`}>
                <Button size="small" icon={<TrophyOutlined />}>
                  {ADMIN_USERS_LABELS.recordsButton}
                </Button>
              </Link>
              <Button
                size="small"
                icon={<UserSwitchOutlined />}
                onClick={() => {
                  onOpenRoleModal(record);
                }}
              >
                {ADMIN_USERS_LABELS.roleButton}
              </Button>
              <Button
                size="small"
                icon={<LockOutlined />}
                onClick={() => {
                  onOpenPasswordModal(record);
                }}
              >
                {ADMIN_USERS_LABELS.passwordButton}
              </Button>
              <Button
                size="small"
                danger={isActive}
                icon={statusIcon}
                loading={savingStatusId === record.id}
                onClick={() => {
                  onStatusToggle(record);
                }}
              >
                {statusLabel}
              </Button>
            </Space>
          );
        },
      },
    ],
    [onOpenPasswordModal, onOpenRoleModal, onStatusToggle, savingStatusId]
  );

  return (
    <Table
      className={styles.table}
      rowKey={(record) => record.id}
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1040 }}
    />
  );
}
