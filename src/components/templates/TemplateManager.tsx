"use client";

import React, { useState } from "react";
import { Table, Button, Space, Popconfirm, Tag, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { deleteTemplate } from "@/app/actions/diaryTemplates";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TemplateManagerProps = {
  initialTemplates: DiaryResultTemplate[];
  userId: number;
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ initialTemplates, userId }) => {
  const [templates, setTemplates] = useState(initialTemplates);
  const { message } = App.useApp();
  const router = useRouter();

  const columns = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Паттерны",
      dataIndex: "matchPattern",
      key: "matchPattern",
      render: (text: string) => (text ? text.split(";").map((t) => <Tag key={t}>{t}</Tag>) : "-"),
    },

    {
      title: "Действия",
      key: "action",
      render: (_: any, record: DiaryResultTemplate) => (
        <Space size="middle">
          <Link href={`/tools/templates/${record.id}`}>
            <Button icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Удалить шаблон?"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.userId === null}
          >
            <Button icon={<DeleteOutlined />} danger disabled={record.userId === null} />
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
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Link href="/tools/templates/new">
          <Button type="primary" icon={<PlusOutlined />}>
            Создать шаблон
          </Button>
        </Link>
      </Space>
      <Table columns={columns} dataSource={templates} rowKey="id" />
    </div>
  );
};
