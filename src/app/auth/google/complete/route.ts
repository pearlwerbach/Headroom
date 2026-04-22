import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import {
  GOOGLE_ACCOUNT_LINK_COOKIE,
  migrateLinkedProfileToUser,
  parseGoogleAccountLinkPayload,
} from "@/lib/google-account-link";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const cookieStore = await cookies();
  const linkPayload = parseGoogleAccountLinkPayload(
    cookieStore.get(GOOGLE_ACCOUNT_LINK_COOKIE)?.value,
  );

  if (session?.user?.id && linkPayload) {
    await migrateLinkedProfileToUser(linkPayload.sourceUserId, session.user.id);
  }

  cookieStore.delete(GOOGLE_ACCOUNT_LINK_COOKIE);

  return NextResponse.redirect(new URL("/settings?googleLinked=1", request.url));
}
