import { PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Typography } from "antd";
import {
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
} from "../../types/competitionsTypes";
import styles from "./CompetitionBlockCreateForm.module.scss";

type CompetitionBlockCreateFormProps = {
  form: CompetitionBlockFormState;
  saving: boolean;
  onChange: CompetitionBlockFormUpdate;
  onSubmit: () => void;
};

export function CompetitionBlockCreateForm({
  form,
  saving,
  onChange,
  onSubmit,
}: CompetitionBlockCreateFormProps) {
  return (
    <section className={styles.formSection}>
      <Typography.Title level={5} className={styles.formTitle}>
        {competitionsLabels.blockCreateTitle}
      </Typography.Title>
      <div className={styles.formRow}>
        <Input
          value={form.title}
          onChange={(event) => {
            onChange("title", event.target.value);
          }}
          placeholder={competitionsLabels.blockTitlePlaceholder}
          disabled={saving}
          className={styles.titleInput}
          maxLength={255}
        />
        <DatePicker
          value={form.startDate}
          onChange={(date) => {
            onChange("startDate", date);
          }}
          placeholder={competitionsLabels.startDatePlaceholder}
          disabled={saving}
          format={COMPETITIONS_DISPLAY_DATE_FORMAT}
          className={styles.dateInput}
        />
        <DatePicker
          value={form.endDate}
          onChange={(date) => {
            onChange("endDate", date);
          }}
          placeholder={competitionsLabels.endDatePlaceholder}
          disabled={saving}
          format={COMPETITIONS_DISPLAY_DATE_FORMAT}
          className={styles.dateInput}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onSubmit} loading={saving}>
          {competitionsLabels.createBlockButton}
        </Button>
      </div>
    </section>
  );
}
