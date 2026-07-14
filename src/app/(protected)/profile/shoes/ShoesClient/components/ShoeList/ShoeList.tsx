import { InboxOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { ShoeListItem } from "../ShoeListItem/ShoeListItem";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormErrors,
  ShoeFormState,
  ShoeFormUpdate,
  ShoeItem,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import { getPairCountLabel } from "../../utils/shoesUtils";
import styles from "./ShoeList.module.scss";

type ShoeListProps = {
  items: ShoeItem[];
  loading: boolean;
  loadError: boolean;
  addDisabled: boolean;
  saving: boolean;
  editingId: number | null;
  editingForm: ShoeFormState;
  editingFormErrors: ShoeFormErrors;
  editingValidationAttempt: number;
  notificationAvailability: ShoeNotificationAvailability;
  updatingId: number | null;
  deletingId: number | null;
  onStartEdit: (item: ShoeItem) => void;
  onChangeEdit: ShoeFormUpdate;
  onSaveEdit: () => void | Promise<void>;
  onCancelEdit: () => void;
  onDelete: (item: ShoeItem) => void;
  onRetry: () => void | Promise<void>;
};

export function ShoeList({
  items,
  loading,
  loadError,
  addDisabled,
  saving,
  editingId,
  editingForm,
  editingFormErrors,
  editingValidationAttempt,
  notificationAvailability,
  updatingId,
  deletingId,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onRetry,
}: ShoeListProps) {
  const countLabel = `${items.length} ${getPairCountLabel(items.length)}`;
  const renderAddLink = (label: string, className: string) => {
    const content = (
      <>
        <PlusOutlined aria-hidden />
        <span>{label}</span>
      </>
    );

    if (addDisabled) {
      return (
        <span className={`${className} ${styles.disabledAction}`} aria-disabled="true">
          {content}
        </span>
      );
    }

    return (
      <a href="#shoe-create-name" className={className}>
        {content}
      </a>
    );
  };

  return (
    <section className={styles.section} aria-labelledby="shoe-list-title" aria-busy={loading}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Typography.Title level={2} id="shoe-list-title" className={styles.title}>
            {shoesLabels.listTitle}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.description}>
            {shoesLabels.listDescription}
          </Typography.Paragraph>
        </div>
        <div className={styles.headerActions}>
          {renderAddLink(shoesLabels.addButton, styles.addLink)}
          <span
            className={styles.count}
            aria-label={loading ? undefined : `Всего: ${countLabel}`}
            aria-hidden={loading || undefined}
          >
            {loading ? "—" : countLabel}
          </span>
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <span className={styles.visuallyHidden}>{shoesLabels.loadingText}</span>
          <div className={styles.skeleton} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.skeleton} aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {!loading && loadError ? (
        <div className={styles.state} role="alert">
          <ReloadOutlined className={styles.stateIcon} aria-hidden />
          <Typography.Title level={3} className={styles.stateTitle}>
            {shoesLabels.loadErrorTitle}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.stateDescription}>
            {shoesLabels.loadErrorDescription}
          </Typography.Paragraph>
          <Button
            icon={<ReloadOutlined aria-hidden />}
            onClick={() => {
              void onRetry();
            }}
          >
            {shoesLabels.retryButton}
          </Button>
        </div>
      ) : null}

      {!loading && !loadError && items.length === 0 ? (
        <div className={styles.state}>
          <InboxOutlined className={styles.stateIcon} aria-hidden />
          <Typography.Title level={3} className={styles.stateTitle}>
            {shoesLabels.emptyTitle}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.stateDescription}>
            {shoesLabels.emptyText}
          </Typography.Paragraph>
          {renderAddLink(shoesLabels.emptyAction, styles.stateAction)}
        </div>
      ) : null}

      {!loading && !loadError && items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <ShoeListItem
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editingForm={editingForm}
              editingFormErrors={editingFormErrors}
              editingValidationAttempt={editingValidationAttempt}
              notificationAvailability={notificationAvailability}
              updating={updatingId === item.id}
              deleting={deletingId === item.id}
              actionsDisabled={
                saving ||
                updatingId !== null ||
                deletingId !== null ||
                (editingId !== null && editingId !== item.id)
              }
              onStartEdit={onStartEdit}
              onChangeEdit={onChangeEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
