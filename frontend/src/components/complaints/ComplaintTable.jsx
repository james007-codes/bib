import React from "react";
import { Repeat } from "lucide-react";
import { COLORS } from "../../styles/tokens.js";
import { FlairChip, PriorityBadge, StatusPill, RoomTypeTag } from "../shared/Badges.jsx";
import { timeAgo } from "../../utils/format.js";

export function ComplaintTable({ complaints, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide" style={{ color: COLORS.slate }}>
            {["Ticket", "Issue", "Location", "Priority", "Status", "Worker", "Age"].map((h) => (
              <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => {
            const critical = c.priority === "Critical" && c.status !== "Resolved";
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
                tabIndex={0}
                className="border-t cursor-pointer hover:bg-slate-50 transition focus:outline-none focus-visible:bg-indigo-50"
                style={{
                  borderColor: COLORS.line,
                  boxShadow: critical ? `inset 3px 0 0 ${COLORS.critical}` : undefined,
                }}
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap" style={{ color: COLORS.slate }}>{c.ticketNo}</td>
                <td className="px-4 py-3 min-w-[240px]">
                  <div className="flex items-center gap-1.5 font-medium" style={{ color: COLORS.ink }}>
                    <span className="line-clamp-1">{c.title}</span>
                    {c.recurrence?.isRecurring && (
                      <Repeat className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.warning }} aria-label="Recurring" />
                    )}
                  </div>
                  <div className="mt-1"><FlairChip flair={c.flair} /></div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div style={{ color: COLORS.ink }}>{c.location.roomName}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <RoomTypeTag roomType={c.location.roomType} />
                    <span className="text-xs" style={{ color: COLORS.slate }}>{c.location.building}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><PriorityBadge priority={c.priority} raised={c.prioritySource === "keyword"} /></td>
                <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: c.assignedWorker ? COLORS.ink : COLORS.slate }}>
                  {c.assignedWorker?.name || "Unassigned"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: COLORS.slate }}>{timeAgo(c.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintTable;
