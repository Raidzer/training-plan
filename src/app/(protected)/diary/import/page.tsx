import type { Metadata } from "next";
import { DiaryImportClient } from "./DiaryImportClient/DiaryImportClient";

export const metadata: Metadata = {
  title: "Импорт дневника | СПИРОС",
};

export default function DiaryImportPage() {
  return <DiaryImportClient />;
}
