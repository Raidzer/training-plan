import type { Metadata } from "next";
import { DiaryPeriodClient } from "./DiaryPeriodClient/DiaryPeriodClient";

export const metadata: Metadata = {
  title: "Дневник за период | СПИРОС",
};

export default function DiaryPeriodPage() {
  return <DiaryPeriodClient />;
}
