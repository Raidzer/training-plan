"use client";

import { ConversionPanel } from "./components/ConversionPanel/ConversionPanel";
import { SPEED_TO_PACE_TEXT } from "./constants/speedToPaceConstants";
import { useSpeedToPace } from "./hooks/useSpeedToPace";
import styles from "./SpeedToPaceClient.module.scss";

type SpeedToPaceClientProps = {
  showIntro?: boolean;
};

export function SpeedToPaceClient({ showIntro = true }: SpeedToPaceClientProps) {
  const converter = useSpeedToPace();

  return (
    <div className={styles.page}>
      {showIntro ? (
        <header className={styles.header}>
          <p className={styles.eyebrow}>{SPEED_TO_PACE_TEXT.header.eyebrow}</p>
          <h1 className={styles.title}>{SPEED_TO_PACE_TEXT.header.title}</h1>
          <p className={styles.description}>{SPEED_TO_PACE_TEXT.header.description}</p>
          <p className={styles.description}>{SPEED_TO_PACE_TEXT.header.hint}</p>
        </header>
      ) : null}

      <ConversionPanel {...converter} />
    </div>
  );
}
