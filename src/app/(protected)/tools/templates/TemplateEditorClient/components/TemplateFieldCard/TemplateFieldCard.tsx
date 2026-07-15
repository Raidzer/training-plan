import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Popconfirm, Select } from "antd";
import type { FormListFieldData } from "antd";
import {
  TEMPLATE_EDITOR_LABELS,
  TEMPLATE_FIELD_TYPE_OPTIONS,
  TEMPLATE_LIST_ITEM_TYPE_OPTIONS,
} from "../../constants/templateEditorConstants";
import type {
  TemplateEditorFormValues,
  TemplateSchemaField,
} from "../../types/templateEditorTypes";
import { isTemplateCodeValid } from "../../utils/templateEditorUtils";
import styles from "./TemplateFieldCard.module.scss";

type TemplateFieldCardProps = {
  field: FormListFieldData;
  index: number;
  totalFields: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number | number[]) => void;
};

export function TemplateFieldCard({
  field,
  index,
  totalFields,
  onMove,
  onRemove,
}: TemplateFieldCardProps) {
  const form = Form.useFormInstance<TemplateEditorFormValues>();
  const { key, name, ...restField } = field;
  const fieldNumber = index + 1;
  const headingId = `template-field-${key}-title`;

  const validateFieldCode = async (_: unknown, value: string | undefined) => {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return;
    }

    if (!isTemplateCodeValid(normalizedValue)) {
      throw new Error(TEMPLATE_EDITOR_LABELS.fieldCodeInvalid);
    }

    const schema: TemplateSchemaField[] = form.getFieldValue("schema") ?? [];
    const duplicateCount = schema.filter(
      (schemaField) => schemaField?.key?.trim().toLowerCase() === normalizedValue
    ).length;

    if (duplicateCount > 1) {
      throw new Error(TEMPLATE_EDITOR_LABELS.fieldCodeDuplicate);
    }
  };

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.number} aria-hidden>
            {String(fieldNumber).padStart(2, "0")}
          </span>
          <h3 id={headingId} className={styles.title}>
            {TEMPLATE_EDITOR_LABELS.fieldTitle} {fieldNumber}
          </h3>
        </div>

        <div className={styles.actions} role="group" aria-label={`Порядок поля ${fieldNumber}`}>
          <Button
            type="text"
            icon={<ArrowUpOutlined aria-hidden />}
            disabled={index === 0}
            aria-label={`${TEMPLATE_EDITOR_LABELS.moveFieldUp} ${fieldNumber}`}
            onClick={() => onMove(index, index - 1)}
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined aria-hidden />}
            disabled={index === totalFields - 1}
            aria-label={`${TEMPLATE_EDITOR_LABELS.moveFieldDown} ${fieldNumber}`}
            onClick={() => onMove(index, index + 1)}
          />
          <Popconfirm
            title={TEMPLATE_EDITOR_LABELS.deleteFieldConfirm}
            description={TEMPLATE_EDITOR_LABELS.deleteFieldConfirmDescription}
            okText="Удалить"
            cancelText="Оставить"
            onConfirm={() => onRemove(name)}
          >
            <Button
              type="text"
              icon={<DeleteOutlined aria-hidden />}
              aria-label={`${TEMPLATE_EDITOR_LABELS.deleteField} ${fieldNumber}`}
            />
          </Popconfirm>
        </div>
      </div>

      <div className={styles.primaryFields}>
        <Form.Item
          {...restField}
          name={[name, "key"]}
          label={TEMPLATE_EDITOR_LABELS.fieldCodeLabel}
          rules={[
            { required: true, whitespace: true, message: TEMPLATE_EDITOR_LABELS.fieldCodeRequired },
            { validator: validateFieldCode },
          ]}
        >
          <Input
            size="large"
            autoComplete="off"
            spellCheck={false}
            className={styles.codeInput}
            placeholder={TEMPLATE_EDITOR_LABELS.fieldCodePlaceholder}
          />
        </Form.Item>

        <Form.Item
          {...restField}
          name={[name, "label"]}
          label={TEMPLATE_EDITOR_LABELS.fieldNameLabel}
          rules={[
            { required: true, whitespace: true, message: TEMPLATE_EDITOR_LABELS.fieldNameRequired },
          ]}
        >
          <Input
            size="large"
            autoComplete="off"
            placeholder={TEMPLATE_EDITOR_LABELS.fieldNamePlaceholder}
          />
        </Form.Item>

        <Form.Item
          {...restField}
          name={[name, "type"]}
          label={TEMPLATE_EDITOR_LABELS.fieldTypeLabel}
          rules={[{ required: true }]}
        >
          <Select size="large" options={[...TEMPLATE_FIELD_TYPE_OPTIONS]} />
        </Form.Item>
      </div>

      <div className={styles.secondaryFields}>
        <Form.Item
          {...restField}
          name={[name, "weight"]}
          label={TEMPLATE_EDITOR_LABELS.fieldWeightLabel}
          extra={TEMPLATE_EDITOR_LABELS.fieldWeightHint}
        >
          <InputNumber
            size="large"
            min={0}
            step={0.1}
            precision={2}
            className={styles.numberInput}
          />
        </Form.Item>

        <Form.Item
          {...restField}
          name={[name, "defaultValue"]}
          label={TEMPLATE_EDITOR_LABELS.fieldDefaultValueLabel}
          extra={TEMPLATE_EDITOR_LABELS.fieldDefaultValueHint}
        >
          <Input size="large" autoComplete="off" />
        </Form.Item>
      </div>

      <Form.Item
        noStyle
        shouldUpdate={(previousValues, currentValues) =>
          previousValues.schema?.[name]?.type !== currentValues.schema?.[name]?.type
        }
      >
        {({ getFieldValue }) => {
          const fieldType = getFieldValue(["schema", name, "type"]);

          if (fieldType !== "list") {
            return null;
          }

          return (
            <div className={styles.listFields}>
              <Form.Item
                {...restField}
                name={[name, "itemType"]}
                label={TEMPLATE_EDITOR_LABELS.listItemTypeLabel}
                rules={[{ required: true }]}
              >
                <Select size="large" options={[...TEMPLATE_LIST_ITEM_TYPE_OPTIONS]} />
              </Form.Item>

              <Form.Item
                {...restField}
                name={[name, "listSize"]}
                label={TEMPLATE_EDITOR_LABELS.listSizeLabel}
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={20}
                  precision={0}
                  className={styles.numberInput}
                />
              </Form.Item>
            </div>
          );
        }}
      </Form.Item>
    </article>
  );
}
