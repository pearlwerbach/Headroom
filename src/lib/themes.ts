export type AppTheme = "deep-indigo" | "warm-amber" | "soft-green";

export const DEFAULT_THEME: AppTheme = "deep-indigo";
export const THEME_STORAGE_KEY = "headroom-theme";
export const LEGACY_THEME_STORAGE_KEY = "lilt-theme";

export const APP_THEMES: Array<{
  id: AppTheme;
  label: string;
  swatch: string;
}> = [
  { id: "deep-indigo", label: "Deep Indigo", swatch: "#56638f" },
  { id: "warm-amber", label: "Warm Amber", swatch: "#a27a54" },
  { id: "soft-green", label: "Soft Green", swatch: "#6b8875" },
];
