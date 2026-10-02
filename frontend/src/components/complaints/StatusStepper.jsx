import React from "react";
import { Check } from "lucide-react";
import { COLORS } from "../../styles/tokens.js";
import { STATUSES } from "../../data/config.js";

export function StatusStepper({ status }) {
  const current = Math.max(0, STATUSES.indexOf(status));

  return (
    <ol className="flex items-center w-full" aria-label="Complaint progress">
      {STATUSES.map((s, i) => {
        const done = i < current || status === "Resolved";
        const active = i === current && status !== "Resolved";
        const color = done ? COLORS.success : active ? COLORS.primary : COLORS.line;

        return (
          <li key={s} className={`flex items-center ${i < STATUSES.length - 1 ? "flex-1" : ""}`} aria-current={active ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition"
                style={{
                  backgroundColor: done ? COLORS.success : active ? COLORS.primary : "white",
                  color: done || active ? "white" : COLORS.slate,
                  border: `2px solid ${color}`,
                  boxShadow: active ? `0 0 0 4px ${COLORS.primarySoft}` : "none",
                }}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-center" style={{ color: done || active ? COLORS.ink : COLORS.slate }}>
                {s}
              </span>
            </div>
            {i < STATUSES.length - 1 && (
              <div className="flex-1 h-0.5 -mt-5 mx-1 rounded" style={{ backgroundColor: i < current || status === "Resolved" ? COLORS.success : COLORS.line }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default StatusStepper;
