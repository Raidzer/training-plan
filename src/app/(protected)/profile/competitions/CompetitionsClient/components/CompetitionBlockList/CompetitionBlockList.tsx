import { Empty, Spin, Typography } from "antd";
import { CompetitionBlockCard } from "../CompetitionBlockCard/CompetitionBlockCard";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
  CompetitionBlockItem,
  CompetitionFormState,
  CompetitionItem,
} from "../../types/competitionsTypes";
import styles from "./CompetitionBlockList.module.scss";

type CompetitionBlockListProps = {
  blocks: CompetitionBlockItem[];
  loading: boolean;
  editingBlockId: number | null;
  editingBlockForm: CompetitionBlockFormState;
  updatingBlockId: number | null;
  deletingBlockId: number | null;
  creatingCompetitionBlockId: number | null;
  editingCompetitionId: number | null;
  editingCompetitionForm: CompetitionFormState;
  updatingCompetitionId: number | null;
  deletingCompetitionId: number | null;
  collapsedBlockIds: Set<number>;
  getCompetitionForm: (blockId: number) => CompetitionFormState;
  onToggleBlock: (blockId: number) => void;
  onStartBlockEdit: (block: CompetitionBlockItem) => void;
  onChangeBlockEdit: CompetitionBlockFormUpdate;
  onSaveBlockEdit: () => void;
  onCancelBlockEdit: () => void;
  onDeleteBlock: (block: CompetitionBlockItem) => void;
  onChangeCompetitionForm: <Key extends keyof CompetitionFormState>(
    blockId: number,
    key: Key,
    value: CompetitionFormState[Key]
  ) => void;
  onCreateCompetition: (blockId: number) => void;
  onStartCompetitionEdit: (competition: CompetitionItem) => void;
  onChangeCompetitionEdit: <Key extends keyof CompetitionFormState>(
    key: Key,
    value: CompetitionFormState[Key]
  ) => void;
  onSaveCompetitionEdit: () => void;
  onCancelCompetitionEdit: () => void;
  onDeleteCompetition: (competition: CompetitionItem) => void;
};

export function CompetitionBlockList({
  blocks,
  loading,
  editingBlockId,
  editingBlockForm,
  updatingBlockId,
  deletingBlockId,
  creatingCompetitionBlockId,
  editingCompetitionId,
  editingCompetitionForm,
  updatingCompetitionId,
  deletingCompetitionId,
  collapsedBlockIds,
  getCompetitionForm,
  onToggleBlock,
  onStartBlockEdit,
  onChangeBlockEdit,
  onSaveBlockEdit,
  onCancelBlockEdit,
  onDeleteBlock,
  onChangeCompetitionForm,
  onCreateCompetition,
  onStartCompetitionEdit,
  onChangeCompetitionEdit,
  onSaveCompetitionEdit,
  onCancelCompetitionEdit,
  onDeleteCompetition,
}: CompetitionBlockListProps) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
        <Typography.Text type="secondary">{competitionsLabels.loadingText}</Typography.Text>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={competitionsLabels.emptyBlocks} />
    );
  }

  return (
    <div className={styles.list}>
      {blocks.map((block) => (
        <CompetitionBlockCard
          key={block.id}
          block={block}
          collapsed={collapsedBlockIds.has(block.id)}
          editingBlockId={editingBlockId}
          editingBlockForm={editingBlockForm}
          updatingBlockId={updatingBlockId}
          deletingBlockId={deletingBlockId}
          creatingCompetitionBlockId={creatingCompetitionBlockId}
          editingCompetitionId={editingCompetitionId}
          editingCompetitionForm={editingCompetitionForm}
          updatingCompetitionId={updatingCompetitionId}
          deletingCompetitionId={deletingCompetitionId}
          competitionForm={getCompetitionForm(block.id)}
          onToggleBlock={onToggleBlock}
          onStartBlockEdit={onStartBlockEdit}
          onChangeBlockEdit={onChangeBlockEdit}
          onSaveBlockEdit={onSaveBlockEdit}
          onCancelBlockEdit={onCancelBlockEdit}
          onDeleteBlock={onDeleteBlock}
          onChangeCompetitionForm={onChangeCompetitionForm}
          onCreateCompetition={onCreateCompetition}
          onStartCompetitionEdit={onStartCompetitionEdit}
          onChangeCompetitionEdit={onChangeCompetitionEdit}
          onSaveCompetitionEdit={onSaveCompetitionEdit}
          onCancelCompetitionEdit={onCancelCompetitionEdit}
          onDeleteCompetition={onDeleteCompetition}
        />
      ))}
    </div>
  );
}
