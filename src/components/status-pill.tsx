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
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        tone === "neutral" && "border-[#e8e2db] bg-white text-slate-600",
        tone === "warm" && "border-transparent bg-[#efe7df] text-[#7b654b]",
        tone === "alert" && "border-transparent bg-[rgba(216,167,167,0.22)] text-[#8b6565]",
        tone === "success" && "border-transparent bg-[rgba(123,170,141,0.18)] text-[#56735f]",
      )}
    >
      {children}
    </span>
  );
}
