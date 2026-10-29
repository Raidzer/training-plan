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
    isArchived: false,
    hasReports: false,
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
    archivingId: null,
    onStartEdit: vi.fn(),
    onChangeEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleArchive: vi.fn(),
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
      archivingId={null}
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
      onToggleArchive={vi.fn()}
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

  it("по умолчанию показывает только активные пары и количества обеих вкладок", () => {
    const archivedShoe = createShoe({ id: 2, name: "Old Trainer", isArchived: true });
    const onToggleArchive = vi.fn();
    renderList({
      items: [createShoe(), archivedShoe],
      onToggleArchive,
    });

    expect(screen.getByRole("tab", { name: "Активные (1)" }).getAttribute("aria-selected")).toBe(
      "true"
    );
    expect(screen.getByRole("tab", { name: "Архив (1)" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Daily Trainer" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Old Trainer" })).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Архив (1)" }));

    expect(screen.getByRole("heading", { name: "Old Trainer" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Daily Trainer" })).toBeNull();
    expect(screen.getByRole("button", { name: "Вернуть в ротацию" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Редактировать" })).toBeTruthy();
    expect(screen.getByText(/Уведомления приостановлены/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Вернуть в ротацию" }));
    expect(onToggleArchive).toHaveBeenCalledWith(archivedShoe);
  });

  it("объясняет сохранение истории и предлагает архив вместо удаления использованной пары", () => {
    const shoe = createShoe({ hasReports: true });
    const onToggleArchive = vi.fn();
    renderList({ items: [shoe], onToggleArchive });

    expect(screen.queryByRole("button", { name: "Удалить" })).toBeNull();
    expect(screen.getByText(/История тренировок сохраняется/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "В архив" }));
    expect(onToggleArchive).toHaveBeenCalledWith(shoe);
  });

  it("блокирует действия и вкладки на время архивирования", () => {
    renderList({ items: [createShoe()], archivingId: 1 });

    expect((screen.getByRole("button", { name: /В архив/ }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect(
      (screen.getByRole("button", { name: "Редактировать" }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(screen.getByRole("tab", { name: "Архив (0)" }).getAttribute("aria-disabled")).toBe(
      "true"
    );
  });

  it("объясняет назначение пустого архива", () => {
    renderList();
    fireEvent.click(screen.getByRole("tab", { name: "Архив (0)" }));

    expect(screen.getByRole("heading", { name: "Архив пока пуст" })).toBeTruthy();
    expect(screen.getByText(/Старые пары можно убрать из ротации/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Добавить первую пару" })).toBeNull();
  });

  it("переводит фокус на вкладку после переноса пары, сохраняя фокус при ошибке", () => {
    const shoe = createShoe();
    const { rerender, props } = renderList({ items: [shoe] });
    const archiveButton = screen.getByRole("button", { name: "В архив" });
    archiveButton.focus();

    rerender(<ShoeList {...props} archivingId={1} />);
    rerender(<ShoeList {...props} archivingId={null} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "В архив" }));

    rerender(<ShoeList {...props} archivingId={1} />);
    rerender(<ShoeList {...props} items={[{ ...shoe, isArchived: true }]} archivingId={null} />);
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Активные \(0\)$/ }));
    expect(screen.getByRole("tab", { name: "Архив (1)" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: shoe.name })).toBeNull();
  });

  it("возвращает фокус на редактирование после отмены", () => {
    render(<ShoeListFocusHarness shoe={createShoe()} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Название пары" }));

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Редактировать" }));
  });
});
