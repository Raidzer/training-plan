import { afterEach, describe, expect, it, vi } from "vitest";
import { isSameOriginRequest } from "@/server/requestSecurity";

function createPatchRequest(headers?: HeadersInit) {
  const requestInit: RequestInit = {
    method: "PATCH",
  };

  if (headers) {
    requestInit.headers = headers;
  }

  return new Request("http://internal-app:3000/api/setDataUser", requestInit);
}

describe("requestSecurity", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("разрешает запрос без Origin", () => {
    const request = createPatchRequest();

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("разрешает запрос с Origin из req.url", () => {
    const request = new Request("https://swarm-protocol.ru/api/setDataUser", {
      method: "PATCH",
      headers: {
        Origin: "https://swarm-protocol.ru",
      },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("разрешает production Origin из ALLOWED_ORIGINS при внутреннем req.url", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://swarm-protocol.ru");

    const request = createPatchRequest({
      Origin: "https://swarm-protocol.ru",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("разрешает production Origin из proxy-заголовков при внутреннем req.url", () => {
    const request = createPatchRequest({
      Origin: "https://swarm-protocol.ru",
      "x-forwarded-host": "swarm-protocol.ru",
      "x-forwarded-proto": "https",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("разрешает production Origin из NEXTAUTH_URL при внутреннем req.url", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://swarm-protocol.ru");

    const request = createPatchRequest({
      Origin: "https://swarm-protocol.ru",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("запрещает чужой Origin", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://swarm-protocol.ru");

    const request = createPatchRequest({
      Origin: "https://evil.test",
      "x-forwarded-host": "swarm-protocol.ru",
      "x-forwarded-proto": "https",
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
