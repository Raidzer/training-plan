import styles from "./ResultsRouteState.module.scss";

export default function ResultsLoading() {
  return (
    <section className={styles.loading} aria-busy="true" aria-labelledby="results-loading-title">
      <h1 className={styles.visuallyHidden} id="results-loading-title">
        Загружаем результаты клуба
      </h1>
      <div className={styles.loadingHero} aria-hidden="true">
        <span className={styles.loadingEyebrow} />
        <span className={styles.loadingTitle} />
        <span className={styles.loadingText} />
      </div>
      <div className={styles.loadingFilters} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.loadingRows} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
