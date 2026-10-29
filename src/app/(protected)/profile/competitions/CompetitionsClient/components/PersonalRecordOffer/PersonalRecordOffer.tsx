import { formatCompetitionDate } from "@/shared/utils/competitionUtils";
import { personalRecordOfferLabels } from "../../constants/personalRecordOfferConstants";
import type { CompetitionItem } from "../../types/competitionsTypes";
import styles from "./PersonalRecordOffer.module.scss";

type PersonalRecordOfferProps = {
  distanceLabel: string;
  previousTime: string | null;
  newTime: string;
  competition: Pick<CompetitionItem, "date" | "nameLocation">;
  error: string | null;
};

export const PersonalRecordOffer = ({
  distanceLabel,
  previousTime,
  newTime,
  competition,
  error,
}: PersonalRecordOfferProps) => (
  <div className={styles.content}>
    <p className={styles.distance}>
      <span>{personalRecordOfferLabels.distanceLabel}</span>
      <strong>{distanceLabel}</strong>
    </p>
    <dl className={styles.times}>
      <div>
        <dt>{personalRecordOfferLabels.previousTimeLabel}</dt>
        <dd>{previousTime ?? personalRecordOfferLabels.noCurrentRecord}</dd>
      </div>
      <div className={styles.newTime}>
        <dt>{personalRecordOfferLabels.newTimeLabel}</dt>
        <dd>{newTime}</dd>
      </div>
    </dl>
    <dl className={styles.details}>
      <div>
        <dt>{personalRecordOfferLabels.dateLabel}</dt>
        <dd>
          <time dateTime={competition.date}>{formatCompetitionDate(competition.date)}</time>
        </dd>
      </div>
      <div>
        <dt>{personalRecordOfferLabels.raceNameLabel}</dt>
        <dd>{competition.nameLocation}</dd>
      </div>
    </dl>
    <p className={styles.description}>{personalRecordOfferLabels.transferDescription}</p>
    {error && (
      <p className={styles.error} role="alert">
        {error}
      </p>
    )}
  </div>
);
