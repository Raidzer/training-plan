"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Form, Input, Button, Typography, Space, Divider, Spin } from "antd";
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
  const [loading, setLoading] = useState(false);

  const [templateToAdd, setTemplateToAdd] = useState<number | null>(null);

  useEffect(() => {
    if (visible && userId) {
      setLoading(true);
      form.resetFields();

      Promise.all([getTemplates(userId), findMatchingTemplate(userId, taskText)])
        .then(([allTemplates, matches]) => {
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
            setBlocks([]);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setBlocks([]);
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
      // 1. Calculate result for ALL blocks first
      const blockOutputs = blocks.map((block) => {
        const template = templates.find((t) => t.id === block.templateId);
        if (!template) return { id: block.id, code: "", text: "", isInline: false };

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

        return {
          id: block.id,
          code: template.code || "",
          text: result.trim(),
          isInline: template.isInline || false,
        };
      });

      // 2. Perform Variable Substitution ({{CODE}})
      // We need to know which blocks were "consumed" to avoid printing them twice
      const consumedBlockIds = new Set<string>();

      const finalOutputs = blockOutputs.map((currentBlock, index) => {
        let text = currentBlock.text;

        // Find all {{CODE}} patterns in the current text
        const matches = text.match(/{{([A-Za-z0-9_]+)}}/g);
        if (matches) {
          matches.forEach((match) => {
            const code = match.replace(/{{|}}/g, "");

            // STRICT NEIGHBOR STRATEGY:
            // Look only at the *immediate next* block (skipping already consumed ones).

            // 1. Get all following blocks
            const followingBlocks = blockOutputs.slice(index + 1);

            // 2. Find the first one that hasn't been consumed yet
            const nextAvailableBlock = followingBlocks.find((b) => !consumedBlockIds.has(b.id));

            // 3. Check if this next neighbor matches the requested code
            if (nextAvailableBlock && nextAvailableBlock.code === code) {
              text = text.replace(match, nextAvailableBlock.text);
              consumedBlockIds.add(nextAvailableBlock.id);
            } else {
              text = text.replace(match, "");
            }
          });
        }
        return { ...currentBlock, text };
      });

      // 3. Filter out consumed blocks and empty results
      const visibleBlocks = finalOutputs.filter(
        (b) => !consumedBlockIds.has(b.id) && b.text.length > 0
      );

      // 4. Join blocks with intelligent separators (handling isInline)
      let finalReport = "";
      visibleBlocks.forEach((block, index) => {
        if (index === 0) {
          finalReport += block.text;
        } else {
          // If current block is inline, join with space.
          // If previous block allowed inline... wait, logic is:
          // "Is this block Inline?" -> it means "I attach myself to the previous one".
          if (block.isInline) {
            finalReport += " " + block.text;
          } else {
            finalReport += "\n\n" + block.text;
          }
        }
      });

      onApply(finalReport);
    });
  };

  return (
    <Modal
      title="Конструктор отчета (LEGO)"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={
        loading
          ? null
          : [
              <Button key="cancel" onClick={onCancel}>
                Отмена
              </Button>,
              <Button key="apply" type="primary" onClick={handleApply}>
                Применить
              </Button>,
            ]
      }
      classNames={{
        body: styles.modalBody,
      }}
      destroyOnHidden
    >
      <Spin spinning={loading} tip="Подбираем шаблоны...">
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

          {blocks.length === 0 && !loading && (
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
      </Spin>
    </Modal>
  );
};
