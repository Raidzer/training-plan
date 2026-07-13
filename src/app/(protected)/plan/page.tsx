import type { Metadata } from "next";
import { PlanClient } from "./PlanClient/PlanClient";

export const metadata: Metadata = {
  title: "План тренировок | СПИРОС",
};

export default function PlanPage() {
  return <PlanClient />;
}
