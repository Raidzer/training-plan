import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { RECORDS_LABELS } from "../../constants/recordsConstants";
import styles from "./RecordsErrorState.module.scss";

type RecordsErrorStateProps = {
  loading: boolean;
  onRetry: () => Promise<void> | void;
};

export function RecordsErrorState({ loading, onRetry }: RecordsErrorStateProps) {
  return (
    <section className={styles.state} role="alert" aria-labelledby="records-load-error-title">
      <span className={styles.icon} aria-hidden>
        <WarningOutlined />
      </span>
      <div className={styles.content}>
        <h2 id="records-load-error-title">{RECORDS_LABELS.loadErrorTitle}</h2>
        <p>{RECORDS_LABELS.loadErrorDescription}</p>
      </div>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={() => void onRetry()}
      >
        {RECORDS_LABELS.retryButton}
      </Button>
    </section>
  );
}
