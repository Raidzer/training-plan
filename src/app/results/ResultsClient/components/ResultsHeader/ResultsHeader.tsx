import { PublicPageHero } from "@/components/PublicPageHero/PublicPageHero";
import { DISTANCE_TABS, RESULTS_LABELS } from "../../constants/resultsConstants";

type ResultsHeaderProps = {
  totalResults: number;
};

export function ResultsHeader({ totalResults }: ResultsHeaderProps) {
  return (
    <PublicPageHero
      eyebrow={RESULTS_LABELS.eyebrow}
      title={RESULTS_LABELS.title}
      description={RESULTS_LABELS.subtitle}
      titleId="results-page-title"
      stats={[
        { label: RESULTS_LABELS.totalResultsStat, value: totalResults },
        { label: RESULTS_LABELS.distancesStat, value: DISTANCE_TABS.length },
      ]}
    />
  );
}
