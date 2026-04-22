"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  APP_THEMES,
  DEFAULT_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof document === "undefined") {
      return DEFAULT_THEME;
    }

    return (document.documentElement.dataset.theme as AppTheme | undefined) ?? DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.classList.add("theme-ready");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed right-4 top-4 z-40 rounded-full border border-white/55 bg-white/68 px-2.5 py-2 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.32)] backdrop-blur sm:right-6 sm:top-6">
      <div className="flex items-center gap-2">
        {APP_THEMES.map((option) => {
          const active = theme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-label={option.label}
              title={option.label}
              className="relative h-6 w-6 rounded-full transition-transform hover:scale-105"
              style={{
                backgroundColor: option.swatch,
                boxShadow: active
                  ? "0 0 0 2px rgba(255,255,255,0.9), 0 0 0 3px var(--color-accent-shadow)"
                  : "0 6px 16px -12px rgba(15,23,42,0.35)",
              }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: active ? "1px solid rgba(255,255,255,0.82)" : "1px solid rgba(255,255,255,0.24)",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
