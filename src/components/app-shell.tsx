"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { AuthButton } from "@/components/auth-button";
import { SITE_COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

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
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  heading,
  userName,
  headerAction,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="theme-shell-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="border-b border-[rgba(31,41,51,0.08)] bg-transparent px-1 py-6 sm:py-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5 xl:min-w-0 xl:flex-1 xl:flex-row xl:items-end xl:gap-10">
              <div className="min-w-0 space-y-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-strong)]">
                  {APP_NAME}
                </p>
                <h1 className="font-serif text-[2rem] font-medium leading-tight text-slate-900 sm:text-[2.2rem]">
                  {heading}
                </h1>
              </div>

              <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-0.5 xl:justify-center">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/onboarding"
                      ? pathname === "/onboarding" || pathname === "/onboarding/analyzing"
                      : pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "border-b border-transparent pb-1 text-[14px] font-medium tracking-[0.01em] text-slate-500 transition hover:text-slate-800",
                        isActive && "border-[#2c2a3a]/42 text-slate-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between xl:justify-end xl:gap-5">
              <div className="text-left sm:text-right">
                <p className="text-sm font-medium text-slate-800">
                  {userName ?? SITE_COPY.shared.COPY_SHARED_FALLBACK_USERNAME_01}
                </p>
                <p className="text-xs tracking-[0.01em] text-slate-500">
                  {SITE_COPY.shared.COPY_SHARED_SIGNED_IN_01}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {headerAction}
                <AuthButton
                  mode="signout"
                  className="border-[#d9d3c9] bg-transparent px-4 py-2.5 text-slate-700 shadow-none hover:bg-white/70 hover:text-slate-900"
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
