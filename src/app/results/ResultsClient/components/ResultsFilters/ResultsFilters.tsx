"use client";

import clsx from "clsx";
import {
  DISTANCE_LABEL_BY_KEY,
  GENDER_LABEL_BY_KEY,
  RESULTS_LABELS,
} from "../../constants/resultsConstants";
import type { GenderTabKey, ResultsDistanceKey } from "../../types/resultsTypes";
import styles from "./ResultsFilters.module.scss";

type ResultsFiltersProps = {
  activeDistance: ResultsDistanceKey;
  activeGender: GenderTabKey;
  onDistanceChange: (distance: ResultsDistanceKey) => void;
  onGenderChange: (gender: GenderTabKey) => void;
};

export function ResultsFilters({
  activeDistance,
  activeGender,
  onDistanceChange,
  onGenderChange,
}: ResultsFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.tabs} role="tablist" aria-label={RESULTS_LABELS.distanceFilterLabel}>
        <button
          type="button"
          role="tab"
          id="results-tab-5k"
          aria-selected={activeDistance === "5k"}
          className={clsx(styles.tabButton, activeDistance === "5k" && styles.tabActive)}
          onClick={() => {
            onDistanceChange("5k");
          }}
        >
          {DISTANCE_LABEL_BY_KEY["5k"]}
        </button>
        <button
          type="button"
          role="tab"
          id="results-tab-10k"
          aria-selected={activeDistance === "10k"}
          className={clsx(styles.tabButton, activeDistance === "10k" && styles.tabActive)}
          onClick={() => {
            onDistanceChange("10k");
          }}
        >
          {DISTANCE_LABEL_BY_KEY["10k"]}
        </button>
        <button
          type="button"
          role="tab"
          id="results-tab-21k"
          aria-selected={activeDistance === "21k"}
          className={clsx(styles.tabButton, activeDistance === "21k" && styles.tabActive)}
          onClick={() => {
            onDistanceChange("21k");
          }}
        >
          {DISTANCE_LABEL_BY_KEY["21k"]}
        </button>
        <button
          type="button"
          role="tab"
          id="results-tab-42k"
          aria-selected={activeDistance === "42k"}
          className={clsx(styles.tabButton, activeDistance === "42k" && styles.tabActive)}
          onClick={() => {
            onDistanceChange("42k");
          }}
        >
          {DISTANCE_LABEL_BY_KEY["42k"]}
        </button>
      </div>
      <div className={styles.tabs} role="group" aria-label={RESULTS_LABELS.genderFilterLabel}>
        <button
          type="button"
          aria-pressed={activeGender === "all"}
          className={clsx(styles.tabButton, activeGender === "all" && styles.tabActive)}
          onClick={() => {
            onGenderChange("all");
          }}
        >
          {GENDER_LABEL_BY_KEY.all}
        </button>
        <button
          type="button"
          aria-pressed={activeGender === "male"}
          className={clsx(styles.tabButton, activeGender === "male" && styles.tabActive)}
          onClick={() => {
            onGenderChange("male");
          }}
        >
          {GENDER_LABEL_BY_KEY.male}
        </button>
        <button
          type="button"
          aria-pressed={activeGender === "female"}
          className={clsx(styles.tabButton, activeGender === "female" && styles.tabActive)}
          onClick={() => {
            onGenderChange("female");
          }}
        >
          {GENDER_LABEL_BY_KEY.female}
        </button>
      </div>
    </div>
  );
}
