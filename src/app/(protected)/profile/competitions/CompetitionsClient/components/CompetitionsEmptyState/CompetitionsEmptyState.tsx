import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { competitionsLabels } from "../../constants/competitionsConstants";
import styles from "./CompetitionsEmptyState.module.scss";

type CompetitionsEmptyStateProps = {
  onCreate: () => void;
};

export function CompetitionsEmptyState({ onCreate }: CompetitionsEmptyStateProps) {
  return (
    <section className={styles.state} aria-labelledby="competitions-empty-title">
      <span className={styles.icon} aria-hidden>
        <CalendarOutlined />
      </span>
      <div>
        <h2 id="competitions-empty-title">{competitionsLabels.emptyBlocksTitle}</h2>
        <p>{competitionsLabels.emptyBlocks}</p>
      </div>
      <Button icon={<PlusOutlined aria-hidden />} onClick={onCreate}>
        {competitionsLabels.emptyBlocksAction}
      </Button>
    </section>
  );
}
