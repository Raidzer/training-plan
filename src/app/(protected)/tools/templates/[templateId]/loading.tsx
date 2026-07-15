import styles from "./TemplateEditorRoute.module.scss";

export default function TemplateEditorLoading() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Загружаем редактор шаблона">
      <div className={styles.loadingHeader}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.loadingPanel} />
      <div className={styles.loadingPanel} />
      <div className={styles.loadingPanel} />
    </div>
  );
}
