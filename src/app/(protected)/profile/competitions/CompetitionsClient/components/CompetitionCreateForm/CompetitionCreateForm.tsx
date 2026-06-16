import { PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select } from "antd";
import { TimeInput } from "@/components/inputs/TimeInput";
import {
  COMPETITION_PRIORITY_OPTIONS,
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type { CompetitionFormState } from "../../types/competitionsTypes";
import styles from "./CompetitionCreateForm.module.scss";

type CompetitionCreateFormProps = {
  form: CompetitionFormState;
  saving: boolean;
  onChange: <Key extends keyof CompetitionFormState>(
    key: Key,
    value: CompetitionFormState[Key]
  ) => void;
  onSubmit: () => void;
};

export function CompetitionCreateForm({
  form,
  saving,
  onChange,
  onSubmit,
}: CompetitionCreateFormProps) {
  return (
    <div className={styles.form}>
      <DatePicker
        value={form.date}
        onChange={(date) => {
          onChange("date", date);
        }}
        placeholder={competitionsLabels.competitionDatePlaceholder}
        disabled={saving}
        format={COMPETITIONS_DISPLAY_DATE_FORMAT}
        className={styles.dateInput}
      />
      <Input
        value={form.nameLocation}
        onChange={(event) => {
          onChange("nameLocation", event.target.value);
        }}
        placeholder={competitionsLabels.nameLocationPlaceholder}
        disabled={saving}
        maxLength={255}
        className={styles.nameInput}
      />
      <Input
        value={form.distanceLabel}
        onChange={(event) => {
          onChange("distanceLabel", event.target.value);
        }}
        placeholder={competitionsLabels.distancePlaceholder}
        disabled={saving}
        maxLength={64}
        className={styles.distanceInput}
      />
      <Select
        value={form.priority}
        onChange={(value) => {
          onChange("priority", value);
        }}
        options={[...COMPETITION_PRIORITY_OPTIONS]}
        disabled={saving}
        className={styles.priorityInput}
      />
      <TimeInput
        value={form.result}
        onChange={(value) => {
          onChange("result", value);
        }}
        placeholder={competitionsLabels.resultPlaceholder}
        disabled={saving}
        maxLength={32}
        className={styles.resultInput}
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={onSubmit} loading={saving}>
        {competitionsLabels.addCompetitionButton}
      </Button>
    </div>
  );
}
