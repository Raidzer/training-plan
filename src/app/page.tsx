import Link from "next/link";

export default function Home() {
  return (
    <main>
      <p>
        <Link href="/dashboard">Личный кабинет</Link>
      </p>
    </main>
  );
}
