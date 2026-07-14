import { AutoComplete } from "antd";
import type { AutoCompleteProps, SelectProps } from "antd";
import {
  COMPETITION_DISTANCE_OPTIONS,
  competitionsLabels,
} from "../../constants/competitionsConstants";

type CompetitionDistanceInputProps = Omit<
  AutoCompleteProps,
  "children" | "filterOption" | "onChange" | "options" | "value"
> & {
  value: string;
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
  onChange,
  ...props
}: CompetitionDistanceInputProps) {
  return (
    <AutoComplete
      {...props}
      value={value}
      onChange={onChange}
      options={COMPETITION_DISTANCE_OPTIONS}
      placeholder={competitionsLabels.distancePlaceholder}
      maxLength={64}
      filterOption={filterDistanceOption}
    />
  );
}
