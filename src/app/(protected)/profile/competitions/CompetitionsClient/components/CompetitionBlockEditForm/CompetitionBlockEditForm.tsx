import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type {
  CompetitionBlockFormError,
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
} from "../../types/competitionsTypes";
import { competitionsLabels } from "../../constants/competitionsConstants";
import { CompetitionBlockFields } from "../CompetitionBlockFields/CompetitionBlockFields";
import styles from "./CompetitionBlockEditForm.module.scss";

type CompetitionBlockEditFormProps = {
  blockId: number;
  form: CompetitionBlockFormState;
  error: CompetitionBlockFormError | null;
  validationAttempt: number;
  updating: boolean;
  onChange: CompetitionBlockFormUpdate;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
};

export function CompetitionBlockEditForm({
  blockId,
  form,
  error,
  validationAttempt,
  updating,
  onChange,
  onSave,
  onCancel,
}: CompetitionBlockEditFormProps) {
  const titleId = "competition-block-edit-" + blockId + "-title";

  return (
    <section className={styles.editor} aria-labelledby={titleId}>
      <h3 id={titleId}>{competitionsLabels.editBlockTitle}</h3>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <CompetitionBlockFields
          idPrefix={"competition-block-edit-" + blockId}
          form={form}
          error={error}
          validationAttempt={validationAttempt}
          disabled={updating}
          inline
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
          <Button icon={<CloseOutlined aria-hidden />} onClick={onCancel} disabled={updating}>
            {competitionsLabels.cancelButton}
          </Button>
        </div>
      </form>
    </section>
  );
}
