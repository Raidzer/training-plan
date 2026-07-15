import type { Metadata } from "next";
import { PublicToolShell } from "@/components/PublicToolShell/PublicToolShell";
import { SpeedToPaceClient } from "./SpeedToPaceClient/SpeedToPaceClient";

export const metadata: Metadata = {
  title: "Перевод скорости в темп | СПИРОС",
  description:
    "Перевод скорости в км/ч, м/с и милях/ч в беговой темп на километр и милю — и обратно.",
};

export default function SpeedToPacePage() {
  return (
    <PublicToolShell
      activeHref="/tools/speed-to-pace"
      title="Скорость и темп без ручных формул"
      description="Введите скорость или привычный беговой темп — остальные значения пересчитаются сразу. Можно сравнить метрические и имперские единицы в одном рабочем поле."
      stats={[
        { label: "Скорость", value: "3 единицы" },
        { label: "Темп", value: "2 формата" },
        { label: "Связанные поля", value: "5 значений" },
      ]}
    >
      <SpeedToPaceClient showIntro={false} />
    </PublicToolShell>
  );
}
