import React, { useState } from "react";
import { BarChart3 } from "lucide-react";

import { COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../../styles/tokens.js";
import { ChartCard } from "../../components/analytics/ChartCard.jsx";
import { HBarChart, TrendChart, RoomFlairChart } from "../../components/analytics/Charts.jsx";
import { Card } from "../../components/shared/Card.jsx";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "../../components/shared/Feedback.jsx";
import { getStats } from "../../services/adminService.js";
import { usePolling } from "../../utils/usePolling.js";
import { LiveIndicator } from "../../components/shared/PulseDot.jsx";

export const RANGES = [["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];

export function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md p-0.5" style={{ backgroundColor: COLORS.lineSoft }} role="group" aria-label="Time range">
      {RANGES.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className="h-7 px-2.5 rounded-[5px] text-xs font-medium transition-colors"
          style={{ backgroundColor: value === k ? COLORS.surface2 : "transparent", color: value === k ? COLORS.ink : COLORS.slate, boxShadow: value === k ? "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.5)" : "none" }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Analytics() {
  const [range, setRange] = useState("30d");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = async ({ silent } = {}) => {
    if (!silent) setStats(null);
    try {
      setStats(await getStats({ range }));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  usePolling(load, 20000, [range]);

  const sorted = (arr, name, value = "count") =>
    [...(arr || [])].sort((a, b) => b[value] - a[value]).map((d) => ({ name: d[name], value: d[value] }));

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <PageHeader title="Analytics" subtitle="What breaks, where, and how often." action={<div className="flex items-center gap-4"><LiveIndicator /><RangeToggle value={range} onChange={setRange} /></div>} />

      <ErrorBanner message={error} onRetry={load} />

      {!stats && !error && (
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      )}

      {stats && stats.kpis.total === 0 && (
        <Card><EmptyState icon={BarChart3} title="No complaints in this range" message="Try a longer time range." /></Card>
      )}

      {stats && stats.kpis.total > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="lg:col-span-2">
            <ChartCard title="Complaints over time" subtitle="New complaints per day" height="auto">
              <TrendChart data={stats.trend} height={260} />
            </ChartCard>
          </div>

          <ChartCard title="Complaints by issue type" subtitle="Which problems come up most" height="auto">
            <HBarChart data={sorted(stats.byFlair, "label")} />
          </ChartCard>

          <div className="space-y-4">
            <ChartCard title="By category" height="auto">
              <HBarChart data={sorted(stats.byFlairGroup, "label")} />
            </ChartCard>
            <ChartCard title="By room type" height="auto">
              <HBarChart data={sorted(stats.byRoomType, "roomType")} />
            </ChartCard>
          </div>

          <ChartCard title="Reported by department" subtitle="Department of the student or teacher who reported" height="auto">
            <HBarChart data={sorted(stats.byDepartment, "label")} />
          </ChartCard>

          <ChartCard title="Students vs teachers" height="auto">
            <HBarChart data={(stats.byReporterType || []).map((r) => ({ name: r.type, value: r.count }))} />
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard title="What fails where" subtitle="Top rooms by complaints, split by issue type" height="auto">
              <RoomFlairChart matrix={stats.roomFlairMatrix} />
            </ChartCard>
          </div>

          <ChartCard title="By priority" height="auto">
            <HBarChart
              data={["Critical", "High", "Medium", "Low"].map((p) => ({
                name: p,
                value: stats.byPriority.find((x) => x.priority === p)?.count || 0,
                color: PRIORITY_COLORS[p].fg,
              }))}
            />
          </ChartCard>

          <ChartCard title="By status" height="auto">
            <HBarChart
              data={["Reported", "In Progress", "Escalated", "Resolved"].map((s) => ({
                name: s,
                value: stats.byStatus.find((x) => x.status === s)?.count || 0,
                color: STATUS_COLORS[s].fg,
              }))}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

export default Analytics;
