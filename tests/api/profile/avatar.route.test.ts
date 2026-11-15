import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession } from "@tests/helpers";

const { authMock, getAvatarMock, saveAvatarMock, deleteAvatarMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAvatarMock: vi.fn(),
  saveAvatarMock: vi.fn(),
  deleteAvatarMock: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/server/services/userAvatars", () => ({
  getUserAvatarById: getAvatarMock,
  saveUserAvatar: saveAvatarMock,
  deleteUserAvatarById: deleteAvatarMock,
}));

import { DELETE, GET, PUT } from "@/app/api/profile/avatar/route";

let image: Buffer;
const URL = "http://localhost/api/profile/avatar";
function createUpload(body: BodyInit = new Uint8Array(image), headers?: HeadersInit) {
  return new Request(URL, {
    method: "PUT",
    body,
    headers: { "Content-Type": "image/png", ...headers },
  });
}

describe("/api/profile/avatar", () => {
  beforeAll(async () => {
    image = await sharp({ create: { width: 512, height: 512, channels: 3, background: "red" } })
      .png()
      .toBuffer();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    getAvatarMock.mockResolvedValue({ data: image, version: "saved" });
    saveAvatarMock.mockResolvedValue("new-version");
    deleteAvatarMock.mockResolvedValue(undefined);
  });

  it.each([
    null,
    createSession({ id: "0" }),
    createSession({ id: "-1" }),
    createSession({ id: "1.5" }),
    createSession({ id: "9007199254740992" }),
    createSession({ id: "no-id" }),
  ])("отклоняет неактивный аккаунт или некорректный session id: %j", async (session) => {
    authMock.mockResolvedValue(session);
    expect((await GET()).status).toBe(401);
    expect((await PUT(createUpload())).status).toBe(401);
    expect((await DELETE(new Request(URL, { method: "DELETE" }))).status).toBe(401);
    expect(saveAvatarMock).not.toHaveBeenCalled();
    expect(deleteAvatarMock).not.toHaveBeenCalled();
  });

  it("закрывает изменение и удаление для чужого origin", async () => {
    expect((await PUT(createUpload(undefined, { Origin: "http://evil.test" }))).status).toBe(403);
    expect(
      (
        await DELETE(
          new Request(URL, { method: "DELETE", headers: { Origin: "http://evil.test" } })
        )
      ).status
    ).toBe(403);
    expect(saveAvatarMock).not.toHaveBeenCalled();
    expect(deleteAvatarMock).not.toHaveBeenCalled();
  });

  it("возвращает собственное изображение приватно без кеширования и sniffing", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(image);
    expect(getAvatarMock).toHaveBeenCalledWith(13);
  });

  it("возвращает 404 при отсутствии аватара", async () => {
    getAvatarMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(404);
  });

  it("сохраняет обработанный WebP по id сессии и возвращает версию", async () => {
    const response = await PUT(createUpload());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: "new-version" });
    const [userId, data] = saveAvatarMock.mock.calls[0];
    expect(userId).toBe(13);
    expect((await sharp(data).metadata()).format).toBe("webp");
  });

  it("не меняет БД для неподдерживаемого MIME и поддельного содержимого", async () => {
    expect((await PUT(createUpload(undefined, { "Content-Type": "image/svg+xml" }))).status).toBe(
      415
    );
    expect((await PUT(createUpload("not an image"))).status).toBe(400);
    expect(saveAvatarMock).not.toHaveBeenCalled();
  });

  it.each([undefined, "1"])(
    "ограничивает фактический поток при Content-Length=%s и отменяет дальнейшее чтение",
    async (contentLength) => {
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(1024 * 1024));
          controller.enqueue(new Uint8Array(1));
        },
        cancel,
      });
      const headers = new Headers({ "Content-Type": "image/png" });
      if (contentLength) {
        headers.set("Content-Length", contentLength);
      }
      const request = { url: URL, headers, body } as Request;
      expect((await PUT(request)).status).toBe(413);
      expect(cancel).toHaveBeenCalledOnce();
      expect(saveAvatarMock).not.toHaveBeenCalled();
    }
  );

  it("возвращает 400 для пустого и оборванного потока", async () => {
    expect(
      (await PUT(new Request(URL, { method: "PUT", headers: { "Content-Type": "image/png" } })))
        .status
    ).toBe(400);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("disconnected"));
      },
    });
    expect(
      (
        await PUT({
          url: URL,
          headers: new Headers({ "Content-Type": "image/png" }),
          body,
        } as Request)
      ).status
    ).toBe(400);
    expect(saveAvatarMock).not.toHaveBeenCalled();
  });

  it("идемпотентно удаляет фото собственного аккаунта", async () => {
    const response = await DELETE(new Request(URL, { method: "DELETE" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(deleteAvatarMock).toHaveBeenCalledWith(13);
  });

  it("обрабатывает гонку с удалением аккаунта как 404 и ошибку БД как 500", async () => {
    saveAvatarMock.mockRejectedValue({ cause: { code: "23503" } });
    expect((await PUT(createUpload())).status).toBe(404);
    saveAvatarMock.mockRejectedValue(new Error("offline"));
    expect((await PUT(createUpload())).status).toBe(500);
    deleteAvatarMock.mockRejectedValue(new Error("offline"));
    expect((await DELETE(new Request(URL, { method: "DELETE" }))).status).toBe(500);
    getAvatarMock.mockRejectedValue(new Error("offline"));
    expect((await GET()).status).toBe(500);
  });
});
