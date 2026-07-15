import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О клубе | СПИРОС",
  description: "Страница о клубе СПИРОС находится в разработке.",
};

export default function AboutPage() {
  return (
    <section aria-labelledby="about-page-title">
      <h1 id="about-page-title">О клубе</h1>
      <p>Страница в разработке. Скоро здесь появится описание клуба.</p>
    </section>
  );
}
