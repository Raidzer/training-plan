"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Form, Input, Button, Typography, Space, Divider } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { findMatchingTemplate, getTemplates } from "@/app/actions/diaryTemplates";
import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";
import styles from "./TemplateConstructorModal.module.scss";

const { Text } = Typography;
const { Option } = Select;

type TemplateConstructorModalProps = {
  visible: boolean;
  onCancel: () => void;
  onApply: (resultText: string) => void;
  taskText: string;
  userId: number;
  messageApi: MessageInstance;
};

type Block = {
  id: string;
  templateId: number;
  values: Record<string, any>;
};

export const TemplateConstructorModal: React.FC<TemplateConstructorModalProps> = ({
  visible,
  onCancel,
  onApply,
  taskText,
  userId,
  messageApi,
}) => {
  const [templates, setTemplates] = useState<DiaryResultTemplate[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [form] = Form.useForm();

  const [templateToAdd, setTemplateToAdd] = useState<number | null>(null);

  useEffect(() => {
    if (visible && userId) {
      // Reset form when opening to clear previous state
      // We wrap in setTimeout to ensure Form is mounted if Modal lazy loads,
      // though usually useEffect runs after mount.
      // But safe bet is just to assume if we are visible, we can reset.
      // However, to avoid "not connected" on very first render if race condition:
      form.resetFields();

      Promise.all([getTemplates(userId), findMatchingTemplate(userId, taskText)]).then(
        ([allTemplates, matches]) => {
          setTemplates(allTemplates);

          if (matches.length > 0) {
            const newBlocks = matches.map((t) => ({
              id: Math.random().toString(36).substr(2, 9),
              templateId: t.id,
              values: {},
            }));
            setBlocks(newBlocks);
            messageApi.success(`Найдено подходящих шаблонов: ${matches.length}`);
          } else {
            // Start empty
            setBlocks([]);
          }
        }
      );
    } else {
      // Reset when closed
      setBlocks([]);
      // Don't call form.resetFields() here because Modal content might be unmounted/hidden
      // and trigger "Instance ... is not connected" warning.
    }
  }, [visible, userId, taskText, messageApi, form]);

  const addBlock = (templateId: number) => {
    setBlocks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        templateId,
        values: {},
      },
    ]);
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleApply = () => {
    form.validateFields().then((allValues) => {
      const results = blocks.map((block) => {
        const template = templates.find((t) => t.id === block.templateId);
        if (!template) return "";

        let result = template.outputTemplate;
        const schema = (template.schema as any[]) || [];

        schema.forEach((field) => {
          const formKey = `${block.id}_${field.key}`;
          let value = allValues[formKey];

          if (value === undefined || value === null) {
            value = "";
          }

          if (field.type === "list" && Array.isArray(value)) {
            value = value.join("; ");
          }

          result = result.replace(new RegExp(`{{${field.key}}}`, "g"), String(value));
        });

        return result.trim();
      });

      const finalReport = results.filter((r) => r.length > 0).join("\n\n");
      onApply(finalReport);
    });
  };

  return (
    <Modal
      title="Конструктор отчета (LEGO)"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Применить
        </Button>,
      ]}
      classNames={{
        body: styles.modalBody,
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <div className={styles.modalContent}>
          {blocks.map((block, index) => {
            const template = templates.find((t) => t.id === block.templateId);
            const schema = (template?.schema as any[]) || [];

            return (
              <div key={block.id} className={styles.blockContainer}>
                <div className={styles.blockHeader}>
                  <Text strong className={styles.templateName}>
                    Блок {index + 1}: {template?.name}
                  </Text>
                  <Button type="text" danger size="small" onClick={() => removeBlock(block.id)}>
                    Удалить
                  </Button>
                </div>

                <div className={styles.blockGrid}>
                  {schema.map((field: any) => (
                    <Form.Item
                      key={field.key}
                      name={`${block.id}_${field.key}`}
                      label={field.label + (field.suffix ? ` (${field.suffix})` : "")}
                      className={styles.formItem}
                    >
                      {field.type === "list" ? (
                        <Input placeholder="..." size="small" />
                      ) : (
                        <Input size="small" />
                      )}
                    </Form.Item>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {blocks.length === 0 && (
          <div className={styles.emptyState}>Шаблоны не найдены. Добавьте блок вручную.</div>
        )}

        <Divider dashed>Добавить блок</Divider>

        <Space className={styles.addBlockContainer}>
          <Select
            className={styles.selectTemplate}
            placeholder="Выберите шаблон"
            value={templateToAdd}
            onChange={setTemplateToAdd}
            optionFilterProp="children"
            showSearch
          >
            {templates.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>
          <Button
            type="dashed"
            onClick={() => {
              if (templateToAdd) {
                addBlock(templateToAdd);
                setTemplateToAdd(null);
              }
            }}
            disabled={!templateToAdd}
          >
            + Добавить
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};
