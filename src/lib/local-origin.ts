function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getConfiguredLocalOriginRedirect(
  headersList: Headers,
  pathnameWithSearch: string,
) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const configuredUrl = process.env.NEXTAUTH_URL;

  if (!configuredUrl) {
    return null;
  }

  let configuredOrigin: URL;

  try {
    configuredOrigin = new URL(configuredUrl);
  } catch {
    return null;
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return null;
  }

  const requestOrigin = `${proto}://${host}`;
  const requestUrl = new URL(pathnameWithSearch, requestOrigin);

  if (
    isLoopbackHost(requestUrl.hostname) &&
    isLoopbackHost(configuredOrigin.hostname) &&
    requestUrl.origin !== configuredOrigin.origin
  ) {
    const redirectUrl = new URL(pathnameWithSearch, configuredOrigin.origin).toString();

    console.warn("[auth-debug] page-level local origin redirect", {
      from: requestUrl.toString(),
      to: redirectUrl,
    });

    return redirectUrl;
  }

  return null;
}
