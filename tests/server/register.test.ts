import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbTransactionMock, hashInviteTokenMock, bcryptHashMock } = vi.hoisted(() => {
  return {
    dbTransactionMock: vi.fn(),
    hashInviteTokenMock: vi.fn(),
    bcryptHashMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      transaction: dbTransactionMock,
    },
  };
});

vi.mock("@/server/registrationInvites", () => {
  return {
    hashInviteToken: hashInviteTokenMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      hash: bcryptHashMock,
    },
  };
});

import { RegisterError, registerUserWithInvite } from "@/server/register";

type CreateTxOptions = {
  inviteRows?: Array<{
    id: number;
    role: string;
    usedAt: Date | null;
    usedByUserId: number | null;
    expiresAt: Date;
  }>;
  existingUserRows?: Array<{ id: number }>;
  createdUserRows?: Array<{ id: number; email: string; name: string }>;
  updatedInviteRows?: Array<{ id: number }>;
};

function createTx(options: CreateTxOptions = {}) {
  const inviteRows = options.inviteRows ?? [
    {
      id: 10,
      role: "athlete",
      usedAt: null,
      usedByUserId: null,
      expiresAt: new Date(Date.now() + 60_000),
    },
  ];
  const existingUserRows = options.existingUserRows ?? [];
  const createdUserRows = options.createdUserRows ?? [
    {
      id: 55,
      email: "new@example.com",
      name: "Ivan",
    },
  ];
  const updatedInviteRows = options.updatedInviteRows ?? [{ id: 10 }];

  const inviteLimitMock = vi.fn().mockResolvedValue(inviteRows);
  const secondSelectWhereMock = vi.fn().mockResolvedValue(existingUserRows);
  const insertReturningMock = vi.fn().mockResolvedValue(createdUserRows);
  const updateReturningMock = vi.fn().mockResolvedValue(updatedInviteRows);

  let selectCallCount = 0;
  const selectMock = vi.fn(() => {
    const currentCall = selectCallCount;
    selectCallCount += 1;

    const builder: any = {};
    builder.from = vi.fn(() => builder);
    builder.where = vi.fn(() => {
      if (currentCall === 0) {
        return {
          limit: inviteLimitMock,
        };
      }
      return secondSelectWhereMock();
    });

    return builder;
  });

  const insertValuesMock = vi.fn(() => {
    return {
      returning: insertReturningMock,
    };
  });

  const updateWhereMock = vi.fn(() => {
    return {
      returning: updateReturningMock,
    };
  });
  const updateSetMock = vi.fn(() => {
    return {
      where: updateWhereMock,
    };
  });

  const tx = {
    select: selectMock,
    insert: vi.fn(() => {
      return {
        values: insertValuesMock,
      };
    }),
    update: vi.fn(() => {
      return {
        set: updateSetMock,
      };
    }),
  };

  return {
    tx,
    insertValuesMock,
    updateSetMock,
  };
}

function createRegisterInput(overrides: Record<string, unknown> = {}) {
  return {
    login: "runner01",
    name: "Ivan",
    lastName: "Petrov",
    gender: "male" as const,
    email: "new@example.com",
    password: "password123",
    inviteToken: "invite-token-123",
    timezone: null,
    ...overrides,
  };
}

describe("server/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashInviteTokenMock.mockReturnValue("hashed-invite");
    bcryptHashMock.mockResolvedValue("hashed-password");
  });

  it("должен выбрасывать invite_invalid, когда инвайт не найден", async () => {
    const { tx } = createTx({ inviteRows: [] });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "invite_invalid",
    });
  });

  it("должен выбрасывать invite_used, когда инвайт уже использован", async () => {
    const { tx } = createTx({
      inviteRows: [
        {
          id: 10,
          role: "athlete",
          usedAt: new Date(),
          usedByUserId: null,
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],
    });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "invite_used",
    });
  });

  it("должен выбрасывать invite_expired, когда инвайт просрочен", async () => {
    const { tx } = createTx({
      inviteRows: [
        {
          id: 10,
          role: "athlete",
          usedAt: null,
          usedByUserId: null,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ],
    });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "invite_expired",
    });
  });

  it("должен выбрасывать user_exists, когда email или login уже заняты", async () => {
    const { tx } = createTx({
      existingUserRows: [{ id: 777 }],
    });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "user_exists",
    });
  });

  it("должен выбрасывать create_failed, когда вставка вернула пустой результат", async () => {
    const { tx } = createTx({
      createdUserRows: [],
    });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "create_failed",
    });
  });

  it("должен выбрасывать invite_used, когда обновление инвайта не удалось из-за гонки", async () => {
    const { tx } = createTx({
      updatedInviteRows: [],
    });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "invite_used",
    });
  });

  it("должен создавать пользователя и использовать инвайт с часовым поясом по умолчанию", async () => {
    const { tx, insertValuesMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    const result = await registerUserWithInvite(createRegisterInput({ timezone: null }));

    expect(result).toEqual({
      user: {
        id: 55,
        email: "new@example.com",
        name: "Ivan",
      },
    });
    expect(hashInviteTokenMock).toHaveBeenCalledWith("invite-token-123");
    expect(bcryptHashMock).toHaveBeenCalledWith("password123", 10);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: "Europe/Moscow",
        passwordHash: "hashed-password",
        role: "athlete",
      })
    );
  });

  it("должен сохранять явный часовой пояс из ввода", async () => {
    const { tx, insertValuesMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await registerUserWithInvite(
      createRegisterInput({
        timezone: "Europe/Berlin",
      })
    );
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: "Europe/Berlin",
      })
    );
  });

  it("должен предоставлять класс RegisterError для типизированной обработки", () => {
    const error = new RegisterError("invite_invalid");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("invite_invalid");
  });
});
