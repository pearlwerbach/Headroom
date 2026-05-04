import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { AuthButton } from "@/components/auth-button";
import { SITE_COPY } from "@/lib/copy";

const navItems = [
  { href: "/dashboard", label: SITE_COPY.shared.COPY_SHARED_NAV_DASHBOARD_01 },
  { href: "/history", label: SITE_COPY.shared.COPY_SHARED_NAV_HISTORY_01 },
  { href: "/onboarding", label: SITE_COPY.shared.COPY_SHARED_NAV_PROFILE_01 },
  { href: "/settings", label: SITE_COPY.shared.COPY_SHARED_NAV_SETTINGS_01 },
];

interface AppShellProps {
  heading: string;
  userName?: string | null;
  variant?: "default" | "profileReport";
  children: React.ReactNode;
}

export function AppShell({
  heading,
  userName,
  variant = "default",
  children,
}: AppShellProps) {
  const usesEditorialHeader = variant === "profileReport" || variant === "default";
  const headerClassName = usesEditorialHeader
    ? "rounded-[32px] border border-[#e8e2db] bg-white px-6 py-4 text-slate-900 shadow-[var(--surface-shadow)] backdrop-blur"
    : "rounded-[32px] border border-white/50 bg-slate-950 px-6 py-5 text-white shadow-[0_32px_80px_-48px_rgba(15,23,42,0.75)]";

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="theme-shell-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className={headerClassName}>
          <div
            className={
              usesEditorialHeader
                ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                : "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
            }
          >
            <div className={usesEditorialHeader ? "space-y-3" : "space-y-4"}>
              <div className="flex flex-wrap items-center gap-3">
                <p
                  className={
                    usesEditorialHeader
                      ? "text-sm font-semibold uppercase tracking-[0.22em] text-slate-700 sm:text-base"
                      : "theme-accent-text text-sm font-semibold uppercase tracking-[0.22em] sm:text-base"
                  }
                >
                  {APP_NAME}
                </p>
              </div>
              <div
                className={
                  usesEditorialHeader
                    ? "flex flex-col gap-3 lg:flex-row lg:items-baseline lg:gap-6"
                    : "space-y-4"
                }
              >
                <div>
                  <h1
                    className={
                      usesEditorialHeader
                        ? "font-serif text-3xl leading-tight text-slate-900"
                        : "font-serif text-4xl leading-tight text-white"
                    }
                  >
                    {heading}
                  </h1>
                </div>
                <nav
                  className={
                    usesEditorialHeader
                      ? "flex flex-wrap items-center gap-x-4 gap-y-2"
                      : "flex flex-wrap items-center gap-2"
                  }
                >
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        usesEditorialHeader
                          ? "text-sm text-slate-600 transition hover:text-[#2c2a3a]"
                          : "rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12 hover:text-white"
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={usesEditorialHeader ? "text-sm text-slate-900" : "text-sm text-slate-100"}>
                    {userName ?? SITE_COPY.shared.COPY_SHARED_FALLBACK_USERNAME_01}
                  </p>
                  <p className={usesEditorialHeader ? "text-xs text-slate-500" : "text-xs text-slate-400"}>
                    {SITE_COPY.shared.COPY_SHARED_SIGNED_IN_01}
                  </p>
                </div>
                <AuthButton
                  mode="signout"
                  className={usesEditorialHeader ? "bg-[#2c2a3a] text-white" : "bg-white text-slate-900"}
                />
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
