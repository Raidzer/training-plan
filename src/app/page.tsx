import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>RunLog</h1>
      <p>
        <Link href='/dashboard'>Кабинет</Link>
      </p>
    </main>
  );
}
