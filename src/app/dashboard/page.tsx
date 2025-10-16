import { auth } from "../../auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = false;
  if (!session)
    return (
      <main>
        <p>Не авторизован</p>
        <a href="/login">Войти</a>
      </main>
    );
  return (
    <main>
      <h1>Привет, {session.user?.name}</h1>
      <ul>
        <li>
          <Link href="/plan">План</Link>
        </li>
        <li>
          <Link href="/workouts">Дневник</Link>
        </li>
      </ul>
    </main>
  );
}
