import {
  CaretDownOutlined,
  CaretRightOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionBlockEditorController,
  CompetitionBlockItem,
  CompetitionCreatorController,
  CompetitionEditorController,
} from "../../types/competitionsTypes";
import { formatBlockPeriod, formatCompetitionCount } from "../../utils/competitionsUtils";
import { CompetitionBlockEditForm } from "../CompetitionBlockEditForm/CompetitionBlockEditForm";
import { CompetitionCreateForm } from "../CompetitionCreateForm/CompetitionCreateForm";
import { CompetitionList } from "../CompetitionList/CompetitionList";
import styles from "./CompetitionBlockCard.module.scss";

type CompetitionBlockCardProps = {
  block: CompetitionBlockItem;
  collapsed: boolean;
  blockEditor: CompetitionBlockEditorController;
  competitionCreator: CompetitionCreatorController;
  competitionEditor: CompetitionEditorController;
  onToggle: (blockId: number) => void;
};

export function CompetitionBlockCard({
  block,
  collapsed,
  blockEditor,
  competitionCreator,
  competitionEditor,
  onToggle,
}: CompetitionBlockCardProps) {
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const isEditingBlock = blockEditor.editingId === block.id;
  const isUpdatingBlock = blockEditor.updatingId === block.id;
  const isDeletingBlock = blockEditor.deletingId === block.id;
  const actionsDisabled =
    blockEditor.editingId !== null ||
    blockEditor.updatingId !== null ||
    blockEditor.deletingId !== null ||
    competitionCreator.creatingBlockId !== null ||
    competitionEditor.editingId !== null ||
    competitionEditor.updatingId !== null ||
    competitionEditor.deletingId !== null;
  const blockTitleId = "competition-block-" + block.id + "-title";
  const blockBodyId = "competition-block-" + block.id + "-body";
  const createFormIdPrefix = "competition-create-" + block.id;

  const handleCreateCompetition = async () => {
    const created = await competitionCreator.onCreate(block.id);
    if (created) {
      setCreateFormOpen(false);
    }

    return created;
  };

  if (isEditingBlock) {
    return (
      <article className={styles.blockCard}>
        <CompetitionBlockEditForm
          blockId={block.id}
          form={blockEditor.form}
          error={blockEditor.error}
          validationAttempt={blockEditor.validationAttempt}
          updating={isUpdatingBlock}
          onChange={blockEditor.onChange}
          onSave={blockEditor.onSave}
          onCancel={blockEditor.onCancel}
        />
      </article>
    );
  }

  return (
    <article className={styles.blockCard} aria-labelledby={blockTitleId}>
      <header className={styles.blockHeader}>
        <Button
          type="text"
          className={styles.toggleButton}
          icon={collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
          onClick={() => {
            onToggle(block.id);
          }}
          aria-label={
            (collapsed
              ? competitionsLabels.expandBlockAria
              : competitionsLabels.collapseBlockAria) +
            ": " +
            block.title
          }
          aria-expanded={!collapsed}
          aria-controls={blockBodyId}
        />

        <div className={styles.blockInfo}>
          <h3 id={blockTitleId}>{block.title}</h3>
          <div className={styles.blockMeta}>
            <span>{formatBlockPeriod(block)}</span>
            <span aria-label={formatCompetitionCount(block.competitions.length)}>
              {formatCompetitionCount(block.competitions.length)}
            </span>
          </div>
        </div>

        <div className={styles.blockActions}>
          <Button
            icon={<EditOutlined aria-hidden />}
            aria-label={competitionsLabels.editBlockAria + ": " + block.title}
            disabled={actionsDisabled}
            onClick={() => {
              blockEditor.onStart(block);
            }}
          >
            {competitionsLabels.editButton}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined aria-hidden />}
            aria-label={competitionsLabels.deleteBlockAria + ": " + block.title}
            disabled={actionsDisabled}
            loading={isDeletingBlock}
            onClick={() => {
              blockEditor.onDelete(block);
            }}
          >
            {competitionsLabels.deleteButton}
          </Button>
        </div>
      </header>

      {!collapsed ? (
        <div className={styles.blockBody} id={blockBodyId}>
          <div className={styles.competitionsHeader}>
            <div>
              <h4>{competitionsLabels.blockCompetitionsTitle}</h4>
              <span>{formatCompetitionCount(block.competitions.length)}</span>
            </div>
            <Button
              icon={createFormOpen ? <CloseOutlined aria-hidden /> : <PlusOutlined aria-hidden />}
              disabled={actionsDisabled}
              aria-expanded={createFormOpen}
              aria-controls={createFormIdPrefix + "-panel"}
              aria-label={
                (createFormOpen
                  ? competitionsLabels.closeCompetitionFormButton
                  : competitionsLabels.openCompetitionFormButton) +
                ": " +
                block.title
              }
              onClick={() => {
                setCreateFormOpen((previous) => !previous);
              }}
            >
              {createFormOpen
                ? competitionsLabels.closeCompetitionFormButton
                : competitionsLabels.openCompetitionFormButton}
            </Button>
          </div>

          {createFormOpen ? (
            <div id={createFormIdPrefix + "-panel"}>
              <CompetitionCreateForm
                idPrefix={createFormIdPrefix}
                form={competitionCreator.getForm(block.id)}
                error={competitionCreator.getError(block.id)}
                validationAttempt={competitionCreator.getValidationAttempt(block.id)}
                saving={competitionCreator.creatingBlockId === block.id}
                disabled={actionsDisabled}
                onChange={(key, value) => {
                  competitionCreator.onChange(block.id, key, value);
                }}
                onSubmit={handleCreateCompetition}
              />
            </div>
          ) : null}

          <CompetitionList
            idPrefix={"competition-list-" + block.id}
            competitions={block.competitions}
            editingCompetitionId={competitionEditor.editingId}
            editingCompetitionForm={competitionEditor.form}
            editingCompetitionFormError={competitionEditor.error}
            editingCompetitionValidationAttempt={competitionEditor.validationAttempt}
            updatingCompetitionId={competitionEditor.updatingId}
            deletingCompetitionId={competitionEditor.deletingId}
            onStartEdit={competitionEditor.onStart}
            onChangeEdit={competitionEditor.onChange}
            onSaveEdit={competitionEditor.onSave}
            onCancelEdit={competitionEditor.onCancel}
            onDelete={competitionEditor.onDelete}
          />
        </div>
      ) : null}
    </article>
  );
}
