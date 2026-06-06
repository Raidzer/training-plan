import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbInsertMock, dbUpdateMock } = vi.hoisted(() => {
  return {
    dbInsertMock: vi.fn(),
    dbUpdateMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      insert: dbInsertMock,
      update: dbUpdateMock,
    },
  };
});

import { createShoe, updateShoe } from "@/server/shoes";

describe("server/shoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createShoe должен сохранять пробег строками и флаги уведомлений", async () => {
    const returningMock = vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Pegasus",
        mileageLimitKm: "600.25",
        currentMileageKm: "120.5",
        notifyOnLimitEmail: true,
        notifyOnLimitTelegram: false,
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        updatedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ]);
    const valuesMock = vi.fn(() => ({
      returning: returningMock,
    }));
    dbInsertMock.mockReturnValue({
      values: valuesMock,
    });

    const created = await createShoe({
      userId: 7,
      name: "Pegasus",
      mileageLimitKm: 600.25,
      currentMileageKm: 120.5,
      notifyOnLimitEmail: true,
    });

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        name: "Pegasus",
        mileageLimitKm: "600.25",
        currentMileageKm: "120.5",
        notifyOnLimitEmail: true,
        notifyOnLimitTelegram: false,
      })
    );
    expect(created?.mileageLimitKm).toBe("600.25");
  });

  it("updateShoe должен частично обновлять и очищать nullable пробег", async () => {
    const returningMock = vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Pegasus",
        mileageLimitKm: null,
        currentMileageKm: "200",
        notifyOnLimitEmail: false,
        notifyOnLimitTelegram: true,
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        updatedAt: new Date("2026-01-02T10:00:00.000Z"),
      },
    ]);
    const whereMock = vi.fn(() => ({
      returning: returningMock,
    }));
    const setMock = vi.fn(() => ({
      where: whereMock,
    }));
    dbUpdateMock.mockReturnValue({
      set: setMock,
    });

    const updated = await updateShoe({
      userId: 7,
      shoeId: 1,
      mileageLimitKm: null,
      currentMileageKm: 200,
      notifyOnLimitTelegram: true,
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mileageLimitKm: null,
        currentMileageKm: "200",
        notifyOnLimitTelegram: true,
      })
    );
    expect(updated?.currentMileageKm).toBe("200");
  });
});
