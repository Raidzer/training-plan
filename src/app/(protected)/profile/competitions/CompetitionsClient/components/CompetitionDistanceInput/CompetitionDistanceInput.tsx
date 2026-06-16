import { AutoComplete } from "antd";
import type { SelectProps } from "antd";
import {
  COMPETITION_DISTANCE_OPTIONS,
  competitionsLabels,
} from "../../constants/competitionsConstants";

type CompetitionDistanceInputProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

const normalizeDistanceSearch = (value: string) => value.trim().toLowerCase().replace(",", ".");

const filterDistanceOption: SelectProps["filterOption"] = (inputValue, option) => {
  const optionValue = String(option?.value ?? "");
  const normalizedInputValue = normalizeDistanceSearch(inputValue);
  const normalizedOptionValue = normalizeDistanceSearch(optionValue);

  return normalizedOptionValue.includes(normalizedInputValue);
};

export function CompetitionDistanceInput({
  value,
  disabled,
  className,
  onChange,
}: CompetitionDistanceInputProps) {
  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      options={COMPETITION_DISTANCE_OPTIONS}
      placeholder={competitionsLabels.distancePlaceholder}
      maxLength={64}
      filterOption={filterDistanceOption}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(className ? { className } : {})}
    />
  );
}
