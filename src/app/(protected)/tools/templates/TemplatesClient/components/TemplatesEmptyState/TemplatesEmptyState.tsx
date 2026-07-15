import { FileAddOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { TEMPLATE_ROUTES, TEMPLATES_LABELS } from "../../constants/templatesConstants";
import styles from "./TemplatesEmptyState.module.scss";

type TemplatesEmptyStateProps =
  | {
      mode: "empty";
      onResetFilters?: never;
    }
  | {
      mode: "no-results";
      onResetFilters: () => void;
    };

export function TemplatesEmptyState({ mode, onResetFilters }: TemplatesEmptyStateProps) {
  const isEmpty = mode === "empty";

  return (
    <div id="templates-list" className={styles.emptyState}>
      <span className={styles.icon} aria-hidden>
        {isEmpty ? <FileAddOutlined /> : <SearchOutlined />}
      </span>
      <h3 className={styles.title}>
        {isEmpty ? TEMPLATES_LABELS.emptyTitle : TEMPLATES_LABELS.noResultsTitle}
      </h3>
      <p className={styles.description}>
        {isEmpty ? TEMPLATES_LABELS.emptyDescription : TEMPLATES_LABELS.noResultsDescription}
      </p>

      {isEmpty ? (
        <Link href={TEMPLATE_ROUTES.create} className={styles.primaryLink}>
          <FileAddOutlined aria-hidden />
          <span>{TEMPLATES_LABELS.createAction}</span>
        </Link>
      ) : (
        <button type="button" className={styles.resetButton} onClick={onResetFilters}>
          {TEMPLATES_LABELS.resetFiltersAction}
        </button>
      )}
    </div>
  );
}
