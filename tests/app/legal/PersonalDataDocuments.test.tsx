import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PersonalDataConsentPage from "@/app/personal-data-consent/page";
import PrivacyPolicyPage from "@/app/privacy/page";

describe("Документы об обработке персональных данных", () => {
  it("показывает политику с контактом оператора и порядком отправки отчётов", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 1, name: /политика обработки/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "raidzer93@gmail.com" }).getAttribute("href")).toBe(
      "mailto:raidzer93@gmail.com"
    );
    expect(screen.getByText(/ученик самостоятельно отправляет/i)).toBeTruthy();
  });

  it("показывает отдельную редакцию согласия и ссылку на политику", () => {
    render(<PersonalDataConsentPage />);

    expect(screen.getByRole("heading", { level: 1, name: /согласие на обработку/i })).toBeTruthy();
    expect(screen.getByText("2026-11-27").getAttribute("datetime")).toBe("2026-11-27");
    expect(screen.getByRole("link", { name: /политика обработки/i }).getAttribute("href")).toBe(
      "/privacy"
    );
  });
});
