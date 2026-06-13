"use client";

import {
  CheckCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  LockOutlined,
  StopOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Space, Table, Tag, Typography, type MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";
import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import type { AdminUserRow } from "../../types/adminUsersTypes";
import {
  canDeleteAdminUser,
  formatDate,
  getGenderLabel,
  getRoleMeta,
} from "../../utils/adminUsersUtils";
import styles from "./AdminUsersTable.module.scss";

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  savingStatusId: number | null;
  clearingUserDataId: number | null;
  deletingUserId: number | null;
  onOpenRoleModal: (user: AdminUserRow) => void;
  onOpenPasswordModal: (user: AdminUserRow) => void;
  onStatusToggle: (user: AdminUserRow) => void;
  onClearUserTrainingData: (user: AdminUserRow) => void;
  onDeleteUser: (user: AdminUserRow) => void;
};

export function AdminUsersTable({
  rows,
  savingStatusId,
  clearingUserDataId,
  deletingUserId,
  onOpenRoleModal,
  onOpenPasswordModal,
  onStatusToggle,
  onClearUserTrainingData,
  onDeleteUser,
}: AdminUsersTableProps) {
  const columns: ColumnsType<AdminUserRow> = useMemo(
    () => [
      {
        title: ADMIN_USERS_LABELS.userColumn,
        key: "user",
        width: 230,
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
        title: ADMIN_USERS_LABELS.lastActiveAtColumn,
        dataIndex: "lastActiveAt",
        key: "lastActiveAt",
        width: 190,
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
        width: 180,
        fixed: "right",
        render: (_, record) => {
          const isActive = record.isActive;
          const statusLabel = isActive
            ? ADMIN_USERS_LABELS.disableButton
            : ADMIN_USERS_LABELS.enableButton;
          const statusIcon = isActive ? <StopOutlined /> : <CheckCircleOutlined />;
          const canDeleteUser = canDeleteAdminUser(record);
          const isStatusSaving = savingStatusId === record.id;
          const isClearingUserData = clearingUserDataId === record.id;
          const isDeletingUser = deletingUserId === record.id;
          const isActionLoading = isStatusSaving || isClearingUserData || isDeletingUser;
          const menuItems: MenuProps["items"] = [
            {
              key: "role",
              icon: <UserSwitchOutlined />,
              label: ADMIN_USERS_LABELS.roleButton,
              onClick: () => {
                onOpenRoleModal(record);
              },
            },
            {
              key: "password",
              icon: <LockOutlined />,
              label: ADMIN_USERS_LABELS.passwordButton,
              onClick: () => {
                onOpenPasswordModal(record);
              },
            },
            {
              key: "status",
              danger: isActive,
              disabled: isStatusSaving,
              icon: statusIcon,
              label: statusLabel,
              onClick: () => {
                onStatusToggle(record);
              },
            },
            {
              type: "divider",
            },
            {
              key: "clear-training-data",
              danger: true,
              disabled: isClearingUserData,
              icon: <ClearOutlined />,
              label: ADMIN_USERS_LABELS.clearTrainingDataButton,
              onClick: () => {
                onClearUserTrainingData(record);
              },
            },
            {
              key: "delete",
              danger: true,
              disabled: !canDeleteUser || isDeletingUser,
              icon: <DeleteOutlined />,
              label: ADMIN_USERS_LABELS.deleteButton,
              onClick: () => {
                onDeleteUser(record);
              },
            },
          ];

          return (
            <Space size="small" className={styles.actionsCell}>
              <Link href={`/admin/users/${record.id}/records`}>
                <Button size="small" icon={<TrophyOutlined />}>
                  {ADMIN_USERS_LABELS.recordsButton}
                </Button>
              </Link>
              <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  aria-label={ADMIN_USERS_LABELS.actionsMenuButton}
                  title={ADMIN_USERS_LABELS.actionsMenuButton}
                  size="small"
                  icon={<EllipsisOutlined />}
                  loading={isActionLoading}
                />
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [
      clearingUserDataId,
      deletingUserId,
      onClearUserTrainingData,
      onDeleteUser,
      onOpenPasswordModal,
      onOpenRoleModal,
      onStatusToggle,
      savingStatusId,
    ]
  );

  return (
    <Table
      className={styles.table}
      rowKey={(record) => record.id}
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1310 }}
    />
  );
}
