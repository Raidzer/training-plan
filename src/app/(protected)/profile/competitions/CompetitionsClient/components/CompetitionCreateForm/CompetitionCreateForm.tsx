import { PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionFormError,
  CompetitionFormState,
  CompetitionFormUpdate,
} from "../../types/competitionsTypes";
import { CompetitionFormFields } from "../CompetitionFormFields/CompetitionFormFields";
import styles from "./CompetitionCreateForm.module.scss";

type CompetitionCreateFormProps = {
  idPrefix: string;
  form: CompetitionFormState;
  error?: CompetitionFormError | null;
  validationAttempt?: number;
  saving: boolean;
  disabled?: boolean;
  onChange: CompetitionFormUpdate;
  onSubmit: () => Promise<boolean> | boolean | void;
};

export function CompetitionCreateForm({
  idPrefix,
  form,
  error = null,
  validationAttempt = 0,
  saving,
  disabled = false,
  onChange,
  onSubmit,
}: CompetitionCreateFormProps) {
  const titleId = idPrefix + "-title";
  const formDisabled = disabled || saving;

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <Typography.Title level={4} id={titleId} className={styles.title}>
          {competitionsLabels.competitionCreateTitle}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.description}>
          {competitionsLabels.competitionCreateDescription}
        </Typography.Paragraph>
      </header>

      <form
        className={styles.form}
        noValidate
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <CompetitionFormFields
          idPrefix={idPrefix}
          form={form}
          error={error}
          validationAttempt={validationAttempt}
          disabled={formDisabled}
          onChange={onChange}
        />
        <div className={styles.actions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined aria-hidden />}
            loading={saving}
            disabled={formDisabled}
            aria-label={competitionsLabels.addCompetitionButton}
          >
            {competitionsLabels.addCompetitionButton}
          </Button>
        </div>
      </form>
    </section>
  );
}
