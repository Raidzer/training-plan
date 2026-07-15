import type { Metadata } from "next";
import { getClubRecords } from "@/server/personalRecords";
import { ResultsClient } from "./ResultsClient/ResultsClient";
import { mapClubRecordsToResults } from "./ResultsClient/utils/resultsUtils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Результаты клуба | СПИРОС",
  description:
    "Лучшие результаты участников бегового клуба СПИРОС на дистанциях от 5 километров до марафона.",
};

export default async function ResultsPage() {
  const records = await getClubRecords();
  const results = mapClubRecordsToResults(records);
  return <ResultsClient results={results} />;
}
