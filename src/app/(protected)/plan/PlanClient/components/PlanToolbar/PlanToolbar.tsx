"use client";

import { BookOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Segmented } from "antd";
import Link from "next/link";
import { PlanSearch } from "../PlanSearch/PlanSearch";
import styles from "./PlanToolbar.module.scss";

export type PlanFilterValue = "all" | "without-reports";

export type PlanToolbarProps = {
  searchQuery: string;
  searchLabel: string;
  searchPlaceholder: string;
  filterValue: PlanFilterValue;
  allDaysLabel: string;
  withoutReportsLabel: string;
  importPlanHref: string;
  importPlanLabel: string;
  importDiaryHref: string;
  importDiaryLabel: string;
  reloadLabel: string;
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: PlanFilterValue) => void;
  onReload: () => void;
};

const ALL_DAYS_FILTER: PlanFilterValue = "all";
const WITHOUT_REPORTS_FILTER: PlanFilterValue = "without-reports";

export function PlanToolbar({
  searchQuery,
  searchLabel,
  searchPlaceholder,
  filterValue,
  allDaysLabel,
  withoutReportsLabel,
  importPlanHref,
  importPlanLabel,
  importDiaryHref,
  importDiaryLabel,
  reloadLabel,
  loading = false,
  onSearchChange,
  onFilterChange,
  onReload,
}: PlanToolbarProps) {
  return (
    <section className={styles.toolbar} aria-label="Управление планом">
      <div className={styles.controls}>
        <PlanSearch
          query={searchQuery}
          label={searchLabel}
          placeholder={searchPlaceholder}
          onQueryChange={onSearchChange}
        />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Показывать</span>
          <Segmented<PlanFilterValue>
            block
            className={styles.filterControl}
            classNames={{
              item: styles.filterItem,
              label: styles.filterItemLabel,
            }}
            aria-label="Фильтр дней плана"
            value={filterValue}
            options={[
              { label: allDaysLabel, value: ALL_DAYS_FILTER },
              { label: withoutReportsLabel, value: WITHOUT_REPORTS_FILTER },
            ]}
            onChange={onFilterChange}
          />
        </div>
      </div>

      <div className={styles.actions} role="group" aria-label="Импорт и обновление плана">
        <Link href={importPlanHref} className={styles.actionLink}>
          <UploadOutlined aria-hidden />
          <span>{importPlanLabel}</span>
        </Link>
        <Link href={importDiaryHref} className={styles.actionLink}>
          <BookOutlined aria-hidden />
          <span>{importDiaryLabel}</span>
        </Link>
        <Button
          size="large"
          className={styles.reloadButton}
          icon={<ReloadOutlined aria-hidden />}
          loading={loading}
          onClick={onReload}
        >
          {reloadLabel}
        </Button>
      </div>
    </section>
  );
}
