import type { Metadata } from "next";
import { RecordsClient } from "./RecordsClient/RecordsClient";

export const metadata: Metadata = {
  title: "Рекорды | СПИРОС",
};

export default function RecordsPage() {
  return <RecordsClient />;
}
