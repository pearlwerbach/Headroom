import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  eyebrow,
  description,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur",
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-2">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="font-serif text-2xl leading-tight text-slate-900">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
