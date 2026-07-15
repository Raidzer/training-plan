export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function getInternalAuthRedirect(
  redirectUrl: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
): string {
  if (!redirectUrl) {
    return fallback;
  }

  try {
    const parsedUrl = new URL(redirectUrl, "http://localhost");
    const pathname = parsedUrl.pathname;

    if (!pathname.startsWith("/") || pathname.startsWith("//")) {
      return fallback;
    }

    return `${pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallback;
  }
}
