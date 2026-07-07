import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Generic bordered container — the `rounded-none border border-border bg-card p-4` shell reused across dashboard/tender/job-order cards. */
export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <div className={`rounded-none border border-border bg-card p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
