import type { Metadata } from "next";
import { ShoesClient } from "./ShoesClient/ShoesClient";

export const metadata: Metadata = {
  title: "Обувь | СПИРОС",
};

export default function ShoesPage() {
  return <ShoesClient />;
}
