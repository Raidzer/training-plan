"use client";

import {
  CheckCircleOutlined,
  HomeOutlined,
  LockOutlined,
  StopOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useState } from "react";
import styles from "./admin-users.module.scss";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  login: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type RoleMeta = {
  label: string;
  color?: string;
};

type Props = {
  users: AdminUserRow[];
};

type RoleFormValues = {
  role: string;
};

type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

const ROLE_META: Record<string, RoleMeta> = {
  admin: { label: "Администратор", color: "geekblue" },
  athlete: { label: "Атлет", color: "green" },
  coach: { label: "Тренер", color: "purple" },
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Администратор" },
  { value: "coach", label: "Тренер" },
  { value: "athlete", label: "Атлет" },
];

const PASSWORD_MIN_LENGTH = 6;

const getRoleMeta = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const meta = ROLE_META[normalized];
  if (meta) {
    return meta;
  }
  if (normalized.length === 0) {
    return { label: "Не задана" };
  }
  return { label: value };
};

const formatDate = (value: string) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("ru-RU");
};

const getUserLabel = (user: AdminUserRow) => {
  if (user.name) {
    return user.name;
  }
  if (user.email) {
    return user.email;
  }
  return `ID ${user.id}`;
};

const getApiError = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (!("error" in value)) {
    return null;
  }
  const error = (value as { error?: unknown }).error;
  if (typeof error !== "string") {
    return null;
  }
  return error;
};

const getApiErrorMessage = (value: unknown, fallback: string) => {
  const error = getApiError(value);
  if (!error) {
    return fallback;
  }
  switch (error) {
    case "unauthorized":
      return "Нужно войти в систему.";
    case "forbidden":
      return "Недостаточно прав для выполнения действия.";
    case "invalid_payload":
      return "Некорректные данные.";
    case "invalid_user_id":
      return "Некорректный идентификатор пользователя.";
    case "not_found":
      return "Пользователь не найден.";
    case "cannot_disable_self":
      return "Нельзя отключить собственного пользователя.";
    default:
      return fallback;
  }
};

