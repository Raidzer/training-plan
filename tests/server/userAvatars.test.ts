import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));
vi.mock("@/server/db/client", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  return { db: drizzle({ query: queryMock } as never) };
});

import {
  deleteUserAvatarById,
  getUserAvatarById,
  getUserAvatarVersionById,
  saveUserAvatar,
} from "@/server/services/userAvatars";

describe("services/userAvatars", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("читает версию отдельно от бинарных данных и ограничивает чтение пользователем", async () => {
    queryMock.mockResolvedValue({ rows: [["version"]] });
    await expect(getUserAvatarVersionById(13)).resolves.toBe("version");
    const [query, params] = queryMock.mock.calls[0];
    expect(query.text).toMatch(
      /^select "version" from "user_avatars" where "user_avatars"\."user_id" = \$1 limit \$2$/
    );
    expect(params).toEqual([13, 1]);
    queryMock.mockResolvedValue({ rows: [] });
    await expect(getUserAvatarVersionById(13)).resolves.toBeNull();
  });

  it("читает бинарный аватар собственного аккаунта", async () => {
    const data = Buffer.from("image");
    queryMock.mockResolvedValue({ rows: [[data, "version"]] });
    await expect(getUserAvatarById(13)).resolves.toEqual({ data, version: "version" });
    expect(queryMock.mock.calls[0][1]).toEqual([13, 1]);
    queryMock.mockResolvedValue({ rows: [] });
    await expect(getUserAvatarById(13)).resolves.toBeNull();
  });

  it("заменяет данные и новую UUID-версию одним UPSERT", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const data = Buffer.from("image");
    const version = await saveUserAvatar(13, data);
    expect(version).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    const [query, params] = queryMock.mock.calls[0];
    expect(query.text).toContain('on conflict ("user_id") do update set');
    expect(params).toEqual([13, data, version, data, version]);
  });

  it("удаляет только аватар указанного пользователя и передаёт ошибки БД", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await deleteUserAvatarById(13);
    expect(queryMock.mock.calls[0][0].text).toBe(
      'delete from "user_avatars" where "user_avatars"."user_id" = $1'
    );
    expect(queryMock.mock.calls[0][1]).toEqual([13]);
    const error = new Error("offline");
    queryMock.mockRejectedValue(error);
    await expect(saveUserAvatar(13, Buffer.from("image"))).rejects.toBeDefined();
  });
});
