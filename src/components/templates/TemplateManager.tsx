"use client";

import React, { useState } from "react";
import { Table, Button, Space, Drawer, Popconfirm, Tag, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { createTemplate, updateTemplate, deleteTemplate } from "@/app/actions/diaryTemplates";
import { TemplateEditor } from "./TemplateEditor";
import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";

type TemplateManagerProps = {
  initialTemplates: DiaryResultTemplate[];
  userId: number;
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ initialTemplates, userId }) => {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DiaryResultTemplate | null>(null);
  const { message } = App.useApp();

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
      title: "Тип",
      key: "type",
      render: (_: any, record: DiaryResultTemplate) =>
        record.userId === null ? (
          <Tag color="blue">Системный</Tag>
        ) : (
          <Tag color="geekblue">Личный</Tag>
        ),
    },
    {
      title: "Действия",
      key: "action",
      render: (_: any, record: DiaryResultTemplate) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.userId === null && userId !== 1} // Assuming user ID 1 is admin/owner, strictly strictly speaking only owner can edit system templates.
            // For now, let's just say only personal templates are editable by user unless they are admin, but we don't have admin flag here easily.
            // Let's rely on simple userId check for now: can edit if it's yours OR if it's system and you are... well, let's just check ownership.
            // Actually, system templates (userId=null) should probably only be editable by admins.
          />
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

  const handleEdit = (template: DiaryResultTemplate) => {
    setEditingTemplate(template);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    message.success("Удалено");
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsDrawerOpen(true);
  };

  const handleSave = async (values: any) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, values);
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? { ...t, ...values } : t))
      );
    } else {
      // Need to reload to get ID or just rely on server revalidation?
      // Server action revalidates path, so router.refresh() might be needed in parent or here
      await createTemplate({ ...values, userId });
      // Ideally we fetch again, but for now simple refresh page or Optimistic UI
      window.location.reload();
    }
    setIsDrawerOpen(false);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Создать шаблон
        </Button>
      </Space>
      <Table columns={columns} dataSource={templates} rowKey="id" />

      <Drawer
        title={editingTemplate ? "Редактировать шаблон" : "Новый шаблон"}
        size="large"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        styles={{
          body: {
            paddingBottom: 80,
          },
        }}
      >
        <TemplateEditor
          initialValues={editingTemplate || {}}
          onSave={handleSave}
          onCancel={() => setIsDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};
