"use client";

import React, { useState } from "react";
import { Table, Button, Space, Popconfirm, Tag, App, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { deleteTemplate } from "@/app/actions/diaryTemplates";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./TemplateManager.module.scss";

type TemplateManagerProps = {
  initialTemplates: DiaryResultTemplate[];
  userId: number;
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ initialTemplates }) => {
  const [templates, setTemplates] = useState(initialTemplates);
  const { message } = App.useApp();
  const router = useRouter();

  const columns: ColumnsType<DiaryResultTemplate> = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      width: 260,
      render: (value) => (
        <Typography.Text strong className={styles.templateName}>
          {String(value ?? "-")}
        </Typography.Text>
      ),
    },
    {
      title: "Паттерны",
      dataIndex: "matchPattern",
      key: "matchPattern",
      width: 380,
      render: (text: string | null) =>
        text ? (
          <div className={styles.patternTags}>
            {text
              .split(";")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
          </div>
        ) : (
          "-"
        ),
    },

    {
      title: "Действия",
      key: "action",
      width: 140,
      render: (_, record) => (
        <Space size="small" className={styles.actions}>
          <Link href={`/tools/templates/${record.id}`}>
            <Button size="small" icon={<EditOutlined />} aria-label="Редактировать" />
          </Link>
          <Popconfirm
            title="Удалить шаблон?"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.userId === null}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              disabled={record.userId === null}
              aria-label="Удалить"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    message.success("Удалено");
    router.refresh();
  };

  return (
    <div className={styles.manager}>
      <Space className={styles.toolbar}>
        <Link href="/tools/templates/new">
          <Button type="primary" icon={<PlusOutlined />}>
            Создать шаблон
          </Button>
        </Link>
      </Space>
      <Table
        className={styles.table}
        columns={columns}
        dataSource={templates}
        rowKey="id"
        scroll={{ x: 780 }}
      />
    </div>
  );
};
