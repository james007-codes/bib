import React, { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import { COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../../styles/tokens.js";
import { ChartCard } from "../../components/analytics/ChartCard.jsx";
import { HBarChart, TrendChart, RoomFlairChart } from "../../components/analytics/Charts.jsx";
import { Card } from "../../components/shared/Card.jsx";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "../../components/shared/Feedback.jsx";
import { getStats } from "../../services/adminService.js";

export const RANGES = [["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];

export function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl p-1 bg-white border" style={{ borderColor: COLORS.line }} role="group" aria-label="Time range">
      {RANGES.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          style={{ backgroundColor: value === k ? COLORS.primary : "transparent", color: value === k ? "white" : COLORS.slate }}
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

  const load = async () => {
    setError("");
    setStats(null);
    try {
      setStats(await getStats({ range }));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [range]);

  const sorted = (arr, name, value = "count") =>
    [...(arr || [])].sort((a, b) => b[value] - a[value]).map((d) => ({ name: d[name], value: d[value] }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Analytics" subtitle="What breaks, where, and how often." action={<RangeToggle value={range} onChange={setRange} />} />

      <ErrorBanner message={error} onRetry={load} />

      {!stats && !error && (
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
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
              data={["Reported", "Assigned", "In Progress", "Resolved"].map((s) => ({
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
