"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import styles from "./PlanSearch.module.scss";

const PLAN_SEARCH_INPUT_ID = "plan-workout-search";

type PlanSearchProps = {
  query: string;
  label: string;
  placeholder: string;
  onQueryChange: (value: string) => void;
};

export function PlanSearch({ query, label, placeholder, onQueryChange }: PlanSearchProps) {
  return (
    <div className={styles.search} role="search">
      <label className={styles.label} htmlFor={PLAN_SEARCH_INPUT_ID}>
        {label}
      </label>
      <Input
        allowClear
        autoComplete="off"
        className={styles.input}
        enterKeyHint="search"
        id={PLAN_SEARCH_INPUT_ID}
        name="q"
        placeholder={placeholder}
        prefix={<SearchOutlined aria-hidden />}
        size="large"
        type="search"
        value={query}
        aria-controls="plan-schedule-results"
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
      />
    </div>
  );
}
