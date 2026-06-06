import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfileById } from "@/server/services/users";
import { ProfileClient } from "./ProfileClient/ProfileClient";

export default async function Profile() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = Number((session.user as { id?: string })?.id);
  if (!Number.isFinite(userId)) {
    redirect("/login");
  }

  const user = await getUserProfileById(userId);
  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileClient
      userData={{
        ...user,
        id: String(user.id),
        lastName: user.lastName ?? "",
      }}
    />
  );
}
