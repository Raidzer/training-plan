import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import type { ChangeEvent } from "react";
import { TEMPLATE_FILTER_OPTIONS, TEMPLATES_LABELS } from "../../constants/templatesConstants";
import type { TemplateFilter } from "../../types/templatesTypes";
import styles from "./TemplatesToolbar.module.scss";

type TemplatesToolbarProps = {
  query: string;
  filter: TemplateFilter;
  visibleCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: TemplateFilter) => void;
};

export function TemplatesToolbar({
  query,
  filter,
  visibleCount,
  totalCount,
  onQueryChange,
  onFilterChange,
}: TemplatesToolbarProps) {
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <search className={styles.toolbar} aria-label={TEMPLATES_LABELS.searchLabel}>
      <div className={styles.searchField}>
        <label htmlFor="templates-search" className={styles.searchLabel}>
          {TEMPLATES_LABELS.searchLabel}
        </label>
        <Input
          id="templates-search"
          type="search"
          value={query}
          prefix={<SearchOutlined aria-hidden />}
          placeholder={TEMPLATES_LABELS.searchPlaceholder}
          allowClear={{
            clearIcon: <CloseCircleFilled aria-label={TEMPLATES_LABELS.clearSearch} />,
          }}
          onChange={handleQueryChange}
        />
      </div>

      <fieldset className={styles.filters}>
        <legend>{TEMPLATES_LABELS.filtersLegend}</legend>
        <div className={styles.filterButtons}>
          {TEMPLATE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.filterButton}
              aria-pressed={filter === option.value}
              aria-controls="templates-list"
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <p className={styles.resultsCount}>
        {TEMPLATES_LABELS.resultsLabel(visibleCount, totalCount)}
      </p>
    </search>
  );
}
