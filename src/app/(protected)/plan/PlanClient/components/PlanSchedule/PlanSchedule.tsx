import { CloseCircleOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Pagination, Skeleton, Spin } from "antd";
import { useMemo } from "react";
import { PLAN_PAGE_SIZE } from "../../constants/planConstants";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDayEntry } from "../../types/planTypes";
import { PlanDayCard } from "../PlanDayCard/PlanDayCard";
import styles from "./PlanSchedule.module.scss";

type PlanScheduleProps = {
  entries: PlanDayEntry[];
  loading: boolean;
  loadError: string | null;
  isFiltered: boolean;
  searchQuery: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEditDay: (date: string) => void;
  onShiftPlanFromDate: (date: string) => void;
  onAddDay: () => void;
  onRetry: () => Promise<void>;
  onClearSearch: () => void;
  today: string;
};

const SKELETON_KEYS = ["first", "second"];

export function PlanSchedule({
  entries,
  loading,
  loadError,
  isFiltered,
  searchQuery,
  currentPage,
  onPageChange,
  onEditDay,
  onShiftPlanFromDate,
  onAddDay,
  onRetry,
  onClearSearch,
  today,
}: PlanScheduleProps) {
  const pagesCount = Math.max(1, Math.ceil(entries.length / PLAN_PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), pagesCount);
  const pagedEntries = useMemo(() => {
    const pageStart = (safeCurrentPage - 1) * PLAN_PAGE_SIZE;
    return entries.slice(pageStart, pageStart + PLAN_PAGE_SIZE);
  }, [entries, safeCurrentPage]);

  const normalizedSearchQuery = searchQuery.trim();
  const isSearchActive = normalizedSearchQuery.length > 0;
  const showInitialLoading = loading && entries.length === 0;
  const showEmpty = !loading && !loadError && entries.length === 0;

  let emptyTitle: string = isFiltered
    ? PLAN_TEXT.schedule.filteredEmptyTitle
    : PLAN_TEXT.schedule.emptyTitle;
  let emptyDescription: string = isFiltered
    ? PLAN_TEXT.schedule.filteredEmptyDescription
    : PLAN_TEXT.schedule.emptyDescription;

  if (isSearchActive) {
    emptyTitle = PLAN_TEXT.schedule.searchEmptyTitle;
    emptyDescription = PLAN_TEXT.schedule.searchEmptyDescription(normalizedSearchQuery);
  }

  return (
    <section
      className={styles.section}
      id="plan-schedule-results"
      aria-labelledby="plan-schedule-title"
      aria-busy={loading}
    >
      <header className={styles.sectionHeader}>
        <div className={styles.sectionCopy}>
          <h2 className={styles.sectionTitle} id="plan-schedule-title">
            {PLAN_TEXT.schedule.title}
          </h2>
          <p className={styles.sectionDescription}>{PLAN_TEXT.schedule.description}</p>
        </div>
        <div className={styles.sectionMeta} aria-live="polite">
          {loading && entries.length > 0 ? (
            <>
              <Spin size="small" />
              <span>{PLAN_TEXT.actions.reload}</span>
            </>
          ) : (
            <span>
              {isSearchActive
                ? PLAN_TEXT.schedule.searchCount(entries.length)
                : PLAN_TEXT.schedule.count(entries.length)}
            </span>
          )}
        </div>
      </header>

      {loadError ? (
        <Alert
          className={styles.errorAlert}
          type="error"
          showIcon
          title={PLAN_TEXT.schedule.errorTitle}
          description={loadError}
          action={
            <Button
              icon={<ReloadOutlined aria-hidden />}
              onClick={() => {
                void onRetry();
              }}
            >
              {PLAN_TEXT.schedule.retry}
            </Button>
          }
        />
      ) : null}

      {showInitialLoading ? (
        <div className={styles.skeletons} role="status" aria-label={PLAN_TEXT.schedule.loading}>
          {SKELETON_KEYS.map((key) => (
            <div className={styles.skeletonCard} key={key}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className={styles.emptyState}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className={styles.emptyCopy}>
                <strong>{emptyTitle}</strong>
                <span>{emptyDescription}</span>
              </div>
            }
          >
            {isSearchActive ? (
              <Button icon={<CloseCircleOutlined aria-hidden />} onClick={onClearSearch}>
                {PLAN_TEXT.search.clear}
              </Button>
            ) : isFiltered ? null : (
              <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={onAddDay}>
                {PLAN_TEXT.actions.addDay}
              </Button>
            )}
          </Empty>
        </div>
      ) : null}

      {pagedEntries.length > 0 ? (
        <div className={styles.list}>
          {pagedEntries.map((entry) => (
            <PlanDayCard
              key={entry.date}
              entry={entry}
              isToday={entry.date === today}
              onEditDay={onEditDay}
              onShiftPlanFromDate={onShiftPlanFromDate}
            />
          ))}
        </div>
      ) : null}

      {entries.length > PLAN_PAGE_SIZE ? (
        <Pagination
          className={styles.pagination}
          current={safeCurrentPage}
          pageSize={PLAN_PAGE_SIZE}
          total={entries.length}
          showSizeChanger={false}
          showLessItems
          responsive
          onChange={onPageChange}
        />
      ) : null}
    </section>
  );
}
