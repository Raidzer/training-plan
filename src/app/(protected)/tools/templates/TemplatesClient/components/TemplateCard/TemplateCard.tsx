import { DeleteOutlined, EditOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import Link from "next/link";
import { TEMPLATES_LABELS } from "../../constants/templatesConstants";
import type { TemplateSummary } from "../../types/templatesTypes";
import { getTemplateEditPath, getTemplatePatterns } from "../../utils/templatesUtils";
import styles from "./TemplateCard.module.scss";

type TemplateCardProps = {
  template: TemplateSummary;
  isDeleting: boolean;
  hasPendingDelete: boolean;
  onDelete: (template: TemplateSummary) => Promise<void>;
};

export function TemplateCard({
  template,
  isDeleting,
  hasPendingDelete,
  onDelete,
}: TemplateCardProps) {
  const isSystemTemplate = template.userId === null;
  const patterns = getTemplatePatterns(template.matchPattern);
  const badgeClassName = isSystemTemplate ? `${styles.badge} ${styles.systemBadge}` : styles.badge;

  return (
    <article className={styles.card} aria-busy={isDeleting}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={badgeClassName}>
            {isSystemTemplate ? TEMPLATES_LABELS.systemBadge : TEMPLATES_LABELS.userBadge}
          </span>
          <h3 className={styles.title}>{template.name}</h3>
        </div>
        {isSystemTemplate ? <LockOutlined className={styles.lockIcon} aria-hidden /> : null}
      </div>

      <div className={styles.patternsSection}>
        <p className={styles.patternsLabel}>{TEMPLATES_LABELS.patternsLabel}</p>
        {patterns.length > 0 ? (
          <ul className={styles.patterns} role="list">
            {patterns.map((pattern) => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.noPatterns}>{TEMPLATES_LABELS.noPatterns}</p>
        )}
      </div>

      <footer className={styles.footer}>
        {isSystemTemplate ? (
          <span className={styles.protectionText}>{TEMPLATES_LABELS.systemProtection}</span>
        ) : null}

        <Link
          href={getTemplateEditPath(template.id)}
          className={styles.editLink}
          aria-label={TEMPLATES_LABELS.editAriaLabel(template.name)}
        >
          <EditOutlined aria-hidden />
          <span>{TEMPLATES_LABELS.editAction}</span>
        </Link>

        {!isSystemTemplate ? (
          <Popconfirm
            title={TEMPLATES_LABELS.deleteConfirmTitle}
            description={TEMPLATES_LABELS.deleteConfirmDescription(template.name)}
            okText={TEMPLATES_LABELS.deleteAction}
            cancelText="Отмена"
            okButtonProps={{ danger: true, loading: isDeleting }}
            disabled={hasPendingDelete}
            onConfirm={() => onDelete(template)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined aria-hidden />}
              loading={isDeleting}
              disabled={hasPendingDelete && !isDeleting}
              aria-label={TEMPLATES_LABELS.deleteAriaLabel(template.name)}
              className={styles.deleteButton}
            >
              {TEMPLATES_LABELS.deleteAction}
            </Button>
          </Popconfirm>
        ) : null}
      </footer>
    </article>
  );
}
