import { Input } from "antd";
import { TimeInput } from "@/components/inputs/TimeInput";
import { SPEED_TO_PACE_TEXT } from "../../constants/speedToPaceConstants";
import type { UseSpeedToPaceReturn } from "../../types/speedToPaceTypes";
import styles from "./ConversionPanel.module.scss";

type ConversionPanelProps = Pick<
  UseSpeedToPaceReturn,
  | "paceKmTimeString"
  | "paceMileTimeString"
  | "speedKmhString"
  | "speedMpsString"
  | "speedMphString"
  | "handleSpeedKmhChange"
  | "handleSpeedMpsChange"
  | "handleSpeedMphChange"
  | "handlePaceKmTimeChange"
  | "handlePaceMileTimeChange"
>;

export function ConversionPanel({
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
}: ConversionPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="speed-converter-title">
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>{SPEED_TO_PACE_TEXT.converter.eyebrow}</p>
          <h2 className={styles.title} id="speed-converter-title">
            {SPEED_TO_PACE_TEXT.converter.title}
          </h2>
        </div>
        <p className={styles.description}>{SPEED_TO_PACE_TEXT.converter.description}</p>
      </header>

      <form
        className={styles.form}
        aria-label={SPEED_TO_PACE_TEXT.converter.formAriaLabel}
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            <span aria-hidden="true">01</span>
            {SPEED_TO_PACE_TEXT.speed.title}
          </legend>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="speed-kmh">
                {SPEED_TO_PACE_TEXT.speed.kmhLabel}
              </label>
              <div className={styles.controlRow}>
                <Input
                  id="speed-kmh"
                  className={styles.input}
                  inputMode="decimal"
                  value={speedKmhString}
                  onChange={handleSpeedKmhChange}
                />
                <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.kmhUnit}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="speed-mps">
                {SPEED_TO_PACE_TEXT.speed.mpsLabel}
              </label>
              <div className={styles.controlRow}>
                <Input
                  id="speed-mps"
                  className={styles.input}
                  inputMode="decimal"
                  value={speedMpsString}
                  onChange={handleSpeedMpsChange}
                />
                <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.mpsUnit}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="speed-mph">
                {SPEED_TO_PACE_TEXT.speed.mphLabel}
              </label>
              <div className={styles.controlRow}>
                <Input
                  id="speed-mph"
                  className={styles.input}
                  inputMode="decimal"
                  value={speedMphString}
                  onChange={handleSpeedMphChange}
                />
                <span className={styles.unit}>{SPEED_TO_PACE_TEXT.speed.mphUnit}</span>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            <span aria-hidden="true">02</span>
            {SPEED_TO_PACE_TEXT.pace.title}
          </legend>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pace-km">
                {SPEED_TO_PACE_TEXT.pace.kmLabel}
              </label>
              <div className={styles.controlRow}>
                <TimeInput
                  id="pace-km"
                  className={styles.input}
                  placeholder="00:00"
                  value={paceKmTimeString}
                  onChange={handlePaceKmTimeChange}
                />
                <span className={styles.unit}>{SPEED_TO_PACE_TEXT.pace.unit}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pace-mile">
                {SPEED_TO_PACE_TEXT.pace.mileLabel}
              </label>
              <div className={styles.controlRow}>
                <TimeInput
                  id="pace-mile"
                  className={styles.input}
                  placeholder="00:00"
                  value={paceMileTimeString}
                  onChange={handlePaceMileTimeChange}
                />
                <span className={styles.unit}>{SPEED_TO_PACE_TEXT.pace.unit}</span>
              </div>
            </div>
          </div>
        </fieldset>
      </form>

      <p className={styles.note}>{SPEED_TO_PACE_TEXT.converter.note}</p>
    </section>
  );
}
