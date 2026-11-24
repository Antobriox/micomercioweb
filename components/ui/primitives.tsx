import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<"button"> & {
  tone?: "primary" | "secondary" | "danger";
  size?: "normal" | "large";
  loadingLabel?: string;
};

export function Button({
  tone = "primary", size = "normal", loadingLabel, type = "button", disabled, children, className = "", ...props
}: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || !!loadingLabel} aria-busy={loadingLabel ? true : undefined}
      className={`ui-action ${className}`} data-tone={tone} data-size={size}>
      {loadingLabel ?? children}
    </button>
  );
}

export function TextLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={`ui-link ${className}`} />;
}

type FieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ id, label, hint, error, className = "", "aria-describedby": customDescription, ...props }: FieldProps) {
  const descriptions = [customDescription, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}{props.required && <span className="ms-1 text-sm font-normal text-muted">(obligatorio)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mb-1.5 text-sm text-muted">{hint}</p>}
      <input {...props} id={id} aria-invalid={error ? true : undefined}
        aria-describedby={descriptions || undefined} className={`ui-field ${className}`} />
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-accent">{error}</p>}
    </div>
  );
}

const notices = {
  info: { Icon: Info, color: "bg-canvas text-brand" },
  success: { Icon: CheckCircle2, color: "bg-success-surface text-success" },
  warning: { Icon: TriangleAlert, color: "bg-warning-surface text-warning" },
  error: { Icon: AlertCircle, color: "bg-error-surface text-accent" },
} as const;

export function Notice({ tone = "info", children, announce = false }: {
  tone?: keyof typeof notices; children: ReactNode; announce?: boolean;
}) {
  const { Icon, color } = notices[tone];
  return (
    <div className={`flex items-start gap-3 rounded-xl p-4 ${color}`}
      role={announce ? (tone === "error" ? "alert" : "status") : undefined}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-7 ${className}`}>{children}</div>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <Card><h2 className="text-xl font-bold">{title}</h2><div className="mt-2 text-muted">{children}</div></Card>;
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-2">
      <span className="font-semibold text-muted">{label}</span>
      <div className="ui-skeleton" aria-hidden="true" />
    </div>
  );
}
