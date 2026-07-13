"use client";

import { Input, Select } from "antd";
import type { ShoeOption } from "../WorkoutReportCard/WorkoutReportCard.types";
import styles from "./WorkoutShoesFieldset.module.scss";

type WorkoutShoesFieldsetProps = {
  fieldPrefix: string;
  selectedShoeIds: number[];
  shoeMileageKm: Record<number, string>;
  shoeOptions: readonly ShoeOption[];
  shoeLoading: boolean;
  shoeLabel: string;
  shoeMileageLabel: string;
  onShoeIdsChange: (shoeIds: number[]) => void;
  onMileageChange: (shoeId: number, value: string) => void;
};

const getShoeLabel = (shoeId: number, options: readonly ShoeOption[]) => {
  const option = options.find((item) => item.value === shoeId);
  return option?.label ?? `#${shoeId}`;
};

export function WorkoutShoesFieldset({
  fieldPrefix,
  selectedShoeIds,
  shoeMileageKm,
  shoeOptions,
  shoeLoading,
  shoeLabel,
  shoeMileageLabel,
  onShoeIdsChange,
  onMileageChange,
}: WorkoutShoesFieldsetProps) {
  const shoeSelectId = `${fieldPrefix}-shoes`;
  const shoeLegendId = `${shoeSelectId}-label`;

  return (
    <fieldset className={styles.fieldset}>
      <legend id={shoeLegendId} className={styles.legend}>
        {shoeLabel}
      </legend>
      <Select
        id={shoeSelectId}
        mode="multiple"
        value={selectedShoeIds}
        placeholder={shoeLabel}
        options={[...shoeOptions]}
        allowClear
        loading={shoeLoading}
        aria-labelledby={shoeLegendId}
        className={styles.shoeSelect}
        onChange={(value) => onShoeIdsChange(value ?? [])}
      />
      <input type="hidden" name={`${fieldPrefix}-shoeIds`} value={selectedShoeIds.join(",")} />

      {selectedShoeIds.length > 0 ? (
        <div className={styles.mileageList}>
          {selectedShoeIds.map((shoeId) => {
            const mileageInputId = `${fieldPrefix}-shoe-${shoeId}-mileage`;
            const shoeName = getShoeLabel(shoeId, shoeOptions);

            return (
              <div key={shoeId} className={styles.mileageField}>
                <label htmlFor={mileageInputId} className={styles.label}>
                  {shoeName}: {shoeMileageLabel}
                </label>
                <Input
                  id={mileageInputId}
                  name={`${fieldPrefix}-shoe-${shoeId}-mileage`}
                  value={shoeMileageKm[shoeId] ?? ""}
                  inputMode="decimal"
                  placeholder={shoeMileageLabel}
                  onChange={(event) => onMileageChange(shoeId, event.target.value)}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </fieldset>
  );
}
