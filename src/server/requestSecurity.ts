const PUBLIC_ORIGIN_ENV_KEYS = ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"] as const;

function parseOrigin(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsedOrigin = parseOrigin(value);
  if (!parsedOrigin) {
    return null;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    return null;
  }

  return parsedOrigin.origin;
}

function readFirstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const firstValue = value.split(",")[0]?.trim();
  if (!firstValue) {
    return null;
  }

  return firstValue;
}

function addNormalizedOrigin(origins: Set<string>, value: string | null | undefined) {
  const normalizedOrigin = normalizeOrigin(value);
  if (!normalizedOrigin) {
    return;
  }

  origins.add(normalizedOrigin);
}

function addOriginList(origins: Set<string>, value: string | undefined) {
  if (!value) {
    return;
  }

  const originValues = value.split(",");
  for (const originValue of originValues) {
    addNormalizedOrigin(origins, originValue.trim());
  }
}

function getProtocolFromUrl(value: string): string | null {
  const parsedOrigin = parseOrigin(value);
  if (!parsedOrigin) {
    return null;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    return null;
  }

  return parsedOrigin.protocol.replace(":", "");
}

function getForwardedOrigin(req: Request): string | null {
  const forwardedHost = readFirstHeaderValue(req.headers.get("x-forwarded-host"));
  if (!forwardedHost) {
    return null;
  }

  const forwardedProto = readFirstHeaderValue(req.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto ?? getProtocolFromUrl(req.url);
  if (!protocol) {
    return null;
  }

  return `${protocol}://${forwardedHost}`;
}

function collectAllowedOrigins(req: Request): Set<string> {
  const origins = new Set<string>();

  addNormalizedOrigin(origins, req.url);
  addNormalizedOrigin(origins, getForwardedOrigin(req));
  addOriginList(origins, process.env.ALLOWED_ORIGINS);

  for (const key of PUBLIC_ORIGIN_ENV_KEYS) {
    addNormalizedOrigin(origins, process.env[key]);
  }

  return origins;
}

function normalizeHost(host: string, protocol: string): string | null {
  try {
    return new URL(`${protocol}//${host}`).host.toLowerCase();
  } catch {
    return null;
  }
}

function hasMatchingRequestHost(req: Request, originUrl: URL): boolean {
  const requestHosts = [
    readFirstHeaderValue(req.headers.get("x-forwarded-host")),
    readFirstHeaderValue(req.headers.get("host")),
  ];

  const originHost = originUrl.host.toLowerCase();
  for (const requestHost of requestHosts) {
    if (!requestHost) {
      continue;
    }

    const normalizedHost = normalizeHost(requestHost, originUrl.protocol);
    if (normalizedHost === originHost) {
      return true;
    }
  }

  return false;
}

export function isSameOriginRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) {
    return true;
  }

  const originUrl = parseOrigin(origin);
  if (!originUrl) {
    return false;
  }

  const allowedOrigins = collectAllowedOrigins(req);
  if (allowedOrigins.has(originUrl.origin)) {
    return true;
  }

  return hasMatchingRequestHost(req, originUrl);
}
