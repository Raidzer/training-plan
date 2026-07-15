import type { Metadata } from "next";
import { PlanImportClient } from "../PlanClient/components/PlanImportClient/PlanImportClient";

export const metadata: Metadata = {
  title: "Импорт плана | СПИРОС",
};

export default function PlanImportPage() {
  return <PlanImportClient />;
}
