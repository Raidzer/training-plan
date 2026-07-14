import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionFormError,
  CompetitionFormState,
  CompetitionFormUpdate,
} from "../../types/competitionsTypes";
import { CompetitionFormFields } from "../CompetitionFormFields/CompetitionFormFields";
import styles from "./CompetitionEditForm.module.scss";

type CompetitionEditFormProps = {
  competitionId: number;
  form: CompetitionFormState;
  error: CompetitionFormError | null;
  validationAttempt: number;
  updating: boolean;
  onChange: CompetitionFormUpdate;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
};

export function CompetitionEditForm({
  competitionId,
  form,
  error,
  validationAttempt,
  updating,
  onChange,
  onSave,
  onCancel,
}: CompetitionEditFormProps) {
  const idPrefix = "competition-edit-" + competitionId;
  const titleId = idPrefix + "-title";

  return (
    <section className={styles.editor} aria-labelledby={titleId}>
      <Typography.Title level={4} id={titleId} className={styles.title}>
        {competitionsLabels.competitionEditTitle}
      </Typography.Title>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <CompetitionFormFields
          idPrefix={idPrefix}
          form={form}
          error={error}
          validationAttempt={validationAttempt}
          disabled={updating}
          onChange={onChange}
        />
        <div className={styles.actions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined aria-hidden />}
            loading={updating}
            disabled={updating}
            aria-label={competitionsLabels.saveButton}
          >
            {competitionsLabels.saveButton}
          </Button>
          <Button icon={<CloseOutlined aria-hidden />} disabled={updating} onClick={onCancel}>
            {competitionsLabels.cancelButton}
          </Button>
        </div>
      </form>
    </section>
  );
}
