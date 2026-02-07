export type SessionUserFixture = {
  id: string;
  email: string;
  role: string;
  emailVerified: Date | null;
  [key: string]: unknown;
};

export type SessionFixture = {
  user: SessionUserFixture;
};

const DEFAULT_SESSION_USER: SessionUserFixture = {
  id: "1",
  email: "user@example.com",
  role: "user",
  emailVerified: null,
};

export function createSession(overrides: Partial<SessionUserFixture> = {}): SessionFixture {
  return {
    user: {
      ...DEFAULT_SESSION_USER,
      ...overrides,
    },
  };
}

export function createAdminSession(overrides: Partial<SessionUserFixture> = {}): SessionFixture {
  return createSession({
    role: "admin",
    ...overrides,
  });
}

export function createAnonymousSession(): null {
  return null;
}
