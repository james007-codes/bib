import React, { useState } from "react";
import { Inbox, AlertOctagon, CheckCircle2, Timer, Repeat, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

import { COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { StatCard } from "../../components/dashboard/StatCard.jsx";
import { PulseDot } from "../../components/shared/PulseDot.jsx";
import { FlairChip, PriorityBadge, RoomTypeTag } from "../../components/shared/Badges.jsx";
import { EmptyState, ErrorBanner, PageHeader, Skeleton, SkeletonCards } from "../../components/shared/Feedback.jsx";
import { PRIORITIES, STATUSES } from "../../data/config.js";
import { timeAgo, shortDay } from "../../utils/format.js";
import { usePolling } from "../../utils/usePolling.js";
import { getStats, getAllComplaints } from "../../services/adminService.js";

export function AdminDashboard({ onSelect: onOpenComplaint, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [urgent, setUrgent] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, u] = await Promise.all([
        getStats({ range: "30d" }),
        getAllComplaints({ priority: "Critical", status: "Reported", sort: "oldest", limit: 10 }),
      ]);
      setStats(s);
      setUrgent(u.items);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  usePolling(load, 20000);

  const k = stats?.kpis;
  const countOf = (list, key, value) => list?.find((x) => x[key] === value)?.count ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Maintenance dashboard"
        subtitle="Last 30 days · refreshes every 20 seconds"
        action={
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.successSoft, color: COLORS.success }}>
            <PulseDot color={COLORS.success} /> Live
          </span>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {!k ? (
          <SkeletonCards count={5} className="h-32" />
        ) : (
          <>
            <StatCard icon={Inbox} label="Open complaints" value={k.open} sub={`${k.total} reported`} accent={{ fg: COLORS.primary, soft: COLORS.primarySoft }} />
            <StatCard icon={AlertOctagon} label="Critical open" value={k.criticalOpen} accent={{ fg: COLORS.critical, soft: COLORS.criticalSoft }} />
            <StatCard icon={CheckCircle2} label="Resolved this week" value={k.resolvedThisWeek} accent={{ fg: COLORS.success, soft: COLORS.successSoft }} />
            <StatCard icon={Timer} label="Avg. resolution" value={k.avgResolutionHours != null ? `${k.avgResolutionHours}h` : "—"} accent={{ fg: COLORS.blue, soft: COLORS.blueSoft }} />
            <StatCard icon={Repeat} label="Recurring" value={k.recurringCount} sub="same room + issue" accent={{ fg: COLORS.warning, soft: COLORS.warningSoft }} />
          </>
        )}
      </div>

      {/* Critical & unassigned */}
      <Card className="overflow-hidden" style={{ borderColor: "#FECACA" }}>
        <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ backgroundColor: COLORS.criticalSoft, borderColor: "#FECACA" }}>
          <ShieldAlert className="w-4 h-4" style={{ color: COLORS.critical }} />
          <h2 className="text-sm font-semibold" style={{ color: COLORS.critical }}>Critical &amp; unassigned</h2>
          {urgent?.length > 0 && (
            <span className="ml-auto text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: COLORS.critical }}>{urgent.length}</span>
          )}
        </div>
        {urgent === null && <div className="p-5 space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
        {urgent?.length === 0 && <EmptyState icon={CheckCircle2} title="Nothing critical waiting" message="Every critical complaint has a worker assigned." />}
        {urgent?.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpenComplaint(c.id)}
            className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 border-b last:border-0 text-left hover:bg-red-50/50 transition"
            style={{ borderColor: COLORS.line }}
          >
            <PulseDot color={COLORS.critical} />
            <span className="font-mono text-xs font-semibold" style={{ color: COLORS.slate }}>{c.ticketNo}</span>
            <span className="text-sm font-medium flex-1 min-w-[160px]" style={{ color: COLORS.ink }}>{c.title}</span>
            <span className="text-xs" style={{ color: COLORS.slate }}>{c.location.roomName} · {c.location.building}</span>
            <span className="text-xs" style={{ color: COLORS.slate }}>{timeAgo(c.createdAt)}</span>
            <ArrowRight className="w-4 h-4" style={{ color: COLORS.slate }} />
          </button>
        ))}
      </Card>

      {/* status + priority counts */}
      <div className="grid md:grid-cols-2 gap-4">
        <CountCard title="By status" items={STATUSES.map((s) => ({ label: s, value: countOf(stats?.byStatus, "status", s), ...STATUS_COLORS[s] }))} loading={!stats} />
        <CountCard title="By priority" items={[...PRIORITIES].reverse().map((p) => ({ label: p, value: countOf(stats?.byPriority, "priority", p), ...PRIORITY_COLORS[p] }))} loading={!stats} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
        {/* hotspots */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: COLORS.ink }}>Recurring hotspots</h2>
            <button onClick={() => onNavigate("locations")} className="text-xs font-medium hover:underline" style={{ color: COLORS.primary }}>Locations</button>
          </div>
          {!stats && <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
          {stats?.hotspots?.length === 0 && <EmptyState icon={Activity} title="No hotspots" message="No room has the same issue reported repeatedly." />}
          <ul className="space-y-2">
            {stats?.hotspots?.slice(0, 6).map((h) => (
              <li key={`${h.roomId}-${h.flair}`} className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: COLORS.line }}>
                <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>{h.roomName}</span>
                <RoomTypeTag roomType={h.roomType} />
                <FlairChip flair={h.flair} />
                <span className="ml-auto text-sm font-bold" style={{ color: COLORS.warning }}>×{h.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* trend */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Complaints per day</h2>
          <div style={{ width: "100%", height: 220 }}>
            {!stats ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer>
                <AreaChart data={stats.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.line} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 11, fill: COLORS.slate }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.slate }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={shortDay} />
                  <Area type="monotone" dataKey="count" name="Complaints" stroke={COLORS.primary} strokeWidth={2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CountCard({ title, items, loading }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl px-3 py-3" style={{ backgroundColor: i.bg }}>
            <div className="text-2xl font-bold" style={{ color: i.fg }}>{loading ? "–" : i.value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: i.fg }}>{i.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default AdminDashboard;
