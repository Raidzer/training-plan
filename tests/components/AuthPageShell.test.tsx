import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPageShell } from "@/components/AuthPageShell/AuthPageShell";

describe("AuthPageShell", () => {
  it("показывает доступную структуру, дочерний контент и тренировочный цикл", () => {
    render(
      <AuthPageShell mode="login">
        <h1>Форма входа</h1>
      </AuthPageShell>
    );

    const shell = screen.getByRole("region", {
      name: "Личный кабинет бегового клуба СПИРОС",
    });
    expect(shell.getAttribute("data-mode")).toBe("login");
    expect(within(shell).getByRole("heading", { level: 1, name: "Форма входа" })).toBeTruthy();
    expect(within(shell).queryByText("Личный кабинет клуба")).toBeNull();
    expect(within(shell).queryByText("От плана до старта — один тренировочный цикл.")).toBeNull();

    const workflow = within(shell).getByRole("list", { name: "Тренировочный цикл" });
    expect(within(workflow).getAllByRole("listitem")).toHaveLength(3);
    expect(within(workflow).getByRole("heading", { level: 3, name: "План" })).toBeTruthy();
    expect(within(workflow).getByRole("heading", { level: 3, name: "Отчёт" })).toBeTruthy();
    expect(within(workflow).getByRole("heading", { level: 3, name: "Прогресс" })).toBeTruthy();
  });

  it("показывает контекст режима регистрации", () => {
    render(
      <AuthPageShell mode="register">
        <div>Регистрационная форма</div>
      </AuthPageShell>
    );

    const shell = screen.getByRole("region", {
      name: "Личный кабинет бегового клуба СПИРОС",
    });
    expect(shell.getAttribute("data-mode")).toBe("register");
    expect(within(shell).getByText("Регистрационная форма")).toBeTruthy();
    expect(within(shell).getByText("Беговой клуб СПИРОС")).toBeTruthy();
    expect(
      within(shell).getByRole("heading", {
        level: 2,
        name: "Начните работу с уже настроенным доступом.",
      })
    ).toBeTruthy();
    expect(within(shell).getByText("Регистрация по приглашению")).toBeTruthy();
  });
});
