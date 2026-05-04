import { NextResponse } from "next/server";
import { getAuthEnvironmentDiagnostics, getGoogleAuthStartIssue } from "@/lib/auth";

export async function GET(request: Request) {
  const issue = getGoogleAuthStartIssue({ requestUrl: request.url });
  const diagnostics = getAuthEnvironmentDiagnostics({ requestUrl: request.url });

  if (issue) {
    console.error("Google auth start blocked", {
      issue,
      requestUrl: request.url,
      ...diagnostics,
    });

    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("authError", issue);
    return NextResponse.redirect(homeUrl);
  }

  const signInUrl = new URL("/api/auth/signin/google", request.url);
  signInUrl.searchParams.set("callbackUrl", new URL("/dashboard", request.url).toString());

  console.info("Google auth start allowed", {
    requestUrl: request.url,
    redirectTo: signInUrl.toString(),
    ...diagnostics,
  });

  return NextResponse.redirect(signInUrl);
}
