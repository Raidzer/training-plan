"use client";

import {
  CopyOutlined,
  HomeOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type FormProps,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./admin-invites.module.scss";

export type InviteUser = {
  id: number;
  name: string;
  email: string;
};

export type InviteStatus = "active" | "used" | "expired";

export type AdminInviteRow = {
  id: number;
  role: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: InviteStatus;
  createdBy: InviteUser | null;
  usedBy: InviteUser | null;
};

type Props = {
  invites: AdminInviteRow[];
};

type InviteFormValues = {
  role: "athlete" | "coach";
};

type Meta = {
  label: string;
  color?: string;
};

type StatusMeta = {
  label: string;
  color: string;
};

const ROLE_META: Record<string, Meta> = {
  athlete: { label: "Атлет", color: "green" },
  coach: { label: "Тренер", color: "purple" },
};

const STATUS_META: Record<InviteStatus, StatusMeta> = {
  active: { label: "Активна", color: "green" },
  used: { label: "Использована", color: "blue" },
  expired: { label: "Истекла", color: "red" },
};

const ROLE_OPTIONS = [
  { value: "athlete", label: "Атлет" },
  { value: "coach", label: "Тренер" },
];

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("ru-RU");
};

const getUserLabel = (user: InviteUser | null) => {
  if (!user) {
    return "-";
  }
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
      return "Недостаточно прав для создания приглашений.";
    case "invalid_payload":
      return "Некорректные данные.";
    case "create_failed":
      return "Не удалось создать ссылку.";
    default:
      return fallback;
  }
};

const buildInviteUrl = (token: string) => {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}/register?invite=${token}`;
};

export function AdminInvitesClient({ invites }: Props) {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm<InviteFormValues>();
  const [rows, setRows] = useState<AdminInviteRow[]>(invites);
  const [creating, setCreating] = useState(false);
  const [tokenById, setTokenById] = useState<Record<number, string>>({});
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);

  const lastInviteUrl = useMemo(() => {
    if (!lastCreatedId) {
      return "";
    }
    const token = tokenById[lastCreatedId];
    if (!token) {
      return "";
    }
    return buildInviteUrl(token);
  }, [lastCreatedId, tokenById]);

  const handleCopy = async (value: string) => {
    try {
      if (!value) {
        messageApi.error("Ссылка недоступна.");
        return;
      }
      if (!navigator.clipboard) {
        throw new Error("clipboard-not-available");
      }
      await navigator.clipboard.writeText(value);
      messageApi.success("Ссылка скопирована.");
    } catch (error) {
      messageApi.error("Не удалось скопировать ссылку.");
    }
  };

  const handleCreate: FormProps<InviteFormValues>["onFinish"] = async (
    values
  ) => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(
          getApiErrorMessage(data, "Не удалось создать ссылку.")
        );
        return;
      }
      if (!data || typeof data !== "object") {
        messageApi.error("Не удалось создать ссылку.");
        return;
      }
      const invite = (data as { invite?: AdminInviteRow }).invite;
      const token = (data as { token?: string }).token;
      if (!invite || !token) {
        messageApi.error("Не удалось создать ссылку.");
        return;
      }
      setRows((prev) => {
        const filtered = prev.filter((row) => row.id !== invite.id);
        return [invite, ...filtered];
      });
      setTokenById((prev) => ({ ...prev, [invite.id]: token }));
      setLastCreatedId(invite.id);
      form.resetFields();
      messageApi.success("Ссылка создана.");
    } catch (error) {
      messageApi.error("Не удалось создать ссылку.");
    } finally {
      setCreating(false);
    }
  };

  const columns: ColumnsType<AdminInviteRow> = [
    {
      title: "Ссылка",
      key: "link",
      className: styles.linkColumn,
      width: 160,
      render: (_, record) => {
        const token = tokenById[record.id];
        if (!token) {
          return (
            <Typography.Text type="secondary">
              Недоступна
            </Typography.Text>
          );
        }
        const inviteUrl = buildInviteUrl(token);
        return (
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(inviteUrl)}
          >
            Копировать
          </Button>
        );
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (value: InviteStatus) => {
        const meta = STATUS_META[value];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (value) => {
        const meta = ROLE_META[String(value)] ?? { label: String(value) };
        return meta.color ? (
          <Tag color={meta.color}>{meta.label}</Tag>
        ) : (
          <Tag>{meta.label}</Tag>
        );
      },
    },
    {
      title: "Создана",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDate(String(value ?? "")),
    },
    {
      title: "Истекает",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (value) => formatDate(String(value ?? "")),
    },
    {
      title: "Создал",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (value: InviteUser | null) => getUserLabel(value),
    },
    {
      title: "Использована",
      dataIndex: "usedAt",
      key: "usedAt",
      render: (value) => formatDate(value ?? null),
    },
    {
      title: "Использовал",
      dataIndex: "usedBy",
      key: "usedBy",
      render: (value: InviteUser | null) => getUserLabel(value),
    },
  ];

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <Typography.Title level={3} className={styles.title}>
              Приглашения
            </Typography.Title>
            <Typography.Paragraph type="secondary" className={styles.subtitle}>
              Ссылки одноразовые и действуют 24 часа. Полный URL доступен только
              сразу после создания.
            </Typography.Paragraph>
          </div>
          <Space size="small" className={styles.headerActions}>
            <Link href="/admin/users" passHref>
              <Button icon={<TeamOutlined />}>Пользователи</Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button icon={<HomeOutlined />}>В кабинет</Button>
            </Link>
          </Space>
        </div>

        <Form<InviteFormValues>
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
        >
          <div className={styles.formRow}>
            <Form.Item
              name="role"
              label="Роль"
              rules={[{ required: true, message: "Выберите роль" }]}
            >
              <Select options={ROLE_OPTIONS} placeholder="Выберите роль" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              loading={creating}
            >
              Создать ссылку
            </Button>
          </div>
        </Form>

        {lastInviteUrl ? (
          <div className={styles.createdInvite}>
            <Typography.Text strong>Ссылка создана</Typography.Text>
            <div className={styles.linkRow}>
              <Input
                className={styles.linkInput}
                value={lastInviteUrl}
                readOnly
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(lastInviteUrl)}
              >
                Копировать
              </Button>
            </div>
            <Typography.Text type="secondary">
              Ссылка одноразовая и действует 24 часа.
            </Typography.Text>
          </div>
        ) : null}

        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
