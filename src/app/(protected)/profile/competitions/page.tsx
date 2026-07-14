import type { Metadata } from "next";
import { CompetitionsClient } from "./CompetitionsClient/CompetitionsClient";

export const metadata: Metadata = {
  title: "Соревнования | СПИРОС",
};

export default function CompetitionsPage() {
  return <CompetitionsClient />;
}
