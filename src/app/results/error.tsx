"use client";

import styles from "./ResultsRouteState.module.scss";

type ResultsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ResultsError({ reset }: ResultsErrorProps) {
  return (
    <section className={styles.error} role="alert" aria-labelledby="results-error-title">
      <p className={styles.errorEyebrow}>Результаты временно недоступны</p>
      <h1 className={styles.errorTitle} id="results-error-title">
        Не удалось загрузить рейтинг
      </h1>
      <p className={styles.errorText}>
        Обновите данные ещё раз. Выбранные фильтры можно будет применить после загрузки страницы.
      </p>
      <button className={styles.retryButton} type="button" onClick={reset}>
        Повторить загрузку
      </button>
    </section>
  );
}
