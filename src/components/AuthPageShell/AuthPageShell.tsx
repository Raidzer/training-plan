import type { ReactNode } from "react";
import { AUTH_PAGE_SHELL_CONTENT, AUTH_WORKFLOW_ITEMS } from "./constants/authPageShellConstants";
import styles from "./AuthPageShell.module.scss";

export type AuthPageMode = keyof typeof AUTH_PAGE_SHELL_CONTENT;

type AuthPageShellProps = {
  mode: AuthPageMode;
  children: ReactNode;
};

export function AuthPageShell({ mode, children }: AuthPageShellProps) {
  const content = AUTH_PAGE_SHELL_CONTENT[mode];
  const contextTitleId = `${mode}-auth-context-title`;

  return (
    <section
      className={styles.shell}
      data-mode={mode}
      aria-label="Личный кабинет бегового клуба СПИРОС"
    >
      <div className={styles.formPanel}>{children}</div>

      <aside
        className={styles.contextPanel}
        aria-label={content.title ? undefined : "О личном кабинете"}
        aria-labelledby={content.title ? contextTitleId : undefined}
      >
        <header className={styles.contextHeader}>
          {content.eyebrow && <span className={styles.eyebrow}>{content.eyebrow}</span>}
          {content.title && (
            <h2 id={contextTitleId} className={styles.contextTitle}>
              {content.title}
            </h2>
          )}
          <p className={styles.contextDescription}>{content.description}</p>
        </header>

        <ol className={styles.workflow} aria-label="Тренировочный цикл">
          {AUTH_WORKFLOW_ITEMS.map((item, index) => (
            <li key={item.title} className={styles.workflowItem}>
              <span className={styles.workflowMarker} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.accessNote}>
          <span className={styles.accessIndicator} aria-hidden="true" />
          <p>
            <strong>{content.accessTitle}</strong>
            <span>{content.accessText}</span>
          </p>
        </div>
      </aside>
    </section>
  );
}
