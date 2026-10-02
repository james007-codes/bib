import React, { useEffect, useState } from "react";
import { FilePlus2, Bot, Inbox, Clock, CheckCircle2, ArrowRight } from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { StatCard } from "../../components/dashboard/StatCard.jsx";
import { ComplaintCard } from "../../components/complaints/ComplaintCard.jsx";
import { EmptyState, ErrorBanner, SkeletonCards, Button } from "../../components/shared/Feedback.jsx";
import { getMyComplaints } from "../../services/complaintService.js";

export function UserDashboard({ user, onNavigate, onOpenComplaint }) {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setComplaints(await getMyComplaints());
    } catch (e) {
      setError(e.message);
      setComplaints([]);
    }
  };

  useEffect(() => { load(); }, []);

  const count = (fn) => (complaints || []).filter(fn).length;
  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>Hi {firstName} 👋</h1>
        <p className="text-sm mt-1" style={{ color: COLORS.slate }}>Spotted something broken on campus? Let maintenance know in under a minute.</p>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {complaints === null ? (
          <SkeletonCards count={3} className="h-32" />
        ) : (
          <>
            <StatCard icon={Inbox} label="Reported" value={complaints.length} sub="All your complaints" accent={{ fg: COLORS.primary, soft: COLORS.primarySoft }} />
            <StatCard icon={Clock} label="In progress" value={count((c) => c.status === "Assigned" || c.status === "In Progress")} sub="Being worked on" accent={{ fg: COLORS.warning, soft: COLORS.warningSoft }} />
            <StatCard icon={CheckCircle2} label="Resolved" value={count((c) => c.status === "Resolved")} sub="Fixed and closed" accent={{ fg: COLORS.success, soft: COLORS.successSoft }} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center gap-5 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, #6366F1)` }}
        >
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Report an issue</h2>
            <p className="text-sm opacity-90 mt-1">Pick the room, choose what's wrong, add a photo. We'll prioritise it automatically.</p>
          </div>
          <button
            onClick={() => onNavigate("report")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold hover:bg-indigo-50 transition"
            style={{ color: COLORS.primary }}
          >
            <FilePlus2 className="w-4 h-4" /> Report now
          </button>
        </div>

        <Card className="p-5 flex flex-col">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySoft }}>
            <Bot className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold mt-3" style={{ color: COLORS.ink }}>Need help?</h3>
          <p className="text-sm mt-1 flex-1" style={{ color: COLORS.slate }}>Ask the assistant how reporting works or what happens next.</p>
          <button onClick={() => onNavigate("assistant")} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: COLORS.primary }}>
            Ask the assistant <ArrowRight className="w-4 h-4" />
          </button>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: COLORS.ink }}>Recent complaints</h2>
          {complaints?.length > 0 && (
            <button onClick={() => onNavigate("my-complaints")} className="text-sm font-medium hover:underline" style={{ color: COLORS.primary }}>
              View all
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {complaints === null && <SkeletonCards count={2} className="h-36" />}
          {complaints?.slice(0, 4).map((c) => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => onOpenComplaint(c.id)} />
          ))}
        </div>

        {complaints?.length === 0 && !error && (
          <Card>
            <EmptyState
              icon={Inbox}
              title="No complaints yet"
              message="When you report an issue, you can track its progress here."
              action={<Button onClick={() => onNavigate("report")}><FilePlus2 className="w-4 h-4" /> Report an issue</Button>}
            />
          </Card>
        )}
      </section>
    </div>
  );
}

export default UserDashboard;
