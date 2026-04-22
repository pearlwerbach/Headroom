import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warm" | "alert" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "warm" && "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
        tone === "alert" && "bg-rose-100 text-rose-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
      )}
    >
      {children}
    </span>
  );
}
