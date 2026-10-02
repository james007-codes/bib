import React, { useEffect, useState } from "react";
import { Inbox, FilePlus2 } from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { EmptyState, ErrorBanner, PageHeader, SkeletonCards, Button, inputClass, inputStyle } from "../../components/shared/Feedback.jsx";
import { ComplaintCard } from "../../components/complaints/ComplaintCard.jsx";
import { STATUSES, FLAIRS } from "../../data/config.js";
import { getMyComplaints } from "../../services/complaintService.js";

export function MyComplaints({ onOpenComplaint, onNavigate }) {
  const [status, setStatus] = useState("");
  const [flair, setFlair] = useState("");
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setComplaints(null);
    try {
      setComplaints(await getMyComplaints({ status, flair }));
    } catch (e) {
      setError(e.message);
      setComplaints([]);
    }
  };

  useEffect(() => { load(); }, [status, flair]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="My complaints"
        subtitle="Track everything you've reported."
        action={<Button onClick={() => onNavigate("report")}><FilePlus2 className="w-4 h-4" /> Report issue</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {["", ...STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border transition"
            style={{
              backgroundColor: status === s ? COLORS.primary : "white",
              color: status === s ? "white" : COLORS.slate,
              borderColor: status === s ? COLORS.primary : COLORS.line,
            }}
          >
            {s || "All"}
          </button>
        ))}
        <select className={`${inputClass} !w-auto ml-auto`} style={inputStyle} value={flair} onChange={(e) => setFlair(e.target.value)} aria-label="Filter by issue type">
          <option value="">All issue types</option>
          {FLAIRS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="grid md:grid-cols-2 gap-3 mt-3">
        {complaints === null && <SkeletonCards count={4} className="h-36" />}
        {complaints?.map((c) => (
          <ComplaintCard key={c.id} complaint={c} onClick={() => onOpenComplaint(c.id)} />
        ))}
      </div>

      {complaints?.length === 0 && !error && (
        <Card>
          <EmptyState
            icon={Inbox}
            title={status || flair ? "No complaints match these filters" : "No complaints yet"}
            message={status || flair ? "Try a different filter." : "Report an issue and it'll show up here."}
          />
        </Card>
      )}
    </div>
  );
}

export default MyComplaints;
