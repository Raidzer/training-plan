import { expect } from "vitest";
import { readJsonResponse } from "./http";

export async function expectJsonError(
  response: Response,
  status: number,
  error: string
): Promise<void> {
  expect(response.status).toBe(status);
  const payload = await readJsonResponse<{ error?: string }>(response);
  expect(payload.error).toBe(error);
}

export async function expectJsonSuccess<T>(response: Response, expectedStatus = 200): Promise<T> {
  expect(response.status).toBe(expectedStatus);
  const payload = await readJsonResponse<T>(response);
  return payload;
}

export function expectRedirectTo(response: Response, expectedPath: string): void {
  const location = response.headers.get("location");
  expect(location).toBeTruthy();

  if (!location) {
    return;
  }

  const redirectUrl = new URL(location);
  expect(redirectUrl.pathname + redirectUrl.search).toBe(expectedPath);
}
