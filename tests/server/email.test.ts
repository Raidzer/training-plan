import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPasswordResetEmail, sendShoeLimitEmail, sendVerificationEmail } from "@/server/email";

const { sendMailMock } = vi.hoisted(() => {
  return { sendMailMock: vi.fn() };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailMock,
    }),
  },
}));

describe("email (Отправка писем)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    sendMailMock.mockResolvedValue("sent");
  });

  describe("sendVerificationEmail", () => {
    it("должен отправить письмо подтверждения с правильной ссылкой", async () => {
      const email = "user@example.com";
      const token = "verify-token-123";

      await sendVerificationEmail(email, token);

      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.from).toBe('"Сервис бегового клуба СПИРОС" <noreply@training-plan.com>');
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe("Подтверждение Email");
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain("/api/auth/verify-email");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("должен отправить письмо сброса пароля с правильной ссылкой", async () => {
      const email = "user@example.com";
      const token = "reset-token-456";

      await sendPasswordResetEmail(email, token);

      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe("Сброс пароля");
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain("/auth/reset-password");
    });
  });

  describe("sendShoeLimitEmail", () => {
    it("должен отправить письмо о превышении лимита пробега обуви", async () => {
      const email = "runner@example.com";

      await sendShoeLimitEmail({
        email,
        shoeName: 'Pegasus "Fast" <script>',
        currentMileageKm: "801",
        mileageLimitKm: "800",
      });

      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe("Пора проверить беговую обувь");
      expect(callArgs.html).toContain("Pegasus &quot;Fast&quot; &lt;script&gt;");
      expect(callArgs.html).not.toContain("<script>");
      expect(callArgs.html).toContain("801");
      expect(callArgs.html).toContain("800");
    });
  });
});
