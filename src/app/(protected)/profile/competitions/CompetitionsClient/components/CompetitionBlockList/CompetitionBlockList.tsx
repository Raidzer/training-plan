import { competitionsLabels } from "../../constants/competitionsConstants";
import type {
  CompetitionBlockEditorController,
  CompetitionBlockItem,
  CompetitionCreatorController,
  CompetitionEditorController,
} from "../../types/competitionsTypes";
import { CompetitionBlockCard } from "../CompetitionBlockCard/CompetitionBlockCard";
import { CompetitionsEmptyState } from "../CompetitionsEmptyState/CompetitionsEmptyState";
import { CompetitionsErrorState } from "../CompetitionsErrorState/CompetitionsErrorState";
import { CompetitionsLoadingState } from "../CompetitionsLoadingState/CompetitionsLoadingState";
import styles from "./CompetitionBlockList.module.scss";

type CompetitionBlockListProps = {
  blocks: CompetitionBlockItem[];
  loading: boolean;
  loadError: boolean;
  collapsedBlockIds: Set<number>;
  blockEditor: CompetitionBlockEditorController;
  competitionCreator: CompetitionCreatorController;
  competitionEditor: CompetitionEditorController;
  onRetry: () => Promise<void> | void;
  onCreateFirst: () => void;
  onToggle: (blockId: number) => void;
};

export function CompetitionBlockList({
  blocks,
  loading,
  loadError,
  collapsedBlockIds,
  blockEditor,
  competitionCreator,
  competitionEditor,
  onRetry,
  onCreateFirst,
  onToggle,
}: CompetitionBlockListProps) {
  let content: React.ReactNode;
  let blockCountValue = String(blocks.length);
  let blockCountLabel = competitionsLabels.blocksCountShortLabel + ": " + blocks.length;

  if (loading) {
    blockCountValue = "—";
    blockCountLabel =
      competitionsLabels.blocksCountShortLabel + ": " + competitionsLabels.overviewLoading;
  } else if (loadError) {
    blockCountValue = "—";
    blockCountLabel =
      competitionsLabels.blocksCountShortLabel + ": " + competitionsLabels.overviewUnavailable;
  }

  if (loading) {
    content = <CompetitionsLoadingState />;
  } else if (loadError) {
    content = <CompetitionsErrorState loading={loading} onRetry={onRetry} />;
  } else if (blocks.length === 0) {
    content = <CompetitionsEmptyState onCreate={onCreateFirst} />;
  } else {
    content = (
      <div className={styles.list}>
        {blocks.map((block) => (
          <CompetitionBlockCard
            key={block.id}
            block={block}
            collapsed={collapsedBlockIds.has(block.id)}
            blockEditor={blockEditor}
            competitionCreator={competitionCreator}
            competitionEditor={competitionEditor}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="competition-blocks-title">
      <header className={styles.header}>
        <div>
          <h2 id="competition-blocks-title">{competitionsLabels.blocksSectionTitle}</h2>
          <p>{competitionsLabels.blocksSectionDescription}</p>
        </div>
        <span className={styles.count} aria-label={blockCountLabel}>
          {blockCountValue}
        </span>
      </header>
      {content}
    </section>
  );
}
