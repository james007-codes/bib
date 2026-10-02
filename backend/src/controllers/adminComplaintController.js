import mongoose from "mongoose";

import Complaint from "../models/Complaint.js";
import Worker from "../models/Worker.js";
import config, { flairById } from "../config/complaintConfig.js";
import { findRecurrence } from "../utils/recurrence.js";
import { serializeComplaint } from "../utils/serializeComplaint.js";
import { buildStats } from "../utils/complaintStats.js";
import { fileUrl, cleanupFiles } from "../middleware/uploadMiddleware.js";

const POPULATE = [
    { path: "reportedBy", select: "name email" },
    { path: "assignedWorker", select: "name" },
];

const OPEN_STATUSES = ["Assigned", "In Progress"];
const DAY_MS = 24 * 60 * 60 * 1000;

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function loadComplaint(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Complaint.findById(id);
}

async function respondWithDetail(res, complaint, extra = {}) {
    await complaint.populate(POPULATE);
    const recurrence = await findRecurrence({
        roomId: complaint.location.roomId,
        flair: complaint.flair,
        before: complaint.createdAt,
        excludeId: complaint._id,
    });
    return res.json({ success: true, complaint: serializeComplaint(complaint, recurrence), ...extra });
}

/* =========================
   GET /api/admin/complaints
   ?status=&priority=&flair=&buildingId=&roomId=&roomType=&recurring=true&search=&sort=priority|newest|oldest&page=1&limit=20
   Default sort: open first, then Critical → Low, then newest
========================= */
export async function listComplaints(req, res) {
    try {
        const q = req.query;
        const match = {};

        if (config.statuses.includes(q.status)) match.status = q.status;
        if (config.priorities.includes(q.priority)) match.priority = q.priority;
        if (flairById[q.flair]) match.flair = q.flair;
        if (typeof q.buildingId === "string" && q.buildingId) match["location.buildingId"] = q.buildingId;
        if (typeof q.roomId === "string" && q.roomId) match["location.roomId"] = q.roomId;
        if (config.roomTypes.includes(q.roomType)) match["location.roomType"] = q.roomType;
        if (q.recurring === "true") match.isRecurring = true;
        if (mongoose.isValidObjectId(q.workerId)) match.assignedWorker = new mongoose.Types.ObjectId(q.workerId);

        if (typeof q.search === "string" && q.search.trim()) {
            const rx = new RegExp(escapeRegex(q.search.trim().slice(0, 100)), "i");
            match.$or = [{ ticketNo: rx }, { title: rx }, { description: rx }, { "location.roomName": rx }];
        }

        const page = Math.max(1, parseInt(q.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 20));

        const sortStage =
            q.sort === "newest" ? { createdAt: -1 }
            : q.sort === "oldest" ? { createdAt: 1 }
            : { isResolved: 1, priorityRank: -1, createdAt: -1 };

        const [result] = await Complaint.aggregate([
            { $match: match },
            {
                $addFields: {
                    priorityRank: { $indexOfArray: [config.priorities, "$priority"] },
                    isResolved: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
                },
            },
            { $sort: sortStage },
            {
                $facet: {
                    items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                    total: [{ $count: "count" }],
                },
            },
        ]);

        const items = await Complaint.populate(result.items, POPULATE);

        return res.json({
            success: true,
            items: items.map((c) => serializeComplaint(c)),
            total: result.total[0]?.count ?? 0,
            page,
            limit,
        });
    } catch (error) {
        console.error("List complaints error:", error);
        return bad(res, "Failed to load complaints", 500);
    }
}

/* =========================
   GET /api/admin/complaints/:id   (full detail + live recurrence history)
========================= */
export async function getComplaintDetail(req, res) {
    try {
        const complaint = await loadComplaint(req.params.id);
        if (!complaint) return bad(res, "Complaint not found", 404);
        return respondWithDetail(res, complaint);
    } catch (error) {
        console.error("Complaint detail error:", error);
        return bad(res, "Failed to load complaint", 500);
    }
}

