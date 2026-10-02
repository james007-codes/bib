import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, UserCog, Repeat, CheckCircle2 } from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { ErrorBanner, Skeleton } from "../../components/shared/Feedback.jsx";
import { FlairChip, PriorityBadge, StatusPill, RoomTypeTag } from "../../components/shared/Badges.jsx";
import { StatusStepper } from "../../components/complaints/StatusStepper.jsx";
import { UpdateTimeline } from "../../components/complaints/UpdateTimeline.jsx";
import { PhotoGallery } from "../../components/complaints/PhotoGallery.jsx";
import { PriorityReason } from "../../components/complaints/PriorityReason.jsx";
import { formatDateTime, ordinal } from "../../utils/format.js";
import { getComplaint } from "../../services/complaintService.js";

export function ComplaintTracker({ id, onBack }) {
  const [c, setC] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setC(await getComplaint(id));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: COLORS.primary }}>
        <ArrowLeft className="w-4 h-4" /> My complaints
      </button>

      <ErrorBanner message={error} onRetry={load} />

      {!c && !error && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {c && (
        <>
          <Card className="p-5 sm:p-6" style={c.priority === "Critical" && c.status !== "Resolved" ? { borderLeft: `4px solid ${COLORS.critical}`, borderColor: "#FECACA" } : undefined}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-mono font-semibold" style={{ color: COLORS.slate }}>{c.ticketNo}</span>
              <FlairChip flair={c.flair} />
              <PriorityBadge priority={c.priority} raised={c.prioritySource === "keyword"} />
              <StatusPill status={c.status} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-3" style={{ color: COLORS.ink }}>{c.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm" style={{ color: COLORS.slate }}>
              <MapPin className="w-4 h-4" />
              {c.location.roomName} · {c.location.floor}, {c.location.building}
              <RoomTypeTag roomType={c.location.roomType} />
              {c.location.spot && <span>· {c.location.spot}</span>}
            </div>
            <p className="text-xs mt-2" style={{ color: COLORS.slate }}>Reported {formatDateTime(c.createdAt)}</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <StatusStepper status={c.status} />
          </Card>

          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <div className="space-y-4">
              {c.resolution && (
                <Card className="p-5" style={{ borderColor: "#A7F3D0", backgroundColor: COLORS.successSoft }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
                    <h2 className="font-semibold" style={{ color: COLORS.success }}>Resolved {formatDateTime(c.resolution.resolvedAt)}</h2>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: COLORS.ink }}>{c.resolution.note}</p>
                  {c.resolution.afterPhoto && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: COLORS.slate }}>After photo</p>
                      <PhotoGallery photos={[c.resolution.afterPhoto]} />
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-5">
                <h2 className="font-semibold mb-2" style={{ color: COLORS.ink }}>Description</h2>
                <p className="text-sm whitespace-pre-wrap" style={{ color: COLORS.ink }}>{c.description}</p>
                <h3 className="font-semibold mt-5 mb-2 text-sm" style={{ color: COLORS.ink }}>Photos</h3>
                <PhotoGallery photos={c.photos} />
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold mb-4" style={{ color: COLORS.ink }}>Updates</h2>
                <UpdateTimeline updates={c.updates} />
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Assigned to</h2>
                {c.assignedWorker ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primarySoft }}>
                      <UserCog className="w-4 h-4" style={{ color: COLORS.primary }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: COLORS.ink }}>{c.assignedWorker.name}</span>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: COLORS.slate }}>Waiting for a maintenance worker to be assigned.</p>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-2" style={{ color: COLORS.ink }}>Why this priority?</h2>
                <PriorityReason complaint={c} />
              </Card>

              {c.recurrence?.isRecurring && (
                <Card className="p-5" style={{ backgroundColor: COLORS.warningSoft, borderColor: "#FDE68A" }}>
                  <div className="flex items-start gap-2" style={{ color: COLORS.warning }}>
                    <Repeat className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">
                      This is the {ordinal(c.recurrence.count + 1)} report of this issue in {c.location.roomName} in the last {c.recurrence.windowDays} days.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ComplaintTracker;
