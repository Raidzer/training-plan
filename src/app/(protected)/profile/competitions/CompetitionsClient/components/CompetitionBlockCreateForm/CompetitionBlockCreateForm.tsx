import { PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type {
  CompetitionBlockFormError,
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
} from "../../types/competitionsTypes";
import { competitionsLabels } from "../../constants/competitionsConstants";
import { CompetitionBlockFields } from "../CompetitionBlockFields/CompetitionBlockFields";
import styles from "./CompetitionBlockCreateForm.module.scss";

type CompetitionBlockCreateFormProps = {
  form: CompetitionBlockFormState;
  error: CompetitionBlockFormError | null;
  validationAttempt: number;
  saving: boolean;
  disabled: boolean;
  onChange: CompetitionBlockFormUpdate;
  onSubmit: () => Promise<boolean> | boolean | void;
};

export function CompetitionBlockCreateForm({
  form,
  error,
  validationAttempt,
  saving,
  disabled,
  onChange,
  onSubmit,
}: CompetitionBlockCreateFormProps) {
  const formDisabled = disabled || saving;

  return (
    <section className={styles.panel} aria-labelledby="competition-block-create-heading">
      <header className={styles.header}>
        <Typography.Title level={2} id="competition-block-create-heading" className={styles.title}>
          {competitionsLabels.blockCreateTitle}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.description}>
          {competitionsLabels.blockCreateDescription}
        </Typography.Paragraph>
      </header>

      <form
        className={styles.form}
        noValidate
        aria-labelledby="competition-block-create-heading"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <CompetitionBlockFields
          idPrefix="competition-block-create"
          form={form}
          error={error}
          validationAttempt={validationAttempt}
          disabled={formDisabled}
          onChange={onChange}
        />

        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined aria-hidden />}
          loading={saving}
          disabled={formDisabled}
          aria-label={competitionsLabels.createBlockButton}
          className={styles.submitButton}
        >
          {competitionsLabels.createBlockButton}
        </Button>
      </form>
    </section>
  );
}
