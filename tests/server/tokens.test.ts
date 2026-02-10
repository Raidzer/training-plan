import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateVerificationToken,
  generatePasswordResetToken,
  getVerificationTokenByToken,
} from "@/server/tokens";
import { db } from "@/server/db/client";

vi.mock("@/server/db/client", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

describe("tokens (Токены)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateVerificationToken", () => {
    it("должен сгенерировать токен и записать его в базу данных", async () => {
      const email = "test@example.com";
      const valuesMock = vi.fn();
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const token = await generateVerificationToken(email);

      expect(typeof token).toBe("string");
      expect(db.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: email,
          token: token,
          type: "verify-email",
        })
      );
    });
  });

  describe("generatePasswordResetToken", () => {
    it("должен сгенерировать токен сброса пароля и записать его в базу данных", async () => {
      const email = "test@example.com";
      const valuesMock = vi.fn();
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const token = await generatePasswordResetToken(email);

      expect(typeof token).toBe("string");
      expect(db.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: email,
          token: token,
          type: "reset-password",
        })
      );
    });
  });

  describe("getVerificationTokenByToken", () => {
    it("должен вернуть токен по его значению", async () => {
      const tokenValue = "some-token";
      const mockResult = { id: 1, token: tokenValue, identifier: "test@example.com" };

      const whereMock = vi.fn().mockResolvedValue([mockResult]);
      const fromMock = vi.fn(() => ({ where: whereMock }));
      const selectMock = vi.fn(() => ({ from: fromMock }));
      (db.select as any).mockImplementation(selectMock);

      const result = await getVerificationTokenByToken(tokenValue);

      expect(result).toEqual(mockResult);
      expect(db.select).toHaveBeenCalled();
    });

    it("должен вернуть undefined, если токен не найден", async () => {
      const tokenValue = "non-existent-token";

      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn(() => ({ where: whereMock }));
      const selectMock = vi.fn(() => ({ from: fromMock }));
      (db.select as any).mockImplementation(selectMock);

      const result = await getVerificationTokenByToken(tokenValue);

      expect(result).toBeUndefined();
    });
  });
});
