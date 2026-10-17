import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" && "bg-[var(--gold)] text-[var(--ink)] hover:brightness-110",
        variant === "secondary" && "border border-white/20 bg-white/5 text-white hover:bg-white/10",
        variant === "ghost" && "text-white/80 hover:bg-white/5 hover:text-white",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--gold)] placeholder:text-white/35 focus:ring-1",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--gold)] placeholder:text-white/35 focus:ring-1",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--gold)] focus:ring-1",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/55">
      {children}
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "success" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-white/10 text-white/80",
        tone === "gold" && "bg-[var(--gold)]/20 text-[var(--gold)]",
        tone === "success" && "bg-emerald-500/15 text-emerald-300",
        tone === "warn" && "bg-amber-500/15 text-amber-300",
        tone === "danger" && "bg-red-500/15 text-red-300",
      )}
    >
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-[var(--panel)]", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function statusTone(status: string) {
  if (status === "DELIVERED" || status === "ACCEPTED") return "success" as const;
  if (status === "ON_HOLD" || status === "REVISION_REQUESTED") return "warn" as const;
  if (status === "CANCELLED" || status === "REJECTED") return "danger" as const;
  if (status === "IN_TRANSIT" || status === "SENT") return "gold" as const;
  return "neutral" as const;
}
