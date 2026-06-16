"use client";

import { App, Card, Typography } from "antd";
import { CompetitionBlockCreateForm } from "./components/CompetitionBlockCreateForm/CompetitionBlockCreateForm";
import { CompetitionBlockList } from "./components/CompetitionBlockList/CompetitionBlockList";
import { competitionsLabels } from "./constants/competitionsConstants";
import { useCompetitions } from "./hooks/useCompetitions";
import styles from "./CompetitionsClient.module.scss";

export function CompetitionsClient() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const competitions = useCompetitions({ messageApi, modalApi });

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Typography.Title level={3} className={styles.title}>
            {competitionsLabels.title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.subtitle}>
            {competitionsLabels.subtitle}
          </Typography.Paragraph>
        </div>

        <CompetitionBlockCreateForm
          form={competitions.newBlockForm}
          saving={competitions.savingBlock}
          onChange={competitions.updateNewBlockForm}
          onSubmit={competitions.handleCreateBlock}
        />

        <CompetitionBlockList
          blocks={competitions.blocks}
          loading={competitions.loading}
          editingBlockId={competitions.editingBlockId}
          editingBlockForm={competitions.editingBlockForm}
          updatingBlockId={competitions.updatingBlockId}
          deletingBlockId={competitions.deletingBlockId}
          creatingCompetitionBlockId={competitions.creatingCompetitionBlockId}
          editingCompetitionId={competitions.editingCompetitionId}
          editingCompetitionForm={competitions.editingCompetitionForm}
          updatingCompetitionId={competitions.updatingCompetitionId}
          deletingCompetitionId={competitions.deletingCompetitionId}
          collapsedBlockIds={competitions.collapsedBlockIds}
          getCompetitionForm={competitions.getCompetitionForm}
          onToggleBlock={competitions.toggleBlock}
          onStartBlockEdit={competitions.handleStartBlockEdit}
          onChangeBlockEdit={competitions.updateEditingBlockForm}
          onSaveBlockEdit={competitions.handleSaveBlockEdit}
          onCancelBlockEdit={competitions.handleCancelBlockEdit}
          onDeleteBlock={competitions.handleDeleteBlock}
          onChangeCompetitionForm={competitions.updateCompetitionForm}
          onCreateCompetition={competitions.handleCreateCompetition}
          onStartCompetitionEdit={competitions.handleStartCompetitionEdit}
          onChangeCompetitionEdit={competitions.updateEditingCompetitionForm}
          onSaveCompetitionEdit={competitions.handleSaveCompetitionEdit}
          onCancelCompetitionEdit={competitions.handleCancelCompetitionEdit}
          onDeleteCompetition={competitions.handleDeleteCompetition}
        />
      </Card>
    </main>
  );
}
