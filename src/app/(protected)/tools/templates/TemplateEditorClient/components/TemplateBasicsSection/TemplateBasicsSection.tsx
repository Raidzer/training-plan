import { Checkbox, Form, Input } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import { isTemplateCodeValid } from "../../utils/templateEditorUtils";
import styles from "./TemplateBasicsSection.module.scss";

export function TemplateBasicsSection() {
  return (
    <section className={styles.section} aria-labelledby="template-basics-title">
      <div className={styles.heading}>
        <span className={styles.index} aria-hidden>
          01
        </span>
        <div>
          <h2 id="template-basics-title" className={styles.title}>
            {TEMPLATE_EDITOR_LABELS.basicsTitle}
          </h2>
          <p className={styles.description}>{TEMPLATE_EDITOR_LABELS.basicsDescription}</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Form.Item
          name="name"
          label={TEMPLATE_EDITOR_LABELS.nameLabel}
          rules={[
            { required: true, whitespace: true, message: TEMPLATE_EDITOR_LABELS.nameRequired },
          ]}
        >
          <Input
            size="large"
            maxLength={255}
            autoComplete="off"
            placeholder={TEMPLATE_EDITOR_LABELS.namePlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="code"
          label={TEMPLATE_EDITOR_LABELS.codeLabel}
          extra={TEMPLATE_EDITOR_LABELS.codeHint}
          rules={[
            {
              validator: async (_, value: string | null | undefined) => {
                if (!value?.trim() || isTemplateCodeValid(value.trim())) {
                  return;
                }

                throw new Error(TEMPLATE_EDITOR_LABELS.codeInvalid);
              },
            },
          ]}
        >
          <Input
            size="large"
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            className={styles.codeInput}
            placeholder={TEMPLATE_EDITOR_LABELS.codePlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="matchPattern"
          label={TEMPLATE_EDITOR_LABELS.matchPatternLabel}
          extra={TEMPLATE_EDITOR_LABELS.matchPatternHint}
          className={styles.fullWidth}
        >
          <Input
            size="large"
            autoComplete="off"
            placeholder={TEMPLATE_EDITOR_LABELS.matchPatternPlaceholder}
          />
        </Form.Item>
      </div>

      <div className={styles.inlineOption}>
        <Form.Item name="isInline" valuePropName="checked" noStyle>
          <Checkbox>{TEMPLATE_EDITOR_LABELS.inlineLabel}</Checkbox>
        </Form.Item>
        <p>{TEMPLATE_EDITOR_LABELS.inlineHint}</p>
      </div>
    </section>
  );
}
