import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { COLORS } from "../../styles/tokens.js";

export function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ backgroundColor: COLORS.line }} />;
}

export function SkeletonCards({ count = 4, className = "h-24" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${className} w-full rounded-2xl`} />
      ))}
    </>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: COLORS.primarySoft }}>
          <Icon className="w-6 h-6" style={{ color: COLORS.primary }} />
        </div>
      )}
      <h3 className="text-sm font-semibold" style={{ color: COLORS.ink }}>{title}</h3>
      {message && <p className="text-sm mt-1 max-w-sm" style={{ color: COLORS.slate }}>{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ backgroundColor: COLORS.criticalSoft, borderColor: "#FECACA", color: COLORS.critical }}
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold hover:underline">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: COLORS.slate }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, ...rest }) {
  const styles = {
    primary: { backgroundColor: COLORS.primary, color: "white" },
    danger: { backgroundColor: COLORS.critical, color: "white" },
    ghost: { backgroundColor: "white", color: COLORS.ink, border: `1px solid ${COLORS.line}` },
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 transition bg-white";
export const inputStyle = { borderColor: COLORS.line, "--tw-ring-color": COLORS.primary };
