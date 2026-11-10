import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock, getUserProfileMock, getAvatarVersionMock, redirectMock } = vi.hoisted(
  () => ({
    requireAuthMock: vi.fn(),
    getUserProfileMock: vi.fn(),
    getAvatarVersionMock: vi.fn(),
    redirectMock: vi.fn(() => {
      throw new Error("redirect");
    }),
  })
);

vi.mock("@/server/authGuards", () => ({ requireAuth: requireAuthMock }));
vi.mock("@/server/services/users", () => ({ getUserProfileById: getUserProfileMock }));
vi.mock("@/server/services/userAvatars", () => ({
  getUserAvatarVersionById: getAvatarVersionMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/app/(protected)/profile/ProfileClient/ProfileClient", () => ({
  ProfileClient: () => null,
}));

import Profile from "@/app/(protected)/profile/page";

describe("Profile page avatar metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: "13" } });
    getUserProfileMock.mockResolvedValue({ id: 13, name: "Иван" });
    getAvatarVersionMock.mockResolvedValue("avatar-version");
  });

  it("passes only avatar metadata separately from editable user data", async () => {
    const page = await Profile();

    expect(getAvatarVersionMock).toHaveBeenCalledWith(13);
    expect(page.props.avatarVersion).toBe("avatar-version");
    expect(page.props.userData).not.toHaveProperty("avatarVersion");
    expect(page.props.userData).not.toHaveProperty("data");
  });

  it("supports users without an avatar", async () => {
    getAvatarVersionMock.mockResolvedValue(null);

    expect((await Profile()).props.avatarVersion).toBeNull();
  });
});
