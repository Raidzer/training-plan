"use client";

import clsx from "clsx";
import {
  DISTANCE_TABS,
  GENDER_TABS,
  RESULTS_LABELS,
  RESULTS_PANEL_ID,
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
    <section className={styles.filters} aria-label="Фильтры результатов">
      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterLabel}>{RESULTS_LABELS.distanceFilterLabel}</legend>
        <div className={styles.options}>
          {DISTANCE_TABS.map((distance) => {
            const isActive = activeDistance === distance.key;

            return (
              <button
                type="button"
                aria-controls={RESULTS_PANEL_ID}
                aria-pressed={isActive}
                className={clsx(styles.filterButton, isActive && styles.filterButtonActive)}
                key={distance.key}
                onClick={() => {
                  onDistanceChange(distance.key);
                }}
              >
                {distance.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterLabel}>{RESULTS_LABELS.genderFilterLabel}</legend>
        <div className={styles.options}>
          {GENDER_TABS.map((gender) => {
            const isActive = activeGender === gender.key;

            return (
              <button
                type="button"
                aria-controls={RESULTS_PANEL_ID}
                aria-pressed={isActive}
                className={clsx(styles.filterButton, isActive && styles.filterButtonActive)}
                key={gender.key}
                onClick={() => {
                  onGenderChange(gender.key);
                }}
              >
                {gender.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