/* =========================
   POST /api/admin/complaints/:id/assign   { workerId }
   Reported → Assigned. Reassigning keeps the current status.
   Assigning an overloaded worker is allowed but returns a warning.
========================= */
export async function assignWorker(req, res) {
    try {
        const { workerId } = req.body;

        const complaint = await loadComplaint(req.params.id);
        if (!complaint) return bad(res, "Complaint not found", 404);
        if (complaint.status === "Resolved") return bad(res, "Resolved complaints cannot be reassigned");

        if (!mongoose.isValidObjectId(workerId)) return bad(res, "A valid workerId is required");
        const worker = await Worker.findById(workerId);
        if (!worker) return bad(res, "Worker not found", 404);
        if (worker.status === "Off Duty") return bad(res, `${worker.name} is off duty`);

        if (complaint.assignedWorker?.equals(worker._id)) {
            return bad(res, `Already assigned to ${worker.name}`);
        }

        const activeCount = await Complaint.countDocuments({
            assignedWorker: worker._id,
            status: { $in: OPEN_STATUSES },
        });

        const isReassign = !!complaint.assignedWorker;
        complaint.assignedWorker = worker._id;
        if (complaint.status === "Reported") complaint.status = "Assigned";

        complaint.updates.push({
            status: complaint.status,
            comment: isReassign ? `Reassigned to ${worker.name}.` : `Assigned to ${worker.name}.`,
            by: req.account.name,
        });

        await complaint.save();

        const warning =
            activeCount >= config.overloadThreshold
                ? `${worker.name} already has ${activeCount} active tasks.`
                : null;

        return respondWithDetail(res, complaint, { warning });
    } catch (error) {
        console.error("Assign worker error:", error);
        return bad(res, "Failed to assign worker", 500);
    }
}

/* =========================
   POST /api/admin/complaints/:id/updates   { status, comment }
   - Assigned → In Progress
   - Same status + comment = progress note visible to the user
   Reported → Assigned happens via /assign, → Resolved via /resolve
========================= */
export async function addStatusUpdate(req, res) {
    try {
        const { status, comment = "" } = req.body;
        const text = typeof comment === "string" ? comment.trim() : "";

        const complaint = await loadComplaint(req.params.id);
        if (!complaint) return bad(res, "Complaint not found", 404);

        if (!config.statuses.includes(status)) return bad(res, "Invalid status");

        if (status === complaint.status) {
            if (!text) return bad(res, "Add a comment to post an update without changing status");
            if (status === "Resolved") return bad(res, "Complaint is already resolved");
        } else if (status === "Assigned") {
            return bad(res, "Assign a worker to move a complaint to Assigned");
        } else if (status === "Resolved") {
            return bad(res, "Use the resolve action to resolve a complaint");
        } else if (status === "In Progress" && complaint.status !== "Assigned") {
            return bad(res, `Cannot move from ${complaint.status} to In Progress`);
        } else if (status === "Reported") {
            return bad(res, "Cannot move a complaint back to Reported");
        }

        complaint.status = status;
        complaint.updates.push({
            status,
            comment: text || `Status changed to ${status}.`,
            by: req.account.name,
        });

        await complaint.save();
        return respondWithDetail(res, complaint);
    } catch (error) {
        console.error("Status update error:", error);
        return bad(res, "Failed to update status", 500);
    }
}

/* =========================
   PATCH /api/admin/complaints/:id/priority   { priority, reason }
========================= */
export async function overridePriority(req, res) {
    try {
        const { priority, reason } = req.body;
        const text = typeof reason === "string" ? reason.trim() : "";

        const complaint = await loadComplaint(req.params.id);
        if (!complaint) return bad(res, "Complaint not found", 404);

        if (!config.priorities.includes(priority)) return bad(res, "Invalid priority");
        if (!text) return bad(res, "A reason is required to override priority");
        if (priority === complaint.priority) return bad(res, `Priority is already ${priority}`);

        const previous = complaint.priority;
        complaint.priority = priority;
        complaint.prioritySource = "admin";
        complaint.priorityOverrideReason = text;
        complaint.updates.push({
            status: complaint.status,
            comment: `Priority changed from ${previous} to ${priority}: ${text}`,
            by: req.account.name,
        });

        await complaint.save();
        return respondWithDetail(res, complaint);
    } catch (error) {
        console.error("Override priority error:", error);
        return bad(res, "Failed to update priority", 500);
    }
}

/* =========================
   POST /api/admin/complaints/:id/resolve   (multipart: note, afterPhoto?)
   In Progress → Resolved
========================= */
export async function resolveComplaint(req, res) {
    const files = req.file ? [req.file] : [];

    try {
        const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

        const complaint = await loadComplaint(req.params.id);
        if (!complaint) {
            cleanupFiles(files);
            return bad(res, "Complaint not found", 404);
        }
        if (complaint.status !== "In Progress") {
            cleanupFiles(files);
            return bad(res, `Only In Progress complaints can be resolved (current: ${complaint.status})`);
        }
        if (!note) {
            cleanupFiles(files);
            return bad(res, "A resolution note is required");
        }

        const resolvedAt = new Date();
        complaint.status = "Resolved";
        complaint.resolution = {
            note,
            afterPhoto: req.file ? { url: fileUrl(req, req.file), name: req.file.originalname } : null,
            resolvedAt,
        };
        complaint.updates.push({ status: "Resolved", comment: note, by: req.account.name, at: resolvedAt });

        await complaint.save();
        return respondWithDetail(res, complaint);
    } catch (error) {
        cleanupFiles(files);
        console.error("Resolve complaint error:", error);
        return bad(res, "Failed to resolve complaint", 500);
    }
}

