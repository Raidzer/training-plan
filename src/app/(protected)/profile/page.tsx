import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/authGuards";
import { getUserProfileById } from "@/server/services/users";
import { getUserAvatarVersionById } from "@/server/services/userAvatars";
import { ProfileClient } from "./ProfileClient/ProfileClient";

export const metadata: Metadata = {
  title: "Профиль | СПИРОС",
};

export default async function Profile() {
  const session = await requireAuth();

  const userId = Number((session.user as { id?: string })?.id);
  if (!Number.isFinite(userId)) {
    redirect("/login");
  }

  const [user, avatarVersion] = await Promise.all([
    getUserProfileById(userId),
    getUserAvatarVersionById(userId),
  ]);
  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileClient
      avatarVersion={avatarVersion}
      userData={{
        ...user,
        id: String(user.id),
        lastName: user.lastName ?? "",
        patronymic: user.patronymic ?? "",
        heightCm: user.heightCm ?? null,
        weeklyWorkloadCount: user.weeklyWorkloadCount ?? null,
        dateOfBirth: user.dateOfBirth ?? null,
        occupation: user.occupation ?? null,
        miscellaneous: user.miscellaneous ?? "",
      }}
    />
  );
}
