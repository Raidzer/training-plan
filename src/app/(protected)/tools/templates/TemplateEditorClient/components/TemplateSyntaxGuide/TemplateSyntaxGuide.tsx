import {
  TEMPLATE_CONSTRUCTION_REFERENCE,
  TEMPLATE_EDITOR_LABELS,
  TEMPLATE_FUNCTION_REFERENCE,
  TEMPLATE_VARIABLE_REFERENCE,
} from "../../constants/templateEditorConstants";
import styles from "./TemplateSyntaxGuide.module.scss";

type SyntaxReference = readonly {
  code: string;
  description: string;
}[];

type SyntaxGroupProps = {
  title: string;
  items: SyntaxReference;
};

function SyntaxGroup({ title, items }: SyntaxGroupProps) {
  return (
    <details className={styles.group}>
      <summary>{title}</summary>
      <ul>
        {items.map((item) => (
          <li key={item.code}>
            <code>{item.code}</code>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function TemplateSyntaxGuide() {
  return (
    <aside className={styles.guide} aria-labelledby="template-syntax-title">
      <div className={styles.heading}>
        <span className={styles.mark} aria-hidden>
          {"{{ }}"}
        </span>
        <div>
          <h3 id="template-syntax-title">{TEMPLATE_EDITOR_LABELS.syntaxTitle}</h3>
          <p>{TEMPLATE_EDITOR_LABELS.syntaxDescription}</p>
        </div>
      </div>

      <div className={styles.groups}>
        <SyntaxGroup
          title={TEMPLATE_EDITOR_LABELS.functionsTitle}
          items={TEMPLATE_FUNCTION_REFERENCE}
        />
        <SyntaxGroup
          title={TEMPLATE_EDITOR_LABELS.variablesTitle}
          items={TEMPLATE_VARIABLE_REFERENCE}
        />
        <SyntaxGroup
          title={TEMPLATE_EDITOR_LABELS.constructionsTitle}
          items={TEMPLATE_CONSTRUCTION_REFERENCE}
        />
      </div>
    </aside>
  );
}
