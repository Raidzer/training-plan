import {
  CaretDownOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Tag, Tooltip, Typography } from "antd";
import { CompetitionBlockEditForm } from "../CompetitionBlockEditForm/CompetitionBlockEditForm";
import { CompetitionCreateForm } from "../CompetitionCreateForm/CompetitionCreateForm";
import { CompetitionTable } from "../CompetitionTable/CompetitionTable";
import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
  CompetitionBlockItem,
  CompetitionFormState,
  CompetitionItem,
} from "../../types/competitionsTypes";
import { formatBlockPeriod } from "../../utils/competitionsUtils";
import styles from "./CompetitionBlockCard.module.scss";

type CompetitionBlockCardProps = {
  block: CompetitionBlockItem;
  collapsed: boolean;
  editingBlockId: number | null;
  editingBlockForm: CompetitionBlockFormState;
  updatingBlockId: number | null;
  deletingBlockId: number | null;
  creatingCompetitionBlockId: number | null;
  editingCompetitionId: number | null;
  editingCompetitionForm: CompetitionFormState;
  updatingCompetitionId: number | null;
  deletingCompetitionId: number | null;
  competitionForm: CompetitionFormState;
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

export function CompetitionBlockCard({
  block,
  collapsed,
  editingBlockId,
  editingBlockForm,
  updatingBlockId,
  deletingBlockId,
  creatingCompetitionBlockId,
  editingCompetitionId,
  editingCompetitionForm,
  updatingCompetitionId,
  deletingCompetitionId,
  competitionForm,
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
}: CompetitionBlockCardProps) {
  const isEditingBlock = editingBlockId === block.id;
  const isUpdatingBlock = updatingBlockId === block.id;
  const isDeletingBlock = deletingBlockId === block.id;
  const blockActionsDisabled =
    updatingBlockId !== null || deletingBlockId !== null || isEditingBlock;

  return (
    <article className={styles.blockCard}>
      <div className={styles.blockHeader}>
        <Tooltip title={competitionsLabels.toggleBlockAria}>
          <Button
            type="text"
            size="small"
            icon={collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
            onClick={() => {
              onToggleBlock(block.id);
            }}
            aria-label={competitionsLabels.toggleBlockAria}
          />
        </Tooltip>

        <div className={styles.blockMain}>
          {isEditingBlock ? (
            <CompetitionBlockEditForm
              form={editingBlockForm}
              updating={isUpdatingBlock}
              onChange={onChangeBlockEdit}
              onSave={onSaveBlockEdit}
              onCancel={onCancelBlockEdit}
            />
          ) : (
            <div className={styles.blockTitleGroup}>
              <div className={styles.blockTitleLine}>
                <Typography.Title level={5} className={styles.blockTitle}>
                  {block.title}
                </Typography.Title>
                <Tag>{block.competitions.length}</Tag>
              </div>
              <Typography.Text type="secondary">{formatBlockPeriod(block)}</Typography.Text>
            </div>
          )}
        </div>

        {!isEditingBlock ? (
          <div className={styles.blockActions}>
            <Tooltip title={competitionsLabels.editButton}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  onStartBlockEdit(block);
                }}
                disabled={blockActionsDisabled}
                aria-label={competitionsLabels.editBlockAria}
              />
            </Tooltip>
            <Tooltip title={competitionsLabels.deleteButton}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  onDeleteBlock(block);
                }}
                disabled={blockActionsDisabled}
                loading={isDeletingBlock}
                aria-label={competitionsLabels.deleteBlockAria}
              />
            </Tooltip>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className={styles.blockBody}>
          <CompetitionCreateForm
            form={competitionForm}
            saving={creatingCompetitionBlockId === block.id}
            onChange={(key, value) => {
              onChangeCompetitionForm(block.id, key, value);
            }}
            onSubmit={() => {
              onCreateCompetition(block.id);
            }}
          />
          <CompetitionTable
            competitions={block.competitions}
            editingCompetitionId={editingCompetitionId}
            editingCompetitionForm={editingCompetitionForm}
            updatingCompetitionId={updatingCompetitionId}
            deletingCompetitionId={deletingCompetitionId}
            onStartEdit={onStartCompetitionEdit}
            onChangeEdit={onChangeCompetitionEdit}
            onSaveEdit={onSaveCompetitionEdit}
            onCancelEdit={onCancelCompetitionEdit}
            onDelete={onDeleteCompetition}
          />
        </div>
      ) : null}
    </article>
  );
}
