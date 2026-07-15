import { PlusOutlined } from "@ant-design/icons";
import { Button, Form } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import { TemplateFieldCard } from "../TemplateFieldCard/TemplateFieldCard";
import styles from "./TemplateFieldsSection.module.scss";

export function TemplateFieldsSection() {
  return (
    <section className={styles.section} aria-labelledby="template-fields-title">
      <div className={styles.heading}>
        <span className={styles.index} aria-hidden>
          02
        </span>
        <div>
          <h2 id="template-fields-title" className={styles.title}>
            {TEMPLATE_EDITOR_LABELS.fieldsTitle}
          </h2>
          <p className={styles.description}>{TEMPLATE_EDITOR_LABELS.fieldsDescription}</p>
        </div>
      </div>

      <Form.List name="schema">
        {(fields, { add, move, remove }, { errors }) => (
          <div className={styles.builder}>
            {fields.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyNumber} aria-hidden>
                  00
                </span>
                <div>
                  <h3>{TEMPLATE_EDITOR_LABELS.emptyFieldsTitle}</h3>
                  <p>{TEMPLATE_EDITOR_LABELS.emptyFieldsDescription}</p>
                </div>
              </div>
            ) : (
              <div className={styles.list}>
                {fields.map((field, index) => (
                  <TemplateFieldCard
                    key={field.key}
                    field={field}
                    index={index}
                    totalFields={fields.length}
                    onMove={move}
                    onRemove={remove}
                  />
                ))}
              </div>
            )}

            <Form.ErrorList errors={errors} />
            <Button
              type="dashed"
              size="large"
              block
              icon={<PlusOutlined aria-hidden />}
              className={styles.addButton}
              onClick={() => add({ key: "", label: "", type: "text", itemType: "text" })}
            >
              {TEMPLATE_EDITOR_LABELS.addFieldButton}
            </Button>
          </div>
        )}
      </Form.List>
    </section>
  );
}
