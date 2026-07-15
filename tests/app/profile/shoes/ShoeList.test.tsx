import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ShoeList } from "@/app/(protected)/profile/shoes/ShoesClient/components/ShoeList/ShoeList";
import type {
  ShoeFormState,
  ShoeItem,
  ShoeNotificationAvailability,
} from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";

const editingForm: ShoeFormState = {
  name: "",
  mileageLimitKm: "",
  notifyOnLimitEmail: false,
  notifyOnLimitTelegram: false,
};

const notificationAvailability: ShoeNotificationAvailability = {
  emailAvailable: true,
  emailReady: true,
  telegramAvailable: true,
  telegramReady: true,
};

function createShoe(overrides: Partial<ShoeItem> = {}): ShoeItem {
  return {
    id: 1,
    name: "Daily Trainer",
    mileageLimitKm: "800",
    currentMileageKm: "120",
    notifyOnLimitEmail: true,
    notifyOnLimitTelegram: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
    ...overrides,
  };
}

function renderList(overrides: Partial<ComponentProps<typeof ShoeList>> = {}) {
  const props: ComponentProps<typeof ShoeList> = {
    items: [],
    loading: false,
    loadError: false,
    addDisabled: false,
    saving: false,
    editingId: null,
    editingForm,
    editingFormErrors: {},
    editingValidationAttempt: 0,
    notificationAvailability,
    updatingId: null,
    deletingId: null,
    onStartEdit: vi.fn(),
    onChangeEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDelete: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<ShoeList {...props} />),
    props,
  };
}

function ShoeListFocusHarness({ shoe }: { shoe: ShoeItem }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ShoeList
      items={[shoe]}
      loading={false}
      loadError={false}
      addDisabled={false}
      saving={false}
      editingId={editingId}
      editingForm={{
        ...editingForm,
        name: shoe.name,
        mileageLimitKm: shoe.mileageLimitKm ?? "",
      }}
      editingFormErrors={{}}
      editingValidationAttempt={0}
      notificationAvailability={notificationAvailability}
      updatingId={null}
      deletingId={null}
      onStartEdit={(item) => {
        setEditingId(item.id);
      }}
      onChangeEdit={vi.fn()}
      onSaveEdit={() => {
        setEditingId(null);
      }}
      onCancelEdit={() => {
        setEditingId(null);
      }}
      onDelete={vi.fn()}
      onRetry={vi.fn()}
    />
  );
}

describe("ShoeList", () => {
  it("показывает доступное состояние загрузки", () => {
    renderList({ loading: true, addDisabled: true });

    expect(screen.getByRole("status").textContent).toContain("Загружаем обувь...");
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("link", { name: "Добавить пару" })).toBeNull();
    expect(screen.getByText("Добавить пару").closest('[aria-disabled="true"]')).toBeTruthy();
  });

  it("показывает полезное пустое состояние с переходом к форме", () => {
    renderList();

    expect(screen.getByRole("heading", { name: "Ротация пока пуста" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Добавить первую пару" }).getAttribute("href")).toBe(
      "#shoe-create-name"
    );
  });

  it("показывает ошибку загрузки и повторяет запрос", () => {
    const onRetry = vi.fn();
    renderList({ loadError: true, onRetry });

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("показывает ресурсную дорожку и действия пары", () => {
    const onStartEdit = vi.fn();
    const shoe = createShoe();
    renderList({ items: [shoe], onStartEdit });

    expect(screen.getByText("1 пара")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Daily Trainer: 120 км из 800 км" })
    ).toBeTruthy();
    expect(screen.getByText("До лимита: 680 км")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    expect(onStartEdit).toHaveBeenCalledWith(shoe);
  });

  it("не рендерит progress без заданного лимита", () => {
    renderList({ items: [createShoe({ mileageLimitKm: null })] });

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("Лимит пробега не задан")).toBeTruthy();
  });

  it("возвращает фокус на редактирование после отмены", () => {
    render(<ShoeListFocusHarness shoe={createShoe()} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Название пары" }));

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Редактировать" }));
  });
});
