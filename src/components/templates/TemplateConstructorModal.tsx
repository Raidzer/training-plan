"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Form, Input, Button, Typography, Space, Divider, Spin } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { MessageInstance } from "antd/es/message/interface";
import type { DiaryResultTemplate } from "@/shared/types/diary-templates";
import { findMatchingTemplate, getTemplates } from "@/app/actions/diaryTemplates";
import { processTemplate } from "@/shared/utils/templateEngine";
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
  repeatCount?: number;
};

type TemplateSchemaField = {
  key: string;
  label?: string;
  type: "text" | "number" | "time" | "list";
  itemType?: "text" | "number" | "time";
  listSize?: number;
  defaultValue?: string | number | null;
};

function parseListDefaultValue(defaultValue: unknown): string[] {
  if (Array.isArray(defaultValue)) {
    return defaultValue.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  if (defaultValue === undefined || defaultValue === null) {
    return [];
  }

  const raw = String(defaultValue).trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(/[;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseNumberDefaultValue(defaultValue: unknown): number | undefined {
  if (defaultValue === undefined || defaultValue === null || defaultValue === "") {
    return undefined;
  }

  if (typeof defaultValue === "number") {
    if (Number.isNaN(defaultValue)) {
      return undefined;
    }
    return defaultValue;
  }

  const parsed = Number(String(defaultValue).replace(",", "."));
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

function normalizeFieldDefaultValue(field: TemplateSchemaField): any {
  if (field.type === "list") {
    const listValue = parseListDefaultValue(field.defaultValue);
    if (field.listSize && field.listSize > 0) {
      return listValue.slice(0, field.listSize);
    }
    return listValue;
  }

  if (field.type === "number") {
    return parseNumberDefaultValue(field.defaultValue);
  }

  if (field.defaultValue === undefined || field.defaultValue === null) {
    return undefined;
  }

  return String(field.defaultValue);
}

function buildDefaultValuesFromSchema(schema: TemplateSchemaField[]): Record<string, any> {
  const defaultValues: Record<string, any> = {};

  schema.forEach((field) => {
    const defaultValue = normalizeFieldDefaultValue(field);
    if (defaultValue === undefined) {
      return;
    }

    if (Array.isArray(defaultValue) && defaultValue.length === 0) {
      return;
    }

    defaultValues[field.key] = defaultValue;
  });

  return defaultValues;
}

function buildFormValuesForBlock(
  blockId: string,
  blockValues: Record<string, any>
): Record<string, any> {
  const formValues: Record<string, any> = {};

  Object.entries(blockValues).forEach(([fieldKey, value]) => {
    formValues[`${blockId}_${fieldKey}`] = value;
  });

  return formValues;
}

const TimeInput = ({ value, onChange, ...props }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (value && raw.length < value.length) {
      onChange?.(raw);
      return;
    }

    const clean = raw.replace(/[^0-9:,.]/g, "").replace(/\./g, ",");

    let formatted = clean;
    const parts = clean.split(",");
    let mainPart = parts[0].replace(/[^0-9]/g, "");
    const msPart = parts.length > 1 ? "," + parts[1].slice(0, 1) : "";

    if (mainPart.length > 2) {
      mainPart = mainPart.slice(0, 2) + ":" + mainPart.slice(2);
    }
    if (mainPart.length > 5) {
      mainPart = mainPart.slice(0, 5) + ":" + mainPart.slice(5);
    }
    if (mainPart.length > 8) {
      mainPart = mainPart.slice(0, 8);
    }

    formatted = mainPart + msPart;

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
              values: buildDefaultValuesFromSchema((t.schema as TemplateSchemaField[]) || []),
            }));
            setBlocks(newBlocks);

            const defaultFormValues = newBlocks.reduce(
              (acc, block) => ({
                ...acc,
                ...buildFormValuesForBlock(block.id, block.values),
              }),
              {} as Record<string, any>
            );
            if (Object.keys(defaultFormValues).length > 0) {
              form.setFieldsValue(defaultFormValues);
            }

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
    const blockId = Math.random().toString(36).substr(2, 9);
    const template = templates.find((item) => item.id === templateId);
    const schema = (template?.schema as TemplateSchemaField[]) || [];
    const defaultValues = buildDefaultValuesFromSchema(schema);

    setBlocks((prev) => [
      ...prev,
      {
        id: blockId,
        templateId,
        values: defaultValues,
      },
    ]);

    const formValues = buildFormValuesForBlock(blockId, defaultValues);
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    setBlocks((prev) => {
      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      return newBlocks;
    });
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    setBlocks((prev) => {
      const newBlocks = [...prev];
      [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
      return newBlocks;
    });
  };

  const changeBlockTemplate = (index: number, templateId: number) => {
    const blockId = blocks[index].id;
    const template = templates.find((item) => item.id === templateId);
    const schema = (template?.schema as TemplateSchemaField[]) || [];
    const defaultValues = buildDefaultValuesFromSchema(schema);

    const currentValues = form.getFieldsValue();
    const keysToReset = Object.keys(currentValues).filter((key) => key.startsWith(`${blockId}_`));

    if (keysToReset.length > 0) {
      const resetObj = keysToReset.reduce(
        (acc, key) => {
          acc[key] = undefined;
          return acc;
        },
        {} as Record<string, undefined>
      );
      form.setFieldsValue(resetObj);
    }

    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = {
        ...newBlocks[index],
        templateId,
        values: defaultValues,
      };
      return newBlocks;
    });

    const formValues = buildFormValuesForBlock(blockId, defaultValues);
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  };

  const handleApply = () => {
    form.validateFields().then((allValues) => {
      const blockOutputs: { id: string; code: string; text: string; isInline: boolean }[] = [];

      blocks.forEach((block) => {
        const template = templates.find((t) => t.id === block.templateId);
        if (!template) return;

        const formValues: Record<string, any> = {};

        const normalizeTime = (val: any) => {
          if (typeof val !== "string") return val;
          const clean = val.trim();
          const parts = clean.split(":");

          while (parts.length > 1 && parseInt(parts[0], 10) === 0) {
            parts.shift();
          }

          if (parts.length > 0) {
            const numericPart = parseInt(parts[0], 10);
            parts[0] = parts[0].replace(/^\d+/, numericPart.toString());
          }

          return parts.join(":");
        };

        const schema = (template.schema as TemplateSchemaField[]) || [];

        schema.forEach((field) => {
          const formFieldKey = `${block.id}_${field.key}`;
          let val = allValues[formFieldKey];

          const isTime =
            field.type === "time" || (field.type === "list" && field.itemType === "time");
          if (isTime) {
            if (Array.isArray(val)) {
              val = val.map(normalizeTime);
            } else {
              val = normalizeTime(val);
            }
          }

          formValues[field.key] = val;
        });

        const result = processTemplate(template, formValues);
        const count = block.repeatCount || 1;

        for (let i = 0; i < count; i++) {
          blockOutputs.push({
            id: `${block.id}_rep_${i}`,
            code: template.code || "",
            text: result.trim(),
            isInline: template.isInline || false,
          });
        }
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
              const schema = (template?.schema as TemplateSchemaField[]) || [];

              return (
                <div key={block.id} className={styles.blockContainer}>
                  <div className={styles.blockHeader}>
                    <Space style={{ flex: 1 }}>
                      <Text strong style={{ marginRight: 8 }}>
                        Блок {index + 1}:
                      </Text>
                      <Select
                        showSearch
                        style={{ width: 220 }}
                        size="small"
                        value={block.templateId}
                        onChange={(val) => changeBlockTemplate(index, val)}
                        optionFilterProp="children"
                      >
                        {templates.map((t) => (
                          <Option key={t.id} value={t.id}>
                            {t.name}
                          </Option>
                        ))}
                      </Select>
                    </Space>
                    <Space>
                      <Button
                        icon={<ArrowUpOutlined />}
                        size="small"
                        disabled={index === 0}
                        onClick={() => moveBlockUp(index)}
                      />
                      <Button
                        icon={<ArrowDownOutlined />}
                        size="small"
                        disabled={index === blocks.length - 1}
                        onClick={() => moveBlockDown(index)}
                      />
                      <Button type="text" danger size="small" onClick={() => removeBlock(block.id)}>
                        Удалить
                      </Button>
                    </Space>
                  </div>

                  {schema.map((field) => {
                    const itemType = field.itemType || "text";

                    const renderTypedInput = (props: any) => {
                      if (itemType === "number") {
                        return (
                          <Input
                            type="number"
                            {...props}
                            style={{ ...props.style, width: 100 }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        );
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
                                gap: 16,
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
                                            message: "Формат чч:мм:сс или мм:сс,м",
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
                                      message: "Формат чч:мм:сс или мм:сс,м",
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
                              <Input
                                type="number"
                                size="small"
                                style={{ width: 100 }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
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
