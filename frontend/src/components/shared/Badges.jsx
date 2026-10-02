import React from "react";
import {
  Zap, Flame, PlugZap, Lightbulb, Fan, AirVent, Projector, Presentation, Armchair, Monitor, Wifi,
  FlaskConical, GlassWater, Droplets, Bath, Bug, UtensilsCrossed, CookingPot, ArrowUpDown,
  Construction, Sparkles, CircleHelp, ShieldAlert, AlertTriangle, Info, Minus, TrendingUp, Repeat,
} from "lucide-react";

import { COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../../styles/tokens.js";
import { getFlair } from "../../data/config.js";
import { PulseDot } from "./PulseDot.jsx";

/* =========================
   FLAIR ICONS (names come from complaintConfig.json)
========================= */

const ICONS = {
  Zap, Flame, PlugZap, Lightbulb, Fan, AirVent, Projector, Presentation, Armchair, Monitor, Wifi,
  FlaskConical, GlassWater, Droplets, Bath, Bug, UtensilsCrossed, CookingPot, ArrowUpDown,
  Construction, Sparkles, CircleHelp,
};

export function FlairIcon({ name, className = "w-4 h-4", style }) {
  const Icon = ICONS[name] || CircleHelp;
  return <Icon className={className} style={style} aria-hidden="true" />;
}

/* Reddit-style colored pill */
export function FlairChip({ flair: flairId, size = "sm", selected, onClick }) {
  const f = getFlair(flairId);
  const Tag = onClick ? "button" : "span";
  const pad = size === "lg" ? "px-3 py-2 text-sm" : "px-2.5 py-1 text-xs";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!selected : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition ${pad} ${
        onClick ? "hover:shadow-sm hover:-translate-y-px" : ""
      }`}
      style={{
        backgroundColor: selected ? f.color : `${f.color}14`,
        color: selected ? "white" : f.color,
        border: `1px solid ${selected ? f.color : `${f.color}33`}`,
      }}
    >
      <FlairIcon name={f.icon} className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      {f.label}
    </Tag>
  );
}

/* =========================
   PRIORITY
========================= */

const PRIORITY_ICON = { Critical: ShieldAlert, High: AlertTriangle, Medium: Info, Low: Minus };

export function PriorityBadge({ priority, raised = false, showIcon = true }) {
  const s = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  const Icon = PRIORITY_ICON[priority] || Minus;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
      title={raised ? "Raised by keyword" : undefined}
    >
      {priority === "Critical" ? <PulseDot color={s.fg} /> : showIcon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      {priority}
      {raised && <TrendingUp className="w-3.5 h-3.5" aria-label="raised by keyword" />}
    </span>
  );
}

/* =========================
   STATUS
========================= */

export function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Reported;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}

/* =========================
   MISC TAGS
========================= */

export function RoomTypeTag({ roomType }) {
  if (!roomType) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: COLORS.graySoft, color: COLORS.slate }}
    >
      {roomType}
    </span>
  );
}

export function RecurringTag({ count }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: COLORS.warningSoft, color: COLORS.warning }}
      title="Recurring issue"
    >
      <Repeat className="w-3 h-3" aria-hidden="true" />
      {count ? `Recurring ×${count + 1}` : "Recurring"}
    </span>
  );
}

export function WorkerStatusPill({ status }) {
  const map = {
    Available: { bg: COLORS.successSoft, fg: COLORS.success },
    Busy: { bg: COLORS.warningSoft, fg: COLORS.warning },
    "Off Duty": { bg: COLORS.graySoft, fg: COLORS.gray },
  };
  const s = map[status] || map.Available;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}
