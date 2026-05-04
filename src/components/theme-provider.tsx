"use client";

import { useEffect } from "react";
import {
  DEFAULT_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("theme-ready");
    document.documentElement.dataset.theme = DEFAULT_THEME;
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }, []);

  return <>{children}</>;
}
