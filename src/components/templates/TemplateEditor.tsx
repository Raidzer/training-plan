"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, Space, Card, Typography, App } from "antd";
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
          name="matchPattern"
          label="Ключевые слова для авто-поиска"
          tooltip="Фразы, по которым система поймет, что нужно использовать этот шаблон. Можно перечислить несколько через точку с запятой. Можно использовать спец-символы: '#' для любого числа, '*' для любого текста. Пример: '# км(до 22)'"
        >
          <Input placeholder="интервалы; фартлек" />
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
