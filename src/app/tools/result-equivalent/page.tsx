import type { Metadata } from "next";
import { PublicToolShell } from "@/components/PublicToolShell/PublicToolShell";
import { ResultEquivalentClient } from "./ResultEquivalentClient/ResultEquivalentClient";

export const metadata: Metadata = {
  title: "Прогноз результата на дистанции | СПИРОС",
  description:
    "Прогноз бегового результата на популярных дистанциях по моделям Ригеля, Cameron и Daniels/VDOT.",
};

export default function ResultEquivalentPage() {
  return (
    <PublicToolShell
      activeHref="/tools/result-equivalent"
      title="Прогноз результата на дистанции"
      description="Возьмите актуальный результат за отправную точку и сравните ожидаемое время на семи популярных дистанциях. Три модели помогают увидеть прогноз с разных сторон."
      stats={[
        { label: "Модели расчёта", value: "03" },
        { label: "Целевые дистанции", value: "07" },
      ]}
    >
      <ResultEquivalentClient showIntro={false} />
    </PublicToolShell>
  );
}
