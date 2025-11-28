import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

export default async function Dashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main>
      <h1>Hi, {session.user?.name ?? session.user?.email}</h1>
      <ul>
        <li>
          <Link href="/plan">Plan</Link>
        </li>
        <li>
          <Link href="/workouts">Workouts</Link>
        </li>
      </ul>
    </main>
  );
}
