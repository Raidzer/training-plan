import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfileById } from "@/server/services/users";
import { ProfileForm } from "./UserProfile/ProfileForm";

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
    <ProfileForm
      userData={{
        ...user,
        id: String(user.id),
        lastName: user.lastName ?? "",
      }}
    />
  );
}
