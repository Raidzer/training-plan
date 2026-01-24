"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Form, Input, Button, Typography, Space, Divider, Spin } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";
import { findMatchingTemplate, getTemplates } from "@/app/actions/diaryTemplates";
import { processTemplate } from "@/utils/templateEngine";
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

// Helper Component for Time Input
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TimeInput = ({ value, onChange, ...props }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    let formatted = raw;

    // MM:SS
    if (raw.length > 2) {
      formatted = raw.slice(0, 2) + ":" + raw.slice(2);
    }
    // HH:MM:SS (if more than 4 digits)
    if (raw.length > 4) {
      formatted = formatted.slice(0, 5) + ":" + raw.slice(4);
    }
    // Limit length (e.g. 00:00:00)
    if (formatted.length > 8) {
      formatted = formatted.slice(0, 8);
    }

    onChange?.(formatted);
  };

  return <Input {...props} value={value} onChange={handleChange} placeholder="мм:сс" />;
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
      const blockOutputs = blocks.map((block) => {
        const template = templates.find((t) => t.id === block.templateId);
        if (!template) return { id: block.id, code: "", text: "", isInline: false };

        const formValues: Record<string, any> = {};

        Object.keys(allValues).forEach((key) => {
          if (key.startsWith(`${block.id}_`)) {
            const fieldKey = key.replace(`${block.id}_`, "");
            formValues[fieldKey] = allValues[key];
          }
        });

        const result = processTemplate(template, formValues);

        return {
          id: block.id,
          code: template.code || "",
          text: result.trim(),
          isInline: template.isInline || false,
        };
      });

      const consumedBlockIds = new Set<string>();

      const finalOutputs = blockOutputs.map((currentBlock, index) => {
        let text = currentBlock.text;

        const matches = text.match(/{{([A-Za-z0-9_]+)}}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const code = match.replace(/{{|}}/g, "");

            const followingBlocks = blockOutputs.slice(index + 1);

            const nextAvailableBlock = followingBlocks.find((b) => !consumedBlockIds.has(b.id));

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

      const visibleBlocks = finalOutputs.filter(
        (b) => !consumedBlockIds.has(b.id) && b.text.length > 0
      );

      let finalReport = "";
      visibleBlocks.forEach((block, index) => {
        if (index === 0) {
          finalReport += block.text;
        } else {
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
      title="Конструктор отчета"
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

                  {schema.map((field: any) => {
                    const itemType = field.itemType || "text";

                    const renderTypedInput = (props: any) => {
                      if (itemType === "number") {
                        return <Input type="number" {...props} />;
                      }
                      if (itemType === "time") {
                        return <TimeInput {...props} />;
                      }
                      return <Input {...props} />;
                    };

                    return (
                      <div key={field.key} className={styles.formItemContainer}>
                        {field.type === "list" && field.listSize && field.listSize > 0 ? (
                          <Form.Item label={field.label}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                                gap: 8,
                              }}
                            >
                              {Array.from({ length: field.listSize }).map((_, idx) => (
                                <Form.Item
                                  key={idx}
                                  name={[`${block.id}_${field.key}`, idx]}
                                  noStyle
                                  rules={
                                    itemType === "time"
                                      ? [
                                          {
                                            pattern: /^(\d{1,2}:)?\d{1,2}:\d{1,2}(,\d)?$/,
                                            message: "Формат чч:мм:сс",
                                          },
                                        ]
                                      : []
                                  }
                                >
                                  {renderTypedInput({
                                    size: "small",
                                    placeholder: `${idx + 1}`,
                                  })}
                                </Form.Item>
                              ))}
                            </div>
                          </Form.Item>
                        ) : (
                          <Form.Item
                            name={`${block.id}_${field.key}`}
                            label={field.label}
                            className={styles.formItem}
                            rules={
                              field.type === "time"
                                ? [
                                    {
                                      pattern: /^(\d{1,2}:)?\d{1,2}:\d{1,2}(,\d)?$/,
                                      message: "Формат чч:мм:сс",
                                    },
                                  ]
                                : []
                            }
                          >
                            {field.type === "list" ? (
                              <Select
                                mode="tags"
                                style={{ width: "100%" }}
                                placeholder="Введите значения (Enter)"
                                tokenSeparators={[",", ";", "\n", " "]}
                                size="small"
                              />
                            ) : field.type === "time" ? (
                              <TimeInput size="small" />
                            ) : field.type === "number" ? (
                              <Input type="number" size="small" />
                            ) : (
                              <Input size="small" />
                            )}
                          </Form.Item>
                        )}
                      </div>
                    );
                  })}
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
