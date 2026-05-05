import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.next();
  }

  const configuredUrl = process.env.NEXTAUTH_URL;

  if (!configuredUrl) {
    return NextResponse.next();
  }

  let configuredOrigin: URL;

  try {
    configuredOrigin = new URL(configuredUrl);
  } catch {
    return NextResponse.next();
  }

  const requestUrl = request.nextUrl;
  const requestOrigin = requestUrl.origin;

  if (
    isLoopbackHost(requestUrl.hostname) &&
    isLoopbackHost(configuredOrigin.hostname) &&
    requestOrigin !== configuredOrigin.origin
  ) {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = configuredOrigin.protocol;
    redirectUrl.hostname = configuredOrigin.hostname;
    redirectUrl.port = configuredOrigin.port;

    console.warn("[auth-debug] middleware redirecting local origin to NEXTAUTH_URL", {
      from: requestOrigin,
      to: redirectUrl.origin,
      pathname: requestUrl.pathname,
      search: requestUrl.search,
    });

    return NextResponse.redirect(redirectUrl);
  }

  if (requestUrl.pathname.startsWith("/onboarding")) {
    console.info("[auth-debug] middleware pass-through", {
      origin: requestOrigin,
      pathname: requestUrl.pathname,
      search: requestUrl.search,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
