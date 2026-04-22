import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider, ThemeSwitcher } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HEADROOM | Calendar-Aware Cognitive Load Planner",
  description: "Plan around the kind of time and energy your week actually has.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var theme = localStorage.getItem('headroom-theme') || localStorage.getItem('lilt-theme') || 'deep-indigo';
              document.documentElement.dataset.theme = theme;
            } catch (error) {
              document.documentElement.dataset.theme = 'deep-indigo';
            }
          })();
        `}</Script>
        <ThemeProvider>
          <ThemeSwitcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
