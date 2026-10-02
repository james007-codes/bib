import React, { useEffect, useState } from "react";
import { Search, Inbox, ChevronLeft, ChevronRight } from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { PulseDot } from "../../components/shared/PulseDot.jsx";
import { EmptyState, ErrorBanner, PageHeader, Skeleton, inputClass, inputStyle } from "../../components/shared/Feedback.jsx";
import { ComplaintTable } from "../../components/complaints/ComplaintTable.jsx";
import { STATUSES, PRIORITIES, FLAIRS, BUILDINGS, ROOM_TYPES } from "../../data/config.js";
import { getAllComplaints } from "../../services/adminService.js";
import { usePolling } from "../../utils/usePolling.js";

const LIMIT = 20;

export function Complaints({ onSelect, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    status: "", priority: "", flair: "", buildingId: "", roomType: "", recurring: false, sort: "priority",
    ...initialFilters,
  });
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [filters, debounced]);

  usePolling(
    async ({ silent } = {}) => {
      if (!silent) setData(null);
      try {
        setData(await getAllComplaints({ ...filters, search: debounced, page, limit: LIMIT }));
        setError("");
      } catch (e) {
        setError(e.message);
        if (!silent) setData({ items: [], total: 0, page: 1 });
      }
    },
    20000,
    [filters, debounced, page]
  );

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const active = Object.entries(filters).some(([k, v]) => k !== "sort" && v);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Complaints"
        subtitle={
          <span className="inline-flex items-center gap-2">
            <PulseDot color={COLORS.success} /> Live · refreshes every 20s
            {data && <span>· {data.total} total</span>}
          </span>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.slate }} />
            <input
              type="search"
              className={`${inputClass} pl-9`}
              style={inputStyle}
              placeholder="Search ticket, title, room…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search complaints"
            />
          </div>
          <Select value={filters.status} onChange={(v) => set({ status: v })} label="All statuses" options={STATUSES} />
          <Select value={filters.priority} onChange={(v) => set({ priority: v })} label="All priorities" options={PRIORITIES} />
          <Select value={filters.flair} onChange={(v) => set({ flair: v })} label="All issue types" options={FLAIRS.map((f) => [f.id, f.label])} />
          <Select value={filters.buildingId} onChange={(v) => set({ buildingId: v })} label="All buildings" options={BUILDINGS.map((b) => [b.id, b.name])} />
          <Select value={filters.roomType} onChange={(v) => set({ roomType: v })} label="All room types" options={ROOM_TYPES} />
          <Select
            value={filters.sort}
            onChange={(v) => set({ sort: v })}
            options={[["priority", "Sort: Critical first"], ["newest", "Sort: Newest"], ["oldest", "Sort: Oldest"]]}
          />
          <label className="inline-flex items-center gap-2 px-3 text-sm cursor-pointer" style={{ color: COLORS.ink }}>
            <input type="checkbox" checked={filters.recurring} onChange={(e) => set({ recurring: e.target.checked })} className="accent-indigo-600" />
            Recurring only
          </label>
          {active && (
            <button
              className="text-sm font-medium px-2 hover:underline"
              style={{ color: COLORS.primary }}
              onClick={() => setFilters({ status: "", priority: "", flair: "", buildingId: "", roomType: "", recurring: false, sort: filters.sort })}
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <ErrorBanner message={error} />

      <Card className="mt-3 overflow-hidden">
        {!data && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        )}
        {data?.items.length > 0 && <ComplaintTable complaints={data.items} onSelect={onSelect} />}
        {data?.items.length === 0 && (
          <EmptyState icon={Inbox} title="No complaints found" message={active || debounced ? "Try clearing some filters." : "Nothing has been reported yet."} />
        )}

        {data && data.total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm" style={{ borderColor: COLORS.line, color: COLORS.slate }}>
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: COLORS.line }} aria-label="Previous page">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: COLORS.line }} aria-label="Next page">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Select({ value, onChange, label, options }) {
  return (
    <select className={`${inputClass} !w-auto`} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label || "Sort"}>
      {label && <option value="">{label}</option>}
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

export default Complaints;
