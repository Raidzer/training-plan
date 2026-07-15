import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShoeCreateForm } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoeCreateForm/ShoeCreateForm";
import { ShoeEditForm } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoeEditForm/ShoeEditForm";
import type {
  ShoeFormState,
  ShoeNotificationAvailability,
} from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";

const form: ShoeFormState = {
  name: "Pegasus",
  mileageLimitKm: "800",
  notifyOnLimitEmail: true,
  notifyOnLimitTelegram: false,
};

const availableNotifications: ShoeNotificationAvailability = {
  emailAvailable: true,
  emailReady: true,
  telegramAvailable: true,
  telegramReady: true,
};

describe("Shoe forms", () => {
  it("ShoeCreateForm отправляет изменения полей и submit", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <ShoeCreateForm
        form={form}
        saving={false}
        notificationAvailability={availableNotifications}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Pegasus"), { target: { value: "Boston" } });
    fireEvent.change(screen.getByDisplayValue("800"), { target: { value: "600" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Telegram" }));
    fireEvent.submit(screen.getByRole("form", { name: "Добавить пару" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "name", "Boston");
    expect(onChange).toHaveBeenNthCalledWith(2, "mileageLimitKm", "600");
    expect(onChange).toHaveBeenNthCalledWith(3, "notifyOnLimitEmail", false);
    expect(onChange).toHaveBeenNthCalledWith(4, "notifyOnLimitTelegram", true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ShoeEditForm отправляет изменения, save и cancel", () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <ShoeEditForm
        form={form}
        currentMileageKm="123.456"
        updating={false}
        notificationAvailability={availableNotifications}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText((_, element) => element?.textContent === "Текущий пробег: 123,46 км")
    ).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("Pegasus"), { target: { value: "Adios" } });
    fireEvent.change(screen.getByDisplayValue("800"), { target: { value: "700" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Telegram" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "name", "Adios");
    expect(onChange).toHaveBeenNthCalledWith(2, "mileageLimitKm", "700");
    expect(onChange).toHaveBeenNthCalledWith(3, "notifyOnLimitEmail", false);
    expect(onChange).toHaveBeenNthCalledWith(4, "notifyOnLimitTelegram", true);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("ShoeCreateForm блокирует недоступные каналы уведомлений", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <ShoeCreateForm
        form={form}
        saving={false}
        notificationAvailability={{
          emailAvailable: false,
          emailReady: true,
          telegramAvailable: true,
          telegramReady: true,
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    expect((screen.getByRole("checkbox", { name: "Email" }) as HTMLInputElement).disabled).toBe(
      true
    );
    expect((screen.getByRole("checkbox", { name: "Telegram" }) as HTMLInputElement).disabled).toBe(
      false
    );
    expect(screen.getByText("Подтвердите почту в профиле, чтобы включить Email.")).toBeTruthy();
  });

  it("ShoeCreateForm связывает ошибки с полями и фокусирует первую ошибку", () => {
    render(
      <ShoeCreateForm
        form={form}
        errors={{
          name: "Введите название.",
          mileageLimitKm: "Проверьте лимит.",
        }}
        validationAttempt={1}
        saving={false}
        notificationAvailability={availableNotifications}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const nameInput = screen.getByRole("textbox", { name: "Название пары" });
    const mileageInput = screen.getByRole("textbox", { name: "Лимит пробега, км" });

    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect((nameInput as HTMLInputElement).required).toBe(true);
    expect(mileageInput.getAttribute("aria-invalid")).toBe("true");
    expect(nameInput.getAttribute("aria-describedby")).toContain("shoe-create-name-error");
    expect(document.activeElement).toBe(nameInput);
  });

  it("ShoeCreateForm не переносит фокус при исправлении ошибки соседнего поля", () => {
    const props = {
      form,
      saving: false,
      notificationAvailability: availableNotifications,
      onChange: vi.fn(),
      onSubmit: vi.fn(),
    };
    const { rerender } = render(
      <ShoeCreateForm
        {...props}
        errors={{
          name: "Введите название.",
          mileageLimitKm: "Проверьте лимит.",
        }}
        validationAttempt={1}
      />
    );

    const nameInput = screen.getByRole("textbox", { name: "Название пары" });
    const mileageInput = screen.getByRole("textbox", { name: "Лимит пробега, км" });
    expect(document.activeElement).toBe(nameInput);

    rerender(
      <ShoeCreateForm
        {...props}
        errors={{ mileageLimitKm: "Проверьте лимит." }}
        validationAttempt={1}
      />
    );
    expect(document.activeElement).toBe(nameInput);

    rerender(
      <ShoeCreateForm
        {...props}
        errors={{ mileageLimitKm: "Проверьте лимит." }}
        validationAttempt={2}
      />
    );
    expect(document.activeElement).toBe(mileageInput);
  });
});
