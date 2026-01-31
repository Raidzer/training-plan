"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Space,
  Card,
  Typography,
  App,
  Checkbox,
  InputNumber,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";

import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import styles from "./TemplateEditor.module.scss";
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "number" | "time" | "list";
  listSize?: number;
  itemType?: "text" | "number" | "time";
};

type TemplateEditorProps = {
  initialValues?: Partial<NewDiaryResultTemplate>;
  onSave: (values: NewDiaryResultTemplate) => Promise<void>;
  onCancel?: () => void;
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialValues,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        schema: initialValues.schema || [],
        calculations: initialValues.calculations || [],
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const templateData: NewDiaryResultTemplate = {
        ...values,
        sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
        schema: values.schema || [],
        calculations: values.calculations || [],
      };

      await onSave(templateData);
      message.success("Шаблон сохранен");
      if (!initialValues) {
        form.resetFields();
      }
    } catch (error) {
      console.error(error);
      message.error("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} disabled={loading}>
      <Card title="Основные настройки" className={styles.card}>
        <Form.Item
          name="name"
          label="Название шаблона"
          rules={[{ required: true, message: "Введите название" }]}
        >
          <Input placeholder="Например: Интервалы" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Системный код (для вставки)"
          tooltip="Уникальный код латиницей (например, PULSE). Результат этого шаблона можно вставить в другой шаблон через {{PULSE}}."
        >
          <Input placeholder="PULSE" style={{ textTransform: "uppercase" }} />
        </Form.Item>

        <Form.Item
          name="matchPattern"
          label="Ключевые слова для авто-поиска"
          tooltip="Фразы для авто-поиска. Разделитель - ';'. Спец-символы: '#' - любое число, '*' - любой текст, '#{2-5}' - число от 2 до 5, '^' - начало строки. Пример: '^#{2-4} км'"
        >
          <Input placeholder="интервалы; фартлек" />
        </Form.Item>

        <Form.Item
          name="isInline"
          valuePropName="checked"
          tooltip="Если отмечено, блок не будет начинаться с новой строки, а приклеится к предыдущему через пробел."
        >
          <Checkbox>Встраиваемый блок (Inline)</Checkbox>
        </Form.Item>
      </Card>

      <Card title="Поля формы" className={styles.card}>
        <Form.List name="schema">
          {(fields, { add, remove, move }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  className={styles.fieldRow}
                  style={{ display: "flex", width: "100%", alignItems: "baseline", gap: 8 }}
                >
                  <Form.Item
                    {...restField}
                    name={[name, "key"]}
                    rules={[{ required: true, message: "Код" }]}
                    style={{ flex: 1, minWidth: 100, marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Код (lat)"
                      className={styles.codeInput}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "label"]}
                    rules={[{ required: true, message: "Название" }]}
                    style={{ flex: 2, minWidth: 150, marginBottom: 0 }}
                  >
                    <Input placeholder="Название поля" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "type"]}
                    initialValue="text"
                    style={{ width: 140, marginBottom: 0 }}
                  >
                    <Select className={styles.selectType} style={{ width: "100%" }}>
                      <Option value="text">Текст</Option>
                      <Option value="time">Время</Option>
                      <Option value="number">Число</Option>
                      <Option value="list">Список</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "weight"]}
                    style={{ width: 100, marginBottom: 0 }}
                    tooltip="Вес/Дистанция (в метрах) для расчетов"
                  >
                    <InputNumber placeholder="Метры" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.schema?.[name]?.type !== curr.schema?.[name]?.type
                    }
                  >
                    {({ getFieldValue }) => {
                      const type = getFieldValue(["schema", name, "type"]);
                      return type === "list" ? (
                        <>
                          <Form.Item
                            {...restField}
                            name={[name, "itemType"]}
                            style={{ width: 100, marginBottom: 0 }}
                            initialValue="text"
                            tooltip="Тип данных в списке"
                          >
                            <Select placeholder="Тип" style={{ width: "100%" }}>
                              <Option value="text">Текст</Option>
                              <Option value="time">Время</Option>
                              <Option value="number">Число</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "listSize"]}
                            style={{ width: 80, marginBottom: 0 }}
                          >
                            <InputNumber
                              placeholder="Len"
                              min={0}
                              max={20}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </>
                      ) : null;
                    }}
                  </Form.Item>

                  <Space>
                    <Button
                      type="text"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    />
                    <Button
                      type="text"
                      icon={<ArrowDownOutlined />}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    />
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ type: "text", key: "", label: "" })}
                  block
                  icon={<PlusOutlined />}
                >
                  Добавить поле
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="Шаблон результата" className={styles.card}>
        <Text type="secondary" className={styles.helperText}>
          Используйте двойные фигурные скобки для вставки значений полей по их коду. <br />
          Пример: <code>Разминка {"{{warmup}}"} км</code>
          <br />
          <br />
          <b>Доступные функции:</b>
          <br />
          <code>{"{{PACE(time, [dist])}}"}</code> - темп (мин/км). Если дист. не указана, берется из
          настройки &quot;Вес&quot;.
          <br />
          <code>{"{{AVG_TIME(list_key, ...)}}"}</code> - среднее время
          <br />
          <code>{"{{SUM_TIME(list_key, ...)}}"}</code> - сумма времени
          <br />
          <code>{"{{AVG_NUM(list_key, ...)}}"}</code> - среднее число
          <br />
          <code>{"{{SUM_NUM(list_key, ...)}}"}</code> - сумма чисел
          <br />
          <code>{"{{AVG_HEIGHT(height, dist)}}"}</code> - средняя высота
          <br />
          <br />
          <b>Переменные:</b>
          <br />
          <code>{"{{code}}"}</code> - значение поля
          <br />
          <code>{"{{code_weight}}"}</code> - вес поля (из настроек)
          <br />
          <br />
          <b>Конструкции:</b>
          <br />
          <code>{"{{#if variable}}...{{/if}}"}</code> - условие
          <br />
          <code>{"{{#each list}}...{{this}}...{{/each}}"}</code> - перебор списка
          <br />
          <code>{"{{#repeat count}}...{{/repeat}}"}</code> - повтор N раз
          <br />
          <code>{"{{list[i]}}"}</code> - доступ к элементу параллельного списка в цикле
          <br />
          <code>{"{{list[1]}}"}</code> - доступ к элементу списка по номеру (с 1)
        </Text>
        <Form.Item name="outputTemplate" label="Текст отчета" rules={[{ required: true }]}>
          <TextArea rows={6} />
        </Form.Item>
      </Card>

      <Space>
        <Button type="primary" htmlType="submit" loading={loading}>
          Сохранить
        </Button>
        {onCancel && <Button onClick={onCancel}>Отмена</Button>}
      </Space>
    </Form>
  );
};
