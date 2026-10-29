import { InboxOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Tabs, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
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
  archivingId: number | null;
  onStartEdit: (item: ShoeItem) => void;
  onChangeEdit: ShoeFormUpdate;
  onSaveEdit: () => void | Promise<void>;
  onCancelEdit: () => void;
  onDelete: (item: ShoeItem) => void;
  onToggleArchive: (item: ShoeItem) => void | Promise<void>;
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
  archivingId,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleArchive,
  onRetry,
}: ShoeListProps) {
  const [activeTab, setActiveTab] = useState("active");
  const sectionRef = useRef<HTMLElement>(null);
  const pendingArchiveIdRef = useRef<number | null>(null);
  const archiveSelected = activeTab === "archive";
  const activeCount = items.filter((item) => !item.isArchived).length;
  const archiveCount = items.length - activeCount;
  const visibleItems = items.filter((item) => item.isArchived === archiveSelected);
  const countLabel = `${visibleItems.length} ${getPairCountLabel(visibleItems.length)}`;
  const tabsDisabled =
    loading ||
    loadError ||
    saving ||
    editingId !== null ||
    updatingId !== null ||
    deletingId !== null ||
    archivingId !== null;

  useEffect(() => {
    if (archivingId !== null) {
      pendingArchiveIdRef.current = archivingId;
      return;
    }

    const pendingId = pendingArchiveIdRef.current;
    pendingArchiveIdRef.current = null;
    if (
      pendingId === null ||
      items.some((item) => item.id === pendingId && item.isArchived === archiveSelected)
    ) {
      return;
    }

    sectionRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
  }, [archivingId, archiveSelected, items]);
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

  const listContent = (
    <>
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

      {!loading && !loadError && visibleItems.length === 0 ? (
        <div className={styles.state}>
          <InboxOutlined className={styles.stateIcon} aria-hidden />
          <Typography.Title level={3} className={styles.stateTitle}>
            {archiveSelected ? shoesLabels.archiveEmptyTitle : shoesLabels.emptyTitle}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.stateDescription}>
            {archiveSelected ? shoesLabels.archiveEmptyText : shoesLabels.emptyText}
          </Typography.Paragraph>
          {archiveSelected ? null : renderAddLink(shoesLabels.emptyAction, styles.stateAction)}
        </div>
      ) : null}

      {!loading && !loadError && visibleItems.length > 0 ? (
        <ul className={styles.list}>
          {visibleItems.map((item) => (
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
              archiving={archivingId === item.id}
              actionsDisabled={
                saving ||
                updatingId !== null ||
                deletingId !== null ||
                archivingId !== null ||
                (editingId !== null && editingId !== item.id)
              }
              onStartEdit={onStartEdit}
              onChangeEdit={onChangeEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </ul>
      ) : null}
    </>
  );

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="shoe-list-title"
      aria-busy={loading}
    >
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

      <Tabs
        className={styles.tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        animated={false}
        items={[
          {
            key: "active",
            label: `${shoesLabels.activeTab} (${loading || loadError ? "—" : activeCount})`,
            disabled: tabsDisabled,
            children: archiveSelected ? null : listContent,
          },
          {
            key: "archive",
            label: `${shoesLabels.archiveTab} (${loading || loadError ? "—" : archiveCount})`,
            disabled: tabsDisabled,
            children: archiveSelected ? listContent : null,
          },
        ]}
      />
    </section>
  );
}
