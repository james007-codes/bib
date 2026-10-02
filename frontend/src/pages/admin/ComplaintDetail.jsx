import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, User, Loader2, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Card } from "../../components/shared/Card.jsx";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog.jsx";
import { Button, ErrorBanner, Skeleton, inputClass, inputStyle } from "../../components/shared/Feedback.jsx";
import { FlairChip, PriorityBadge, StatusPill, RoomTypeTag, WorkerStatusPill } from "../../components/shared/Badges.jsx";
import { StatusStepper } from "../../components/complaints/StatusStepper.jsx";
import { UpdateTimeline } from "../../components/complaints/UpdateTimeline.jsx";
import { PhotoGallery } from "../../components/complaints/PhotoGallery.jsx";
import { PhotoDropzone } from "../../components/complaints/PhotoDropzone.jsx";
import { PriorityReason } from "../../components/complaints/PriorityReason.jsx";
import { RecurrencePanel } from "../../components/complaints/RecurrencePanel.jsx";
import { PRIORITIES } from "../../data/config.js";
import { formatDateTime } from "../../utils/format.js";
import {
  getComplaintDetail, getWorkers, assignWorker, updateStatus, overridePriority, resolveComplaint,
} from "../../services/adminService.js";

export function ComplaintDetail({ id, onBack }) {
  const [c, setC] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { type: "warning" | "success", text }

  const load = async () => {
    setError("");
    try {
      setC(await getComplaintDetail(id));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onUpdated = (complaint, msg) => {
    setC(complaint);
    setNotice(msg || null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: COLORS.primary }}>
        <ArrowLeft className="w-4 h-4" /> All complaints
      </button>

      <ErrorBanner message={error} onRetry={load} />

      {!c && !error && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {c && (
        <>
          {notice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
              style={notice.type === "warning"
                ? { backgroundColor: COLORS.warningSoft, color: COLORS.warning }
                : { backgroundColor: COLORS.successSoft, color: COLORS.success }}
            >
              {notice.type === "warning" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {notice.text}
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_380px] gap-4 items-start">
            {/* ================= LEFT ================= */}
            <div className="space-y-4 min-w-0">
              <Card className="p-5 sm:p-6" style={c.priority === "Critical" && c.status !== "Resolved" ? { borderLeft: `4px solid ${COLORS.critical}`, borderColor: "#FECACA" } : undefined}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-mono font-semibold" style={{ color: COLORS.slate }}>{c.ticketNo}</span>
                  <FlairChip flair={c.flair} />
                  <StatusPill status={c.status} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold mt-3" style={{ color: COLORS.ink }}>{c.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm" style={{ color: COLORS.slate }}>
                  <MapPin className="w-4 h-4" />
                  {c.location.roomName} · {c.location.floor}, {c.location.building}
                  <RoomTypeTag roomType={c.location.roomType} />
                  {c.location.spot && <span>· {c.location.spot}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm" style={{ color: COLORS.slate }}>
                  <User className="w-4 h-4" />
                  {c.reportedBy?.name || "Unknown"} ({c.reportedBy?.type}) · {formatDateTime(c.createdAt)}
                </div>

                <p className="text-sm whitespace-pre-wrap mt-4" style={{ color: COLORS.ink }}>{c.description}</p>

                <div className="mt-4"><PhotoGallery photos={c.photos} /></div>
              </Card>

              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold mb-2" style={{ color: COLORS.ink }}>Priority</h2>
                    <div className="flex items-center gap-2 mb-1.5">
                      <PriorityBadge priority={c.priority} raised={c.prioritySource === "keyword"} />
                    </div>
                    <PriorityReason complaint={c} />
                  </div>
                  <PriorityOverride complaint={c} onUpdated={onUpdated} />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Recurrence history</h2>
                <RecurrencePanel recurrence={c.recurrence} roomName={c.location.roomName} />
              </Card>

              {c.resolution && (
                <Card className="p-5" style={{ borderColor: "#A7F3D0", backgroundColor: COLORS.successSoft }}>
                  <h2 className="text-sm font-semibold mb-2" style={{ color: COLORS.success }}>Resolved {formatDateTime(c.resolution.resolvedAt)}</h2>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: COLORS.ink }}>{c.resolution.note}</p>
                  {c.resolution.afterPhoto && <div className="mt-3"><PhotoGallery photos={[c.resolution.afterPhoto]} /></div>}
                </Card>
              )}
            </div>

            {/* ================= RIGHT ================= */}
            <div className="space-y-4 lg:sticky lg:top-20">
              <Card className="p-5"><StatusStepper status={c.status} /></Card>

              {c.status !== "Resolved" && <AssignPanel complaint={c} onUpdated={onUpdated} />}
              {(c.status === "Assigned" || c.status === "In Progress") && <StatusPanel complaint={c} onUpdated={onUpdated} />}
              {c.status === "In Progress" && <ResolvePanel complaint={c} onUpdated={onUpdated} />}

              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: COLORS.ink }}>Timeline</h2>
                <UpdateTimeline updates={c.updates} />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   ASSIGN WORKER
========================= */

function AssignPanel({ complaint: c, onUpdated }) {
  const [workers, setWorkers] = useState(null);
  const [workerId, setWorkerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkers({ flair: c.flair })
      .then(setWorkers)
      .catch((e) => { setError(e.message); setWorkers([]); });
  }, [c.flair, c.assignedWorker?.id]);

  const selected = workers?.find((w) => w.id === workerId);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const { complaint, warning } = await assignWorker(c.id, workerId);
      setWorkerId("");
      onUpdated(complaint, warning ? { type: "warning", text: warning } : { type: "success", text: `Assigned to ${complaint.assignedWorker?.name}.` });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>{c.assignedWorker ? "Reassign worker" : "Assign worker"}</h2>
      {c.assignedWorker && <p className="text-xs mb-3" style={{ color: COLORS.slate }}>Currently: <b>{c.assignedWorker.name}</b></p>}
      {!c.assignedWorker && <p className="text-xs mb-3" style={{ color: COLORS.slate }}>Skilled workers, least busy first.</p>}

      {workers === null ? (
        <Skeleton className="h-10 w-full" />
      ) : workers.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.slate }}>No workers have the skills for this issue type.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {workers.map((w) => {
            const off = w.status === "Off Duty";
            const current = w.id === c.assignedWorker?.id;
            const active = workerId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                disabled={off || current}
                onClick={() => setWorkerId(w.id)}
                className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: active ? COLORS.primary : COLORS.line, backgroundColor: active ? COLORS.primarySoft : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: COLORS.ink }}>{w.name}{current && " (current)"}</div>
                  <div className="text-xs" style={{ color: w.overloaded ? COLORS.warning : COLORS.slate }}>
                    {w.activeCount} active task{w.activeCount === 1 ? "" : "s"}{w.overloaded && " · overloaded"}
                  </div>
                </div>
                <LoadBar value={w.activeCount} />
                <WorkerStatusPill status={w.status} />
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: COLORS.critical }}>{error}</p>}

      <Button className="w-full mt-3" disabled={!selected || busy} onClick={submit}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {selected ? `Assign to ${selected.name}` : "Select a worker"}
      </Button>
    </Card>
  );
}

