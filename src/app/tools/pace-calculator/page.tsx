import type { Metadata } from "next";
import { PublicToolShell } from "@/components/PublicToolShell/PublicToolShell";
import { PaceCalculatorClient } from "./PaceCalculatorClient/PaceCalculatorClient";

export const metadata: Metadata = {
  title: "Калькулятор темпа и результата | СПИРОС",
  description: "Расчёт темпа, времени на дистанции, круга 400 м и километровой раскладки для бега.",
};

export default function PaceCalculatorPage() {
  return (
    <PublicToolShell
      activeHref="/tools/pace-calculator"
      title="Темп, результат и раскладка"
      description="Свяжите дистанцию с итоговым временем, темпом и кругом 400 метров. Любое из временных значений можно сделать отправной точкой, а километровая раскладка обновится автоматически."
      stats={[
        { label: "Дистанция", value: "метры" },
        { label: "Темп", value: "мин / км" },
        { label: "Контрольный круг", value: "400 м" },
      ]}
    >
      <PaceCalculatorClient showIntro={false} />
    </PublicToolShell>
  );
}
