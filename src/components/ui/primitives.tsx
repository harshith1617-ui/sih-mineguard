import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Technical corner-bracket frame used on HUD panels. */
export function Corners({ className, tone = "default" }: { className?: string; tone?: "default" | "bright" }) {
  const c =
    tone === "bright" ? "border-line-bright" : "border-fog-600/60";
  const base = "pointer-events-none absolute h-3 w-3";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span className={cn(base, "left-0 top-0 border-l border-t", c)} />
      <span className={cn(base, "right-0 top-0 border-r border-t", c)} />
      <span className={cn(base, "bottom-0 left-0 border-b border-l", c)} />
      <span className={cn(base, "bottom-0 right-0 border-b border-r", c)} />
    </div>
  );
}

export function Panel({
  children,
  className,
  corners = false,
}: {
  children: ReactNode;
  className?: string;
  corners?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-line bg-ink-850/90 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      {corners && <Corners />}
      {children}
    </div>
  );
}

export function PanelHeader({
  icon,
  title,
  right,
  tone,
}: {
  icon?: ReactNode;
  title: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        {icon && <span className={cn("text-fog-500", tone)}>{icon}</span>}
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-fog-300">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function StatusDot({ tone, pulse = false }: { tone: "ok" | "warn" | "danger" | "idle"; pulse?: boolean }) {
  const map = {
    ok: "bg-ok-400",
    warn: "bg-warn-400",
    danger: "bg-danger-400",
    idle: "bg-fog-600",
  } as const;
  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 ping-slow", map[tone])} />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", map[tone])} />
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-line-bright bg-ink-800 text-fog-500">
        {icon}
      </div>
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-fog-200">{title}</p>
        {hint && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-fog-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
