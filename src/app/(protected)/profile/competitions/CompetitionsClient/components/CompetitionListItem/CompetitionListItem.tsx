import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FlagOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef } from "react";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import {
  formatCompetitionDate,
  formatCompetitionDistanceLabel,
} from "@/shared/utils/competitionUtils";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionFormError,
  CompetitionFormState,
  CompetitionFormUpdate,
  CompetitionItem,
} from "../../types/competitionsTypes";
import { CompetitionEditForm } from "../CompetitionEditForm/CompetitionEditForm";
import styles from "./CompetitionListItem.module.scss";

type CompetitionListItemProps = {
  competition: CompetitionItem;
  isEditing: boolean;
  editingForm: CompetitionFormState;
  editingError: CompetitionFormError | null;
  editingValidationAttempt: number;
  updating: boolean;
  deleting: boolean;
  actionsDisabled: boolean;
  onStartEdit: (competition: CompetitionItem) => void;
  onChangeEdit: CompetitionFormUpdate;
  onSaveEdit: () => Promise<boolean | void> | boolean | void;
  onCancelEdit: () => void;
  onDelete: (competition: CompetitionItem) => void;
};

export function CompetitionListItem({
  competition,
  isEditing,
  editingForm,
  editingError,
  editingValidationAttempt,
  updating,
  deleting,
  actionsDisabled,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CompetitionListItemProps) {
  const editButtonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const titleId = "competition-" + competition.id + "-title";
  const isMain = competition.priority === COMPETITION_PRIORITIES.MAIN;

  useEffect(() => {
    if (!isEditing && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    shouldRestoreFocusRef.current = true;
    return await onSaveEdit();
  };

  const handleCancel = () => {
    shouldRestoreFocusRef.current = true;
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <li className={styles.editingItem}>
        <CompetitionEditForm
          competitionId={competition.id}
          form={editingForm}
          error={editingError}
          validationAttempt={editingValidationAttempt}
          updating={updating}
          onChange={onChangeEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </li>
    );
  }

  return (
    <li className={styles.listItem}>
      <article
        className={styles.item + (isMain ? " " + styles.mainItem : "")}
        aria-labelledby={titleId}
      >
        <span className={styles.timelineMarker} aria-hidden>
          {isMain ? <TrophyOutlined /> : <FlagOutlined />}
        </span>

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.date}>
              <CalendarOutlined aria-hidden />
              <time dateTime={competition.date}>{formatCompetitionDate(competition.date)}</time>
            </span>
            <h4 id={titleId}>{competition.nameLocation}</h4>
            <span className={styles.distance}>
              {formatCompetitionDistanceLabel(competition.distanceLabel)}
            </span>
          </div>

          <div className={styles.actions}>
            <Button
              ref={editButtonRef}
              icon={<EditOutlined aria-hidden />}
              aria-label={competitionsLabels.editCompetitionAria + ": " + competition.nameLocation}
              disabled={actionsDisabled}
              onClick={() => {
                onStartEdit(competition);
              }}
            >
              {competitionsLabels.editButton}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined aria-hidden />}
              aria-label={
                competitionsLabels.deleteCompetitionAria + ": " + competition.nameLocation
              }
              disabled={actionsDisabled}
              loading={deleting}
              onClick={() => {
                onDelete(competition);
              }}
            >
              {competitionsLabels.deleteButton}
            </Button>
          </div>
        </header>

        <dl className={styles.meta}>
          <div>
            <dt>{competitionsLabels.priorityLabel}</dt>
            <dd className={isMain ? styles.mainPriority : undefined}>
              {isMain ? <TrophyOutlined aria-hidden /> : null}
              <span>
                {isMain ? competitionsLabels.mainPriority : competitionsLabels.regularPriority}
              </span>
            </dd>
          </div>
          <div>
            <dt>{competitionsLabels.resultLabel}</dt>
            <dd className={styles.result}>{competition.result || competitionsLabels.noResult}</dd>
          </div>
        </dl>
      </article>
    </li>
  );
}
