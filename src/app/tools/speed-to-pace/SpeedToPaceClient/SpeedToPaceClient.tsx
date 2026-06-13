"use client";

import { Input } from "antd";
import { TimeInput } from "@/components/inputs/TimeInput";
import { SPEED_TO_PACE_TEXT } from "./constants/speedToPaceConstants";
import { useSpeedToPace } from "./hooks/useSpeedToPace";
import styles from "./SpeedToPaceClient.module.scss";

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
        <h1 className={styles.title}>{SPEED_TO_PACE_TEXT.header.title}</h1>
        <div className={styles.titleLine} />
        <p className={styles.description}>{SPEED_TO_PACE_TEXT.header.description}</p>
        <p className={styles.description}>{SPEED_TO_PACE_TEXT.header.hint}</p>
      </header>

      <div className={styles.panel}>
        <div className={styles.table}>
          <div className={styles.row}>
            <div className={styles.rowTitle}>{SPEED_TO_PACE_TEXT.speed.title}</div>
            <div className={`${styles.rowContent} ${styles.speedGrid}`}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{SPEED_TO_PACE_TEXT.speed.kmhLabel}</span>
                <div className={styles.fieldRow}>
                  <Input
                    className={`${styles.input} ${styles.centeredInput}`}
                    inputMode="decimal"
                    value={speedKmhString}
                    onChange={handleSpeedKmhChange}
                    aria-label={SPEED_TO_PACE_TEXT.speed.kmhAriaLabel}
                    allowClear
                  />
                  <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.kmhUnit}</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{SPEED_TO_PACE_TEXT.speed.mpsLabel}</span>
                <div className={styles.fieldRow}>
                  <Input
                    className={`${styles.input} ${styles.centeredInput}`}
                    inputMode="decimal"
                    value={speedMpsString}
                    onChange={handleSpeedMpsChange}
                    aria-label={SPEED_TO_PACE_TEXT.speed.mpsAriaLabel}
                    allowClear
                  />
                  <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.mpsUnit}</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{SPEED_TO_PACE_TEXT.speed.mphLabel}</span>
                <div className={styles.fieldRow}>
                  <Input
                    className={`${styles.input} ${styles.centeredInput}`}
                    inputMode="decimal"
                    value={speedMphString}
                    onChange={handleSpeedMphChange}
                    aria-label={SPEED_TO_PACE_TEXT.speed.mphAriaLabel}
                    allowClear
                  />
                  <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.mphUnit}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowTitle}>{SPEED_TO_PACE_TEXT.pace.title}</div>
            <div className={`${styles.rowContent} ${styles.paceGrid}`}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{SPEED_TO_PACE_TEXT.pace.kmLabel}</span>
                <div className={styles.fieldRow}>
                  <div className={styles.inputGroup}>
                    <TimeInput
                      className={`${styles.input} ${styles.timeInput}`}
                      placeholder="00:00"
                      value={paceKmTimeString}
                      onChange={handlePaceKmTimeChange}
                      allowClear
                      aria-label={SPEED_TO_PACE_TEXT.pace.kmAriaLabel}
                    />
                    <span className={styles.unit}>{SPEED_TO_PACE_TEXT.pace.unit}</span>
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{SPEED_TO_PACE_TEXT.pace.mileLabel}</span>
                <div className={styles.fieldRow}>
                  <div className={styles.inputGroup}>
                    <TimeInput
                      className={`${styles.input} ${styles.timeInput}`}
                      placeholder="00:00"
                      value={paceMileTimeString}
                      onChange={handlePaceMileTimeChange}
                      allowClear
                      aria-label={SPEED_TO_PACE_TEXT.pace.mileAriaLabel}
                    />
                    <span className={styles.unit}>{SPEED_TO_PACE_TEXT.pace.unit}</span>
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
