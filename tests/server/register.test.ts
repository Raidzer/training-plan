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

  it("should throw invite_invalid when invite was not found", async () => {
    const { tx } = createTx({ inviteRows: [] });
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await expect(registerUserWithInvite(createRegisterInput())).rejects.toMatchObject({
      code: "invite_invalid",
    });
  });

  it("should throw invite_used when invite is already used", async () => {
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

  it("should throw invite_expired when invite has expired", async () => {
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

  it("should throw user_exists when email or login is already in use", async () => {
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

  it("should throw create_failed when insert returned empty result", async () => {
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

  it("should throw invite_used when invite update race happened", async () => {
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

  it("should create user and consume invite with default timezone", async () => {
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

    const insertPayload = insertValuesMock.mock.calls[0][0] as {
      timezone: string;
      passwordHash: string;
      role: string;
    };
    expect(insertPayload.timezone).toBe("Europe/Moscow");
    expect(insertPayload.passwordHash).toBe("hashed-password");
    expect(insertPayload.role).toBe("athlete");
  });

  it("should preserve explicit timezone from input", async () => {
    const { tx, insertValuesMock } = createTx();
    dbTransactionMock.mockImplementation(async (callback: (innerTx: unknown) => unknown) => {
      return await callback(tx);
    });

    await registerUserWithInvite(
      createRegisterInput({
        timezone: "Europe/Berlin",
      })
    );

    const insertPayload = insertValuesMock.mock.calls[0][0] as {
      timezone: string;
    };
    expect(insertPayload.timezone).toBe("Europe/Berlin");
  });

  it("should expose RegisterError class for typed handling", () => {
    const error = new RegisterError("invite_invalid");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("invite_invalid");
  });
});