/* =========================
   GET /api/admin/workers?flair=
   With ?flair, only workers skilled for that flair's group, sorted by lowest load
   (use this for the assign dropdown).
========================= */
export async function listWorkers(req, res) {
    try {
        const filter = {};
        const flair = flairById[req.query.flair];
        if (flair) filter.skills = flair.group;

        const workers = await Worker.find(filter).lean();
        const weekAgo = new Date(Date.now() - 7 * DAY_MS);

        const loads = await Complaint.aggregate([
            { $match: { assignedWorker: { $in: workers.map((w) => w._id) } } },
            {
                $group: {
                    _id: "$assignedWorker",
                    activeCount: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES] }, 1, 0] } },
                    resolvedThisWeek: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$status", "Resolved"] }, { $gte: ["$resolution.resolvedAt", weekAgo] }] },
                                1,
                                0,
                            ],
                        },
                    },
                    critical: { $sum: { $cond: [{ $and: [{ $in: ["$status", OPEN_STATUSES] }, { $eq: ["$priority", "Critical"] }] }, 1, 0] } },
                    high: { $sum: { $cond: [{ $and: [{ $in: ["$status", OPEN_STATUSES] }, { $eq: ["$priority", "High"] }] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $and: [{ $in: ["$status", OPEN_STATUSES] }, { $eq: ["$priority", "Medium"] }] }, 1, 0] } },
                    low: { $sum: { $cond: [{ $and: [{ $in: ["$status", OPEN_STATUSES] }, { $eq: ["$priority", "Low"] }] }, 1, 0] } },
                },
            },
        ]);
        const loadById = new Map(loads.map((l) => [l._id.toString(), l]));

        const result = workers
            .map((w) => {
                const l = loadById.get(w._id.toString());
                const activeCount = l?.activeCount ?? 0;
                return {
                    id: w._id.toString(),
                    name: w.name,
                    phone: w.phone,
                    skills: w.skills,
                    status: w.status,
                    activeCount,
                    resolvedThisWeek: l?.resolvedThisWeek ?? 0,
                    byPriority: {
                        Low: l?.low ?? 0,
                        Medium: l?.medium ?? 0,
                        High: l?.high ?? 0,
                        Critical: l?.critical ?? 0,
                    },
                    overloaded: activeCount >= config.overloadThreshold,
                };
            })
            .sort((a, b) => {
                const offA = a.status === "Off Duty" ? 1 : 0;
                const offB = b.status === "Off Duty" ? 1 : 0;
                return offA - offB || a.activeCount - b.activeCount;
            });

        return res.json({ success: true, workers: result });
    } catch (error) {
        console.error("List workers error:", error);
        return bad(res, "Failed to load workers", 500);
    }
}

/* =========================
   POST /api/admin/workers   { name, phone?, skills: groupId[], status? }
========================= */
export async function createWorker(req, res) {
    try {
        const { name, phone = "", skills = [], status } = req.body;
        if (!name?.trim()) return bad(res, "Worker name is required");

        const validGroups = config.flairGroups.map((g) => g.id);
        const cleanSkills = Array.isArray(skills) ? skills.filter((s) => validGroups.includes(s)) : [];

        const worker = await Worker.create({
            name: name.trim(),
            phone,
            skills: cleanSkills,
            ...(["Available", "Busy", "Off Duty"].includes(status) && { status }),
        });

        return res.status(201).json({
            success: true,
            worker: { id: worker._id.toString(), name: worker.name, phone: worker.phone, skills: worker.skills, status: worker.status },
        });
    } catch (error) {
        console.error("Create worker error:", error);
        return bad(res, "Failed to create worker", 500);
    }
}

/* =========================
   GET /api/admin/stats?range=7d|30d|all
========================= */
export async function getStats(req, res) {
    try {
        const days = { "7d": 7, "30d": 30 }[req.query.range];
        const filter = days ? { createdAt: { $gte: new Date(Date.now() - days * DAY_MS) } } : {};

        const complaints = await Complaint.find(filter)
            .select("flair flairGroup location priority status isRecurring createdAt resolution.resolvedAt")
            .lean();

        return res.json({ success: true, range: days ? req.query.range : "all", ...buildStats(complaints) });
    } catch (error) {
        console.error("Stats error:", error);
        return bad(res, "Failed to load stats", 500);
    }
}
