"use client";

import styles from "./speed-to-pace.module.scss";
import { useSpeedToPace } from "./useSpeedToPace";

export function SpeedToPaceClient() {
  const {
    speedKmh,
    speedMps,
    speedMph,
    paceKmMinutes,
    paceKmSeconds,
    paceMileMinutes,
    paceMileSeconds,
    handleSpeedKmhChange,
    handleSpeedMpsChange,
    handleSpeedMphChange,
    handlePaceKmMinutesChange,
    handlePaceKmSecondsChange,
    handlePaceMileMinutesChange,
    handlePaceMileSecondsChange,
  } = useSpeedToPace();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Калькулятор перевода скорости (км/ч, м/с, миль/ч) в темп (мин/км, мин/милю)
        </h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>
          Позволяет мгновенно перевести скорость в разные единицы измерения (км/ч, м/с, миль/ч),
          скорость в темп (мин/км, мин/милю) и обратно.
        </p>
        <p className={styles.description}>
          Просто заполните одно из значений, остальные пересчитаются автоматически.
        </p>
      </header>

      <div className={styles.panel}>
        <div className={styles.table}>
          <div className={styles.row}>
            <div className={styles.rowTitle}>Скорость</div>
            <div className={`${styles.rowContent} ${styles.speedGrid}`}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Км в час</span>
                <div className={styles.fieldRow}>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    step={0.01}
                    value={speedKmh}
                    onChange={handleSpeedKmhChange}
                    aria-label="Километров в час"
                  />
                  <span className={styles.unit}>км/ч</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Метров в сек</span>
                <div className={styles.fieldRow}>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    step={0.01}
                    value={speedMps}
                    onChange={handleSpeedMpsChange}
                    aria-label="Метров в секунду"
                  />
                  <span className={styles.unit}>м/с</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Миль в час</span>
                <div className={styles.fieldRow}>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    step={0.01}
                    value={speedMph}
                    onChange={handleSpeedMphChange}
                    aria-label="Миль в час"
                  />
                  <span className={styles.unit}>миль/ч</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowTitle}>Темп</div>
            <div className={`${styles.rowContent} ${styles.paceGrid}`}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Минут на км</span>
                <div className={styles.fieldRow}>
                  <div className={styles.inputGroup}>
                    <input
                      className={`${styles.input} ${styles.inputCompact}`}
                      type="number"
                      min={0}
                      step={1}
                      value={paceKmMinutes}
                      onChange={handlePaceKmMinutesChange}
                      aria-label="Минут на километр"
                    />
                    <span className={styles.unit}>мин</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <input
                      className={`${styles.input} ${styles.inputCompact}`}
                      type="number"
                      min={0}
                      step={1}
                      value={paceKmSeconds}
                      onChange={handlePaceKmSecondsChange}
                      aria-label="Секунд на километр"
                    />
                    <span className={styles.unit}>сек</span>
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Минут на милю</span>
                <div className={styles.fieldRow}>
                  <div className={styles.inputGroup}>
                    <input
                      className={`${styles.input} ${styles.inputCompact}`}
                      type="number"
                      min={0}
                      step={1}
                      value={paceMileMinutes}
                      onChange={handlePaceMileMinutesChange}
                      aria-label="Минут на милю"
                    />
                    <span className={styles.unit}>мин</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <input
                      className={`${styles.input} ${styles.inputCompact}`}
                      type="number"
                      min={0}
                      step={1}
                      value={paceMileSeconds}
                      onChange={handlePaceMileSecondsChange}
                      aria-label="Секунд на милю"
                    />
                    <span className={styles.unit}>сек</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
