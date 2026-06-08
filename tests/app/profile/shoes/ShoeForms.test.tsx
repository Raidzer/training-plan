import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShoeCreateForm } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoeCreateForm/ShoeCreateForm";
import { ShoeEditForm } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoeEditForm/ShoeEditForm";
import type { ShoeFormState } from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";

const form: ShoeFormState = {
  name: "Pegasus",
  mileageLimitKm: "800",
  notifyOnLimitEmail: true,
  notifyOnLimitTelegram: false,
};

describe("Shoe forms", () => {
  it("ShoeCreateForm отправляет изменения полей и submit", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(<ShoeCreateForm form={form} saving={false} onChange={onChange} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByDisplayValue("Pegasus"), { target: { value: "Boston" } });
    fireEvent.change(screen.getByDisplayValue("800"), { target: { value: "600" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Telegram" }));
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

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
});
