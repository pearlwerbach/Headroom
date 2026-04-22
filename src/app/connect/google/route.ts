import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isGoogleOAuthConfigured } from "@/lib/auth";
import {
  GOOGLE_ACCOUNT_LINK_COOKIE,
  serializeGoogleAccountLinkPayload,
} from "@/lib/google-account-link";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/settings?calendar=reconnect", request.url));
  }

  const user = await requireUser();
  const cookieStore = await cookies();

  cookieStore.set(
    GOOGLE_ACCOUNT_LINK_COOKIE,
    serializeGoogleAccountLinkPayload(user.id),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return NextResponse.redirect(new URL("/connect/google/start", request.url));
}
