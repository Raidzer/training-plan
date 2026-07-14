import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { competitionsLabels } from "../../constants/competitionsConstants";
import styles from "./CompetitionsErrorState.module.scss";

type CompetitionsErrorStateProps = {
  loading: boolean;
  onRetry: () => Promise<void> | void;
};

export function CompetitionsErrorState({ loading, onRetry }: CompetitionsErrorStateProps) {
  return (
    <section className={styles.state} role="alert" aria-labelledby="competitions-load-error-title">
      <span className={styles.icon} aria-hidden>
        <WarningOutlined />
      </span>
      <div className={styles.content}>
        <h2 id="competitions-load-error-title">{competitionsLabels.loadErrorTitle}</h2>
        <p>{competitionsLabels.loadErrorDescription}</p>
      </div>
      <Button
        type="primary"
        icon={<ReloadOutlined aria-hidden />}
        loading={loading}
        onClick={() => {
          void onRetry();
        }}
      >
        {competitionsLabels.retryButton}
      </Button>
    </section>
  );
}
