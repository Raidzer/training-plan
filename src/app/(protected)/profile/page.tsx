import { redirect } from "next/navigation";
import { requireAuth } from "@/server/authGuards";
import { getUserProfileById } from "@/server/services/users";
import { ProfileClient } from "./ProfileClient/ProfileClient";

export default async function Profile() {
  const session = await requireAuth();

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
        patronymic: user.patronymic ?? "",
        heightCm: user.heightCm ?? null,
        dateOfBirth: user.dateOfBirth ?? null,
        occupation: user.occupation ?? null,
      }}
    />
  );
}
