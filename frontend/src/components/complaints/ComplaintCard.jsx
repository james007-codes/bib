import React from "react";
import { MapPin, UserCog } from "lucide-react";
import { COLORS } from "../../styles/tokens.js";
import { FlairChip, PriorityBadge, StatusPill, RecurringTag } from "../shared/Badges.jsx";
import { timeAgo } from "../../utils/format.js";

export function ComplaintCard({ complaint: c, onClick }) {
  const critical = c.priority === "Critical" && c.status !== "Resolved";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus-visible:ring-2"
      style={{
        borderColor: critical ? "#FECACA" : COLORS.line,
        borderLeft: critical ? `4px solid ${COLORS.critical}` : undefined,
        "--tw-ring-color": COLORS.primary,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-mono font-semibold" style={{ color: COLORS.slate }}>{c.ticketNo}</span>
        <FlairChip flair={c.flair} />
        {c.recurrence?.isRecurring && <RecurringTag count={c.recurrence.count} />}
        <span className="ml-auto text-xs" style={{ color: COLORS.slate }}>{timeAgo(c.createdAt)}</span>
      </div>

      <h3 className="font-semibold text-sm sm:text-base line-clamp-1" style={{ color: COLORS.ink }}>{c.title}</h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: COLORS.slate }}>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {c.location.roomName} · {c.location.building}
        </span>
        {c.assignedWorker && (
          <span className="inline-flex items-center gap-1">
            <UserCog className="w-3.5 h-3.5" /> {c.assignedWorker.name}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <PriorityBadge priority={c.priority} raised={c.prioritySource === "keyword"} />
        <StatusPill status={c.status} />
      </div>
    </button>
  );
}

export default ComplaintCard;
