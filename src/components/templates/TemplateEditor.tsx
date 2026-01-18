"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, Space, Card, Typography, App, Checkbox } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import type { NewDiaryResultTemplate } from "@/app/actions/diaryTemplates";
import styles from "./TemplateEditor.module.scss";
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "number" | "time" | "list";
  suffix?: string;
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
          tooltip="Фразы, по которым система поймет, что нужно использовать этот шаблон. Можно перечислить несколько через точку с запятой. Можно использовать спец-символы: '#' для любого числа, '*' для любого текста. Пример: '# км(до 22)'"
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

      <Card title="Вычисления (формулы)" className={styles.card}>
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schema !== curr.schema}>
          {({ getFieldValue }) => {
            const schemaFields = getFieldValue("schema") || [];
            return (
              <Form.List name="calculations">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} className={styles.fieldRow} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, "key"]}
                          rules={[{ required: true, message: "Имя перем." }]}
                          style={{ width: 120 }}
                        >
                          <Input placeholder="avg_pace" />
                        </Form.Item>
                        <div style={{ display: "flex", alignItems: "center" }}>=</div>
                        <Form.Item
                          {...restField}
                          name={[name, "formula"]}
                          initialValue="PACE"
                          style={{ width: 140 }}
                        >
                          <Select placeholder="Функция">
                            <Option value="PACE">Темп (мин/км)</Option>
                            <Option value="SUM_TIME">Сумма вр.</Option>
                            <Option value="MULT">Умножение</Option>
                            <Option value="DIV">Деление</Option>
                            <Option value="SUB">Вычитание</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "args"]}
                          rules={[{ required: true, message: "Аргументы" }]}
                          style={{ width: 200 }}
                        >
                          <Select mode="tags" placeholder="Поля (dist, time)">
                            {schemaFields.map((f: any) => (
                              <Option key={f.key} value={f.key}>
                                {f.label || f.key}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Добавить формулу
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            );
          }}
        </Form.Item>
      </Card>

      <Card title="Поля формы" className={styles.card}>
        <Form.List name="schema">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} className={styles.fieldRow} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, "key"]}
                    rules={[{ required: true, message: "Код обязателен" }]}
                  >
                    <Input placeholder="Код (lat)" className={styles.codeInput} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "label"]}
                    rules={[{ required: true, message: "Название обязательно" }]}
                  >
                    <Input placeholder="Название поля" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "type"]} initialValue="text">
                    <Select className={styles.selectType}>
                      <Option value="text">Текст</Option>
                      <Option value="time">Время</Option>
                      <Option value="number">Число</Option>
                      <Option value="list">Список (время)</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "suffix"]}>
                    <Input placeholder="Суффикс (км)" className={styles.suffixInput} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
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
