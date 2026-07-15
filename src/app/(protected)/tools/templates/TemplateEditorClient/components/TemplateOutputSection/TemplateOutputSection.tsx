import { Form, Input } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import { TemplateSyntaxGuide } from "../TemplateSyntaxGuide/TemplateSyntaxGuide";
import styles from "./TemplateOutputSection.module.scss";

const { TextArea } = Input;

export function TemplateOutputSection() {
  return (
    <section className={styles.section} aria-labelledby="template-output-title">
      <div className={styles.heading}>
        <span className={styles.index} aria-hidden>
          03
        </span>
        <div>
          <h2 id="template-output-title" className={styles.title}>
            {TEMPLATE_EDITOR_LABELS.outputTitle}
          </h2>
          <p className={styles.description}>{TEMPLATE_EDITOR_LABELS.outputDescription}</p>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.editor}>
          <Form.Item
            name="outputTemplate"
            label={TEMPLATE_EDITOR_LABELS.outputLabel}
            rules={[
              {
                required: true,
                whitespace: true,
                message: TEMPLATE_EDITOR_LABELS.outputRequired,
              },
            ]}
          >
            <TextArea
              rows={14}
              spellCheck={false}
              className={styles.textarea}
              placeholder={TEMPLATE_EDITOR_LABELS.outputPlaceholder}
            />
          </Form.Item>

          <div className={styles.example}>
            <span>Пример</span>
            <code>{"Разминка {{warmup}} км + {{PACE(time, distance)}}"}</code>
          </div>
        </div>

        <TemplateSyntaxGuide />
      </div>
    </section>
  );
}
