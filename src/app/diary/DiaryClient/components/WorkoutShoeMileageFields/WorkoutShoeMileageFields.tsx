"use client";

import { Input, Select, Typography } from "antd";
import styles from "./WorkoutShoeMileageFields.module.scss";

type ShoeOption = {
  value: number;
  label: string;
};

type WorkoutShoeMileageFieldsProps = {
  selectedShoeIds: number[];
  shoeMileageKm: Record<number, string>;
  shoeOptions: readonly ShoeOption[];
  shoeLoading: boolean;
  shoePlaceholder: string;
  mileagePlaceholder: string;
  onShoeIdsChange: (shoeIds: number[]) => void;
  onMileageChange: (shoeId: number, value: string) => void;
};

const getShoeLabel = (shoeId: number, options: readonly ShoeOption[]) => {
  const option = options.find((item) => item.value === shoeId);
  return option?.label ?? `#${shoeId}`;
};

export function WorkoutShoeMileageFields({
  selectedShoeIds,
  shoeMileageKm,
  shoeOptions,
  shoeLoading,
  shoePlaceholder,
  mileagePlaceholder,
  onShoeIdsChange,
  onMileageChange,
}: WorkoutShoeMileageFieldsProps) {
  return (
    <div className={styles.field}>
      <Select
        mode="multiple"
        value={selectedShoeIds}
        placeholder={shoePlaceholder}
        options={[...shoeOptions]}
        allowClear
        loading={shoeLoading}
        onChange={(value) => onShoeIdsChange(value ?? [])}
      />
      {selectedShoeIds.length > 0 ? (
        <div className={styles.mileageList}>
          {selectedShoeIds.map((shoeId) => (
            <div key={shoeId} className={styles.mileageRow}>
              <Typography.Text className={styles.shoeName}>
                {getShoeLabel(shoeId, shoeOptions)}
              </Typography.Text>
              <Input
                value={shoeMileageKm[shoeId] ?? ""}
                inputMode="decimal"
                placeholder={mileagePlaceholder}
                className={styles.mileageInput}
                onChange={(event) => onMileageChange(shoeId, event.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
