import { CloseOutlined, WarningOutlined } from "@ant-design/icons";
import { TEMPLATES_LABELS } from "../../constants/templatesConstants";
import styles from "./TemplatesErrorBanner.module.scss";

type TemplatesErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function TemplatesErrorBanner({ message, onDismiss }: TemplatesErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <WarningOutlined className={styles.icon} aria-hidden />
      <p>{message}</p>
      <button
        type="button"
        className={styles.dismissButton}
        aria-label={TEMPLATES_LABELS.dismissError}
        onClick={onDismiss}
      >
        <CloseOutlined aria-hidden />
      </button>
    </div>
  );
}
