export function isSameOriginRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
