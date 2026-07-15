import { REGISTER_TEXT } from "../../constants/registerConstants";
import styles from "./RegisterLoadingState.module.scss";

export function RegisterLoadingState() {
  return (
    <div className={styles.content} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.eyebrow}>{REGISTER_TEXT.eyebrow}</span>
      <h1 className={styles.title}>{REGISTER_TEXT.loadingTitle}</h1>
      <p className={styles.description}>{REGISTER_TEXT.loadingDescription}</p>

      <div className={styles.skeleton} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span className={styles.wide} />
      </div>
    </div>
  );
}
