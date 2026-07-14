"use client";

import { App } from "antd";
import { CompetitionBlockCreateForm } from "./components/CompetitionBlockCreateForm/CompetitionBlockCreateForm";
import { CompetitionBlockList } from "./components/CompetitionBlockList/CompetitionBlockList";
import { CompetitionsHeader } from "./components/CompetitionsHeader/CompetitionsHeader";
import { CompetitionsOverview } from "./components/CompetitionsOverview/CompetitionsOverview";
import { useCompetitions } from "./hooks/useCompetitions";
import styles from "./CompetitionsClient.module.scss";

export function CompetitionsClient() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const competitions = useCompetitions({ messageApi, modalApi });

  const blockEditor = {
    editingId: competitions.editingBlockId,
    form: competitions.editingBlockForm,
    error: competitions.editingBlockFormError,
    validationAttempt: competitions.editingBlockValidationAttempt,
    updatingId: competitions.updatingBlockId,
    deletingId: competitions.deletingBlockId,
    onStart: competitions.handleStartBlockEdit,
    onChange: competitions.updateEditingBlockForm,
    onSave: competitions.handleSaveBlockEdit,
    onCancel: competitions.handleCancelBlockEdit,
    onDelete: competitions.handleDeleteBlock,
  };

  const competitionCreator = {
    creatingBlockId: competitions.creatingCompetitionBlockId,
    getForm: competitions.getCompetitionForm,
    getError: competitions.getCompetitionFormError,
    getValidationAttempt: competitions.getCompetitionValidationAttempt,
    onChange: competitions.updateCompetitionForm,
    onCreate: competitions.handleCreateCompetition,
  };

  const competitionEditor = {
    editingId: competitions.editingCompetitionId,
    form: competitions.editingCompetitionForm,
    error: competitions.editingCompetitionFormError,
    validationAttempt: competitions.editingCompetitionValidationAttempt,
    updatingId: competitions.updatingCompetitionId,
    deletingId: competitions.deletingCompetitionId,
    onStart: competitions.handleStartCompetitionEdit,
    onChange: competitions.updateEditingCompetitionForm,
    onSave: competitions.handleSaveCompetitionEdit,
    onCancel: competitions.handleCancelCompetitionEdit,
    onDelete: competitions.handleDeleteCompetition,
  };

  const mutationInProgress =
    competitions.savingBlock ||
    competitions.updatingBlockId !== null ||
    competitions.deletingBlockId !== null ||
    competitions.creatingCompetitionBlockId !== null ||
    competitions.updatingCompetitionId !== null ||
    competitions.deletingCompetitionId !== null;
  const blockCreateDisabled =
    competitions.loading ||
    competitions.loadError ||
    competitions.editingBlockId !== null ||
    competitions.editingCompetitionId !== null ||
    mutationInProgress;

  const handleCreateFirst = () => {
    const titleInput = document.getElementById("competition-block-create-title");
    titleInput?.scrollIntoView({ block: "center" });
    titleInput?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.page}>
      <CompetitionsHeader />
      <CompetitionsOverview
        blocks={competitions.blocks}
        loading={competitions.loading}
        loadError={competitions.loadError}
      />

      <div className={styles.workspace}>
        <div className={styles.blocksColumn}>
          <CompetitionBlockList
            blocks={competitions.blocks}
            loading={competitions.loading}
            loadError={competitions.loadError}
            collapsedBlockIds={competitions.collapsedBlockIds}
            blockEditor={blockEditor}
            competitionCreator={competitionCreator}
            competitionEditor={competitionEditor}
            onRetry={competitions.handleRetry}
            onCreateFirst={handleCreateFirst}
            onToggle={competitions.toggleBlock}
          />
        </div>

        <div className={styles.createColumn}>
          <CompetitionBlockCreateForm
            form={competitions.newBlockForm}
            error={competitions.newBlockFormError}
            validationAttempt={competitions.newBlockValidationAttempt}
            saving={competitions.savingBlock}
            disabled={blockCreateDisabled}
            onChange={competitions.updateNewBlockForm}
            onSubmit={competitions.handleCreateBlock}
          />
        </div>
      </div>
    </div>
  );
}