function LoadBar({ value, max = 5 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= max ? COLORS.critical : value >= 3 ? COLORS.warning : COLORS.success;
  return (
    <div className="w-14 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.line }} aria-hidden="true">
      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: color }} />
    </div>
  );
}

/* =========================
   STATUS UPDATE / PROGRESS NOTE
========================= */

function StatusPanel({ complaint: c, onUpdated }) {
  const canStart = c.status === "Assigned";
  const [mode, setMode] = useState(canStart ? "start" : "note");
  const [comment, setComment] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMode(canStart ? "start" : "note"), [canStart]);

  const status = mode === "start" ? "In Progress" : c.status;
  const valid = mode === "start" || comment.trim();

  const submit = async () => {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const complaint = await updateStatus(c.id, { status, comment: comment.trim() });
      setComment("");
      onUpdated(complaint, { type: "success", text: mode === "start" ? "Marked as In Progress." : "Update posted." });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Update status</h2>

      {canStart && (
        <div className="inline-flex rounded-lg p-1 mb-3" style={{ backgroundColor: COLORS.graySoft }}>
          {[["start", "Start work"], ["note", "Progress note"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${mode === k ? "bg-white shadow-sm" : ""}`}
              style={{ color: mode === k ? COLORS.ink : COLORS.slate }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <textarea
        className={`${inputClass} min-h-[80px]`}
        style={inputStyle}
        placeholder={mode === "start" ? "Optional note, e.g. Electrician on the way" : "e.g. Spare part ordered, arriving tomorrow"}
        value={comment}
        maxLength={1000}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <p className="text-xs mt-2" style={{ color: COLORS.critical }}>{error}</p>}

      <Button className="w-full mt-3" disabled={!valid || busy} onClick={() => (mode === "start" ? setConfirm(true) : submit())}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {mode === "start" ? "Move to In Progress" : "Post update"}
      </Button>

      <ConfirmDialog
        open={confirm}
        title="Start work"
        message={`Move ${c.ticketNo} to In Progress? The reporter will see this update.`}
        confirmLabel="Move to In Progress"
        onConfirm={submit}
        onCancel={() => setConfirm(false)}
      />
    </Card>
  );
}

/* =========================
   RESOLVE
========================= */

function ResolvePanel({ complaint: c, onUpdated }) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("note", note.trim());
      if (photo[0]) fd.append("afterPhoto", photo[0]);
      const complaint = await resolveComplaint(c.id, fd);
      onUpdated(complaint, { type: "success", text: `${c.ticketNo} resolved.` });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>Resolve</h2>
      <textarea
        className={`${inputClass} min-h-[80px]`}
        style={inputStyle}
        placeholder="What was fixed? e.g. Replaced the faulty switchboard."
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-3">
        <PhotoDropzone files={photo} onChange={setPhoto} max={1} label="Optional after photo" />
      </div>
      {error && <p className="text-xs mt-2" style={{ color: COLORS.critical }}>{error}</p>}
      <Button className="w-full mt-3" style={{ backgroundColor: COLORS.success, color: "white" }} disabled={!note.trim() || busy} onClick={() => setConfirm(true)}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Mark as resolved
      </Button>

      <ConfirmDialog
        open={confirm}
        title="Resolve complaint"
        message={`Mark ${c.ticketNo} as resolved? This closes the complaint for the reporter.`}
        confirmLabel="Resolve"
        onConfirm={submit}
        onCancel={() => setConfirm(false)}
      />
    </Card>
  );
}

/* =========================
   PRIORITY OVERRIDE
========================= */

function PriorityOverride({ complaint: c, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(c.priority);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setPriority(c.priority), [c.priority]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: COLORS.primary }}>
        <Pencil className="w-3.5 h-3.5" /> Override priority
      </button>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const complaint = await overridePriority(c.id, { priority, reason: reason.trim() });
      setOpen(false);
      setReason("");
      onUpdated(complaint, { type: "success", text: `Priority set to ${complaint.priority}.` });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full space-y-2 rounded-xl p-3" style={{ backgroundColor: COLORS.bg }}>
      <div className="flex flex-wrap gap-2">
        {PRIORITIES.map((p) => (
          <button key={p} onClick={() => setPriority(p)} className="rounded-full transition" style={{ outline: priority === p ? `2px solid ${COLORS.primary}` : "none", outlineOffset: 2 }}>
            <PriorityBadge priority={p} />
          </button>
        ))}
      </div>
      <input className={inputClass} style={inputStyle} placeholder="Reason (required)" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      {error && <p className="text-xs" style={{ color: COLORS.critical }}>{error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => { setOpen(false); setError(""); }}>Cancel</Button>
        <Button disabled={!reason.trim() || priority === c.priority || busy} onClick={submit}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

export default ComplaintDetail;