export function AdminUsersClient({ users }: Props) {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const [roleForm] = Form.useForm<RoleFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [activeUser, setActiveUser] = useState<AdminUserRow | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);

  const updateRow = (userId: number, patch: Partial<AdminUserRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === userId) {
          return { ...row, ...patch };
        }
        return row;
      })
    );
  };

  const openRoleModal = (user: AdminUserRow) => {
    setActiveUser(user);
    roleForm.setFieldsValue({ role: user.role });
    setRoleModalOpen(true);
  };

  const openPasswordModal = (user: AdminUserRow) => {
    setActiveUser(user);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setActiveUser(null);
    roleForm.resetFields();
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setActiveUser(null);
    passwordForm.resetFields();
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      if (!activeUser) {
        messageApi.error("Не выбран пользователь для смены роли.");
        return;
      }
      setSavingRole(true);
      const res = await fetch(`/api/admin/users/${activeUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: values.role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(
          getApiErrorMessage(data, "Не удалось обновить роль.")
        );
        return;
      }
      updateRow(activeUser.id, { role: values.role });
      messageApi.success("Роль обновлена.");
      closeRoleModal();
    } catch (error) {
      return;
    } finally {
      setSavingRole(false);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (!activeUser) {
        messageApi.error("Не выбран пользователь для смены пароля.");
        return;
      }
      setSavingPassword(true);
      const res = await fetch(`/api/admin/users/${activeUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(
          getApiErrorMessage(data, "Не удалось обновить пароль.")
        );
        return;
      }
      messageApi.success("Пароль обновлен.");
      closePasswordModal();
    } catch (error) {
      return;
    } finally {
      setSavingPassword(false);
    }
  };

  const updateUserStatus = async (user: AdminUserRow, isActive: boolean) => {
    setSavingStatusId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(
          getApiErrorMessage(data, "Не удалось обновить статус.")
        );
        return;
      }
      updateRow(user.id, { isActive });
      messageApi.success(
        isActive ? "Пользователь включен." : "Пользователь отключен."
      );
    } catch (error) {
      messageApi.error("Не удалось обновить статус.");
    } finally {
      setSavingStatusId(null);
    }
  };

  const confirmDisableUser = (user: AdminUserRow) => {
    const label = getUserLabel(user);
    modalApi.confirm({
      title: `Отключить пользователя ${label}?`,
      content:
        "Пользователь не сможет входить в систему до обратного включения.",
      okText: "Отключить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: async () => {
        await updateUserStatus(user, false);
      },
    });
  };

  const handleStatusToggle = async (user: AdminUserRow) => {
    if (user.isActive) {
      confirmDisableUser(user);
      return;
    }
    await updateUserStatus(user, true);
  };

  const activeUserLabel = activeUser ? getUserLabel(activeUser) : "пользователя";

  const columns: ColumnsType<AdminUserRow> = [
    {
      title: "Пользователь",
      key: "user",
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">{record.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Логин",
      dataIndex: "login",
      key: "login",
    },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (value) => {
        const meta = getRoleMeta(String(value ?? ""));
        return meta.color ? (
          <Tag color={meta.color}>{meta.label}</Tag>
        ) : (
          <Tag>{meta.label}</Tag>
        );
      },
    },
    {
      title: "Создан",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDate(String(value ?? "")),
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      key: "isActive",
      render: (value) => (
        <Tag color={value ? "green" : "red"}>
          {value ? "Активен" : "Отключен"}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => {
        const isActive = record.isActive;
        const statusLabel = isActive ? "Отключить" : "Включить";
        const statusIcon = isActive ? <StopOutlined /> : <CheckCircleOutlined />;
        return (
          <Space size="small" wrap>
            <Button
              size="small"
              icon={<UserSwitchOutlined />}
              onClick={() => openRoleModal(record)}
            >
              Роль
            </Button>
            <Button
              size="small"
              icon={<LockOutlined />}
              onClick={() => openPasswordModal(record)}
            >
              Пароль
            </Button>
            <Button
              size="small"
              danger={isActive}
              icon={statusIcon}
              loading={savingStatusId === record.id}
              onClick={() => handleStatusToggle(record)}
            >
              {statusLabel}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <Typography.Title level={3} className={styles.title}>
              Пользователи
            </Typography.Title>
            <Typography.Paragraph type="secondary" className={styles.subtitle}>
              Список зарегистрированных пользователей и их текущих ролей.
            </Typography.Paragraph>
          </div>
          <Space size="small">
            <Link href="/dashboard" passHref>
              <Button icon={<HomeOutlined />}>В кабинет</Button>
            </Link>
          </Space>
        </div>
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
        <Modal
          title={`Сменить роль: ${activeUserLabel}`}
          open={roleModalOpen}
          onOk={handleRoleSubmit}
          onCancel={closeRoleModal}
          okText="Сохранить"
          cancelText="Отмена"
          confirmLoading={savingRole}
          okButtonProps={{ disabled: !activeUser }}
        >
          <Form form={roleForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="role"
              label="Роль"
              rules={[{ required: true, message: "Выберите роль" }]}
            >
              <Select options={ROLE_OPTIONS} placeholder="Выберите роль" />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={`Сменить пароль: ${activeUserLabel}`}
          open={passwordModalOpen}
          onOk={handlePasswordSubmit}
          onCancel={closePasswordModal}
          okText="Сохранить"
          cancelText="Отмена"
          confirmLoading={savingPassword}
          okButtonProps={{ disabled: !activeUser }}
        >
          <Form form={passwordForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="newPassword"
              label="Новый пароль"
              rules={[
                { required: true, message: "Введите новый пароль" },
                {
                  min: PASSWORD_MIN_LENGTH,
                  message: `Минимум ${PASSWORD_MIN_LENGTH} символов`,
                },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Повторите пароль"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Повторите пароль" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const original = getFieldValue("newPassword");
                    if (!value || value === original) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Пароли не совпадают"));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
