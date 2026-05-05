import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { SITE_COPY } from "@/lib/copy";
import {
  getAuthModeConfig,
  type GoogleAuthStartIssueCode,
  getServerAuthSession,
} from "@/lib/auth";

function getAuthErrorMessage(
  error?: string | string[] | undefined,
  authError?: string | string[] | undefined,
) {
  const normalizedAuthError = Array.isArray(authError) ? authError[0] : authError;
  const normalizedError = Array.isArray(error) ? error[0] : error;

  const authIssueMessages: Record<GoogleAuthStartIssueCode, string> = {
    google_provider_unconfigured:
      "Google sign-in is not configured for this deployment yet. Add the production Google OAuth credentials and redeploy.",
    nextauth_secret_missing:
      "Authentication is missing its production secret. Add NEXTAUTH_SECRET in Vercel and redeploy.",
    database_url_missing:
      "Authentication cannot start because the production database URL is missing.",
    nextauth_url_missing:
      "Authentication is missing NEXTAUTH_URL for this deployment.",
    nextauth_url_mismatch:
      "NEXTAUTH_URL does not match this deployed domain. Update it to this exact site URL and redeploy.",
  };

  if (normalizedAuthError && normalizedAuthError in authIssueMessages) {
    return authIssueMessages[normalizedAuthError as GoogleAuthStartIssueCode];
  }

  if (!normalizedError) {
    return null;
  }

  switch (normalizedError) {
    case "Configuration":
      return "Authentication is not configured correctly for this deployment. Check NEXTAUTH_URL, NEXTAUTH_SECRET, Google OAuth credentials, and the production DATABASE_URL.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "Callback":
      return "Google sign-in could not complete. Check the deployed callback URL and Google OAuth redirect URI, then try again.";
    case "AccessDenied":
      return "Google sign-in was denied before Headroom could finish the connection.";
    default:
      return "Google sign-in could not start. Check the deployment auth configuration and try again.";
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerAuthSession();
  const authMode = getAuthModeConfig();
  const resolvedSearchParams = (await searchParams) ?? {};
  const authErrorMessage = getAuthErrorMessage(
    resolvedSearchParams.error,
    resolvedSearchParams.authError,
  );

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="theme-page-wash pointer-events-none absolute inset-0" />
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-10 lg:px-10">
        <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen border-b border-[rgba(0,0,0,0.06)] bg-[#C8C1CC]">
          <header className="mx-auto w-full max-w-7xl px-6 py-5 text-[#1F2933] lg:px-10">
            <div className="flex items-center justify-between">
              <p className="translate-y-[1px] text-[21px] font-semibold uppercase tracking-[0.22em] text-[#2A2F36]">
                Headroom
              </p>
              <AuthButton
                mode="signin"
                provider="google"
                variant="secondary"
                label="Sign in"
                href="/auth/google/start"
                className="text-[#3A424C]"
              />
            </div>
          </header>
        </div>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight text-[#202B35]">
                {SITE_COPY.landing.COPY_LANDING_HERO_HEADLINE_01}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#5F6975]">
                {SITE_COPY.landing.COPY_LANDING_HERO_BODY_01}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-[#8A919A]">
                Built around established patterns in cognitive load, task switching, and recovery.
              </p>
            </div>
            {authErrorMessage ? (
              <div className="max-w-2xl rounded-[20px] border border-[rgba(138,102,48,0.18)] bg-[rgba(246,234,207,0.8)] px-4 py-3 text-sm leading-6 text-[rgba(82,62,28,0.92)]">
                {authErrorMessage}
              </div>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row">
              {authMode.effectiveProvider === "google" ? (
                <AuthButton
                  mode="signin"
                  provider="google"
                  label={authMode.ctaLabel}
                  href="/auth/google/start"
                  className="px-6 py-3.5 text-base"
                />
              ) : (
                <AuthButton
                  mode="signin"
                  provider="assessment"
                  label="Start your profile"
                  href={authMode.ctaHref}
                  className="px-6 py-3.5 text-base"
                />
              )}
            </div>
          </div>

          <div className="rounded-[36px] border border-[rgba(46,62,76,0.18)] bg-[#243241] p-6 text-white shadow-[0_18px_40px_rgba(31,41,51,0.07)]">
            <div className="grid gap-4">
              <div className="rounded-[28px] bg-white/7 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8B3BF]">
                      {SITE_COPY.landing.COPY_LANDING_REPORT_EYEBROW_01}
                    </p>
                    <h2 className="mt-2 max-w-[18rem] font-serif text-[2rem] leading-[1.02] text-[#F4F7FA]">
                      {SITE_COPY.landing.COPY_LANDING_REPORT_HEADLINE_01}
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#3A4756] px-3 py-2 text-sm text-[#E5E7EB]">
                    {SITE_COPY.landing.COPY_LANDING_REPORT_BADGE_01}
                  </div>
                </div>
                <div className="mt-6 grid gap-2.5 text-sm text-slate-300">
                  {SITE_COPY.landing.COPY_LANDING_REPORT_METRICS.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                    >
                      <span>{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[18px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-[18px] py-4">
                  <p className="max-w-[24rem] text-[15px] leading-6 text-[rgba(228,235,242,0.92)]">
                    For a protected-block profile, move your most demanding work to earlier in the week when uninterrupted time is still available, and avoid relying on fragmented late-week windows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-5">
            <p className="max-w-3xl font-serif text-3xl leading-tight text-[#202B35] sm:text-[2rem]">
              {SITE_COPY.landing.COPY_LANDING_FEATURES_HEADLINE_01}
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {SITE_COPY.landing.COPY_LANDING_FEATURES.map(({ title, body }, index) => (
              <article
                key={title}
                className="theme-accent-card rounded-[28px] border p-6 shadow-[0_10px_24px_rgba(31,41,51,0.05)]"
              >
                <p className="mb-4 text-sm font-semibold text-[var(--color-accent-strong)]">
                  0{index + 1}
                </p>
                <h2 className="font-serif text-2xl text-[#202B35]">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5F6975]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-[960px] rounded-[28px] border border-[#C8BAC2] bg-[#D8CDD3] px-8 py-7 shadow-[0_10px_24px_rgba(31,41,51,0.05)]">
            <div className="mx-auto max-w-4xl text-center">
              <p className="mx-auto text-xl font-medium leading-tight text-[#263241]">
                Headroom reads your week through four signals:
              </p>
            </div>
            <div className="mt-5 flex justify-center">
              <div className="flex w-full items-center justify-center gap-4 xl:flex-nowrap">
                {SITE_COPY.landing.COPY_LANDING_INPUT_LABELS.map((label) => (
                  <div
                    key={label}
                    className="rounded-[22px] border border-[#C9BBC3] bg-[#F7F3F0] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-[#263241]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
