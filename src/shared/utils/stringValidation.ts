import { z } from "zod";

// Сохраняем UTF-16-лимиты существующих паролей и форм после обновления Zod.
export function minStringLength(minimum: number, error?: string) {
  return z.refine<string>((value) => value.length >= minimum, { error });
}

export function maxStringLength(maximum: number, error?: string) {
  return z.refine<string>((value) => value.length <= maximum, { error });
}
