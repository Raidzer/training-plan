"use client";

import { Input } from "antd";
import { TimeInput } from "@/app/profile/records/TimeInput";
import styles from "./speed-to-pace.module.scss";
import { useSpeedToPace } from "./useSpeedToPace";

export function SpeedToPaceClient() {
  const {
    paceKmTimeString,
    paceMileTimeString,
    speedKmhString,
    speedMpsString,
    speedMphString,
    handleSpeedKmhChange,
    handleSpeedMpsChange,
    handleSpeedMphChange,
    handlePaceKmTimeChange,
    handlePaceMileTimeChange,
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
                  <Input
                    className={styles.input}
                    inputMode="decimal"
                    value={speedKmhString}
                    onChange={handleSpeedKmhChange}
                    aria-label="Километров в час"
                    style={{ textAlign: "center" }}
                  />
                  <span className={styles.unit}>км/ч</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Метров в сек</span>
                <div className={styles.fieldRow}>
                  <Input
                    className={styles.input}
                    inputMode="decimal"
                    value={speedMpsString}
                    onChange={handleSpeedMpsChange}
                    aria-label="Метров в секунду"
                    style={{ textAlign: "center" }}
                  />
                  <span className={styles.unit}>м/с</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Миль в час</span>
                <div className={styles.fieldRow}>
                  <Input
                    className={styles.input}
                    inputMode="decimal"
                    value={speedMphString}
                    onChange={handleSpeedMphChange}
                    aria-label="Миль в час"
                    style={{ textAlign: "center" }}
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
                    <TimeInput
                      className={`${styles.input} ${styles.inputCompact}`}
                      placeholder="00:00"
                      value={paceKmTimeString}
                      onChange={handlePaceKmTimeChange}
                      style={{ width: 100, textAlign: "center" }}
                    />
                    <span className={styles.unit}>мин:сек</span>
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Минут на милю</span>
                <div className={styles.fieldRow}>
                  <div className={styles.inputGroup}>
                    <TimeInput
                      className={`${styles.input} ${styles.inputCompact}`}
                      placeholder="00:00"
                      value={paceMileTimeString}
                      onChange={handlePaceMileTimeChange}
                      style={{ width: 100, textAlign: "center" }}
                    />
                    <span className={styles.unit}>мин:сек</span>
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
