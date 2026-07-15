import { FlagOutlined } from "@ant-design/icons";
import type {
  CompetitionFormError,
  CompetitionFormState,
  CompetitionFormUpdate,
  CompetitionItem,
} from "../../types/competitionsTypes";
import { competitionsLabels } from "../../constants/competitionsConstants";
import { CompetitionListItem } from "../CompetitionListItem/CompetitionListItem";
import styles from "./CompetitionList.module.scss";

type CompetitionListProps = {
  idPrefix: string;
  competitions: CompetitionItem[];
  editingCompetitionId: number | null;
  editingCompetitionForm: CompetitionFormState;
  editingCompetitionFormError: CompetitionFormError | null;
  editingCompetitionValidationAttempt: number;
  updatingCompetitionId: number | null;
  deletingCompetitionId: number | null;
  onStartEdit: (competition: CompetitionItem) => void;
  onChangeEdit: CompetitionFormUpdate;
  onSaveEdit: () => Promise<boolean | void> | boolean | void;
  onCancelEdit: () => void;
  onDelete: (competition: CompetitionItem) => void;
};

export function CompetitionList({
  idPrefix,
  competitions,
  editingCompetitionId,
  editingCompetitionForm,
  editingCompetitionFormError,
  editingCompetitionValidationAttempt,
  updatingCompetitionId,
  deletingCompetitionId,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CompetitionListProps) {
  if (competitions.length === 0) {
    return (
      <section className={styles.empty} aria-labelledby={idPrefix + "-empty-title"}>
        <FlagOutlined className={styles.emptyIcon} aria-hidden />
        <div>
          <h4 id={idPrefix + "-empty-title"}>{competitionsLabels.emptyCompetitionsTitle}</h4>
          <p>{competitionsLabels.emptyCompetitions}</p>
        </div>
      </section>
    );
  }

  const actionsDisabled =
    editingCompetitionId !== null ||
    updatingCompetitionId !== null ||
    deletingCompetitionId !== null;

  return (
    <ul className={styles.list} aria-label={competitionsLabels.title}>
      {competitions.map((competition) => (
        <CompetitionListItem
          key={competition.id}
          competition={competition}
          isEditing={editingCompetitionId === competition.id}
          editingForm={editingCompetitionForm}
          editingError={editingCompetitionFormError}
          editingValidationAttempt={editingCompetitionValidationAttempt}
          updating={updatingCompetitionId === competition.id}
          deleting={deletingCompetitionId === competition.id}
          actionsDisabled={actionsDisabled}
          onStartEdit={onStartEdit}
          onChangeEdit={onChangeEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
