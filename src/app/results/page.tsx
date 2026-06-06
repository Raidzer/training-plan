export const dynamic = "force-dynamic";

import { getClubRecords } from "@/server/personalRecords";
import { ResultsClient } from "./ResultsClient/ResultsClient";
import { mapClubRecordsToResults } from "./ResultsClient/utils/resultsUtils";

export default async function ResultsPage() {
  const records = await getClubRecords();
  const results = mapClubRecordsToResults(records);
  return <ResultsClient results={results} />;
}
