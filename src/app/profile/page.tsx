import { redirect } from "next/navigation";
import { UserProfile } from "./UserProfile/UserProfile";
import { auth } from "@/auth";

export default async function Profile() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    redirect("/login");
  }

  return <UserProfile />;
}
