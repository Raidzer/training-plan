import { getClubRecords } from "@/lib/personalRecords";
import { ResultsClient } from "./ResultsClient/ResultsClient";
import { mapClubRecordsToResults } from "./results.utils";

export default async function ResultsPage() {
  const records = await getClubRecords();
  const results = mapClubRecordsToResults(records);
  return <ResultsClient results={results} />;
}
