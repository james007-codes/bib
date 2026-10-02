/**
 * Demo data seeder.
 *
 *   node src/scripts/seed.js                  -> adds demo complaints (reported by the first user in the DB)
 *   node src/scripts/seed.js you@mail.com     -> complaints reported by that user
 *   node src/scripts/seed.js --reset          -> WIPES complaints and the ticket counter first
 *
 * Register at least one normal user in the app before running this.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Counter, { nextSequence } from "../models/Counter.js";
import config, { flairById, resolveLocation } from "../config/complaintConfig.js";
import { detectPriority } from "../utils/priority.js";

dotenv.config();

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const args = process.argv.slice(2);
const reset = args.includes("--reset");
const email = args.find((a) => a.includes("@"));

// Deterministic pseudo-random so every seed run looks the same
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// [daysAgo, roomId, flair, title, description, finalStatus]
const SCRIPTED = [
    // Demo story: LH-204 electrical issue already reported twice this month
    [24, "lh-204", "electrical-hazard", "Switchboard sparking near door", "The switchboard next to the door made sparks when the fan switch was turned on.", "Resolved"],
    [9, "lh-204", "electrical-hazard", "Exposed wire behind projector socket", "Wire insulation is torn and copper is visible behind the projector socket.", "In Progress"],

    // Tap that leaks every month
    [85, "a-1-wr", "plumbing", "Tap leaking in washroom", "Second tap from the left keeps dripping.", "Resolved"],
    [57, "a-1-wr", "plumbing", "Same tap leaking again", "The tap that was fixed last month is leaking again.", "Resolved"],
    [29, "a-1-wr", "plumbing", "Tap leak back again", "Water dripping all day from the same tap.", "Resolved"],
    [3, "a-1-wr", "plumbing", "Washroom tap leaking (again)", "Third time this tap is leaking. Floor stays wet.", "Escalated"],

    // Computer Lab 3: most complained-about room
    [27, "cl-3", "computer", "PC 12 not booting", "PC 12 shows a black screen after the BIOS logo.", "Resolved"],
    [20, "cl-3", "computer", "PC 7 keyboard not working", "Several keys on PC 7 keyboard are dead.", "Resolved"],
    [14, "cl-3", "network", "No internet on row 3", "All PCs on row 3 show no network connection.", "Resolved"],
    [10, "cl-3", "computer", "PC 12 not booting again", "Same PC 12 issue during practicals.", "In Progress"],
    [6, "cl-3", "computer", "Mouse missing at PC 4", "PC 4 has no mouse.", "Reported"],
    [2, "cl-3", "ac", "AC not cooling in lab", "Lab is very hot, AC is running but not cooling.", "Reported"],

    // Canteen
    [18, "main-canteen", "canteen-hygiene", "Cockroaches near food counter", "Saw cockroaches near the samosa tray.", "Resolved"],
    [5, "main-canteen", "canteen-hygiene", "Dirty plates being served", "Plates have food stains on them.", "In Progress"],
    [12, "cb-water", "water-filter", "Water filter giving warm water", "Cooler near the canteen is giving warm water.", "Resolved"],
    [1, "cb-water", "water-filter", "Water filter not working", "No water coming from the filter at all. no water since morning.", "Reported"],
];

const FILLERS = [
    ["lh-101", "fan", "Fan not working", "Ceiling fan near the window does not start."],
    ["lh-102", "projector", "Projector flickering", "Projector display keeps flickering during lectures."],
    ["lh-201", "smart-board", "Smart board not responding", "Touch input on the smart board is not working."],
    ["lh-205", "furniture", "Broken bench in last row", "Bench in the last row has a broken plank."],
    ["lh-301", "smart-board", "Smart board pen not working", "The stylus for the smart board does not register."],
    ["lh-401", "lights", "Tube light not working", "Two tube lights in the front are off."],
    ["seminar-1", "ac", "AC leaking water", "AC unit is dripping water on the chairs."],
    ["el-1", "lab-equipment", "Oscilloscope faulty", "Oscilloscope on bench 3 gives no display."],
    ["lib-reading", "fan", "Fan making noise", "Fan makes a loud rattling noise."],
    ["lib-digital", "network", "Wi-Fi very slow", "Wi-Fi in the digital library is extremely slow."],
    ["b-2-wr", "washroom-hygiene", "Washroom not cleaned", "Washroom has not been cleaned since morning."],
    ["c-2-wr", "plumbing", "Flush not working", "Flush in the second cubicle is broken."],
    ["a-0-lobby", "lift", "Lift stuck on 2nd floor", "The lift is stuck between floors."],
    ["a-2-corridor", "structural", "Crack in corridor wall", "A long crack has appeared on the corridor wall."],
    ["main-aud", "fire-safety", "Fire extinguisher expired", "Extinguisher near the stage shows an expired date."],
    ["canteen-kitchen", "canteen-equipment", "Mixer not working", "The canteen mixer has stopped working."],
    ["lh-101", "cleanliness", "Classroom dustbin overflowing", "Dustbin has not been emptied."],
    ["lh-204", "fan", "Fan regulator broken", "Fan only runs at full speed."],
    ["cl-1", "computer", "PC 3 very slow", "PC 3 takes 10 minutes to boot."],
    ["a-1-staff", "ac", "Staff room AC not working", "AC does not turn on."],
    ["lh-102", "fan", "Fan wobbling", "Fan is wobbling dangerously."],
    ["main-canteen", "canteen-food", "Stale food served", "Vada pav tasted stale."],
    ["lh-301", "projector", "Projector HDMI not working", "Laptop does not connect via HDMI."],
    ["c-1-staff", "power-outage", "No power in staff room", "No power in the staff room since 10 am."],
];

const findRoom = (roomId) => {
    for (const b of config.buildings)
        for (const f of b.floors)
            for (const r of f.rooms)
                if (r.id === roomId) return resolveLocation(b.id, f.id, r.id);
    throw new Error(`Unknown room ${roomId}`);
};

async function main() {
    await mongoose.connect(process.env.mongoUri || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    if (reset) {
        await Promise.all([Complaint.deleteMany({}), Counter.deleteMany({})]);
        console.log("Reset: complaints and counter cleared");
    }

    const reporter = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne();
    if (!reporter) throw new Error("No user found. Register a normal user in the app first.");

    const fillerStatuses = ["Resolved", "Resolved", "Resolved", "In Progress", "Escalated", "Reported"];
    const rows = [
        ...SCRIPTED,
        ...FILLERS.map(([room, flair, title, desc]) => [
            Math.floor(rand() * 60) + 1, room, flair, title, desc, pick(fillerStatuses),
        ]),
    ].sort((a, b) => b[0] - a[0]); // oldest first, so recurrence counts build up correctly

    const now = Date.now();
    const created = [];

    for (const [daysAgo, roomId, flair, title, description, finalStatus] of rows) {
        const createdAt = new Date(now - daysAgo * DAY - Math.floor(rand() * 8) * HOUR);
        const location = findRoom(roomId);
        const detected = detectPriority(flair, title, description);

        const prior = created.filter(
            (c) =>
                c.location.roomId === roomId &&
                c.flair === flair &&
                createdAt - c.createdAt <= config.recurrenceWindowDays * DAY
        );

        const updates = [{ status: "Reported", comment: "Complaint submitted.", by: "System", at: createdAt }];
        let resolution = null;
        let t = createdAt.getTime();

        if (finalStatus !== "Reported") {
            t += 3 * HOUR;
            updates.push({ status: "In Progress", comment: "Maintenance team is looking into it.", by: "Admin", at: new Date(t) });
        }
        if (finalStatus === "Escalated") {
            t += 20 * HOUR;
            updates.push({ status: "Escalated", comment: "Needs a vendor visit — escalated to the administration office.", by: "Admin", at: new Date(t) });
        }
        if (finalStatus === "Resolved") {
            t += (6 + Math.floor(rand() * 40)) * HOUR;
            const resolvedAt = new Date(Math.min(t, now - HOUR));
            resolution = { note: "Issue fixed and verified.", afterPhoto: null, resolvedAt };
            updates.push({ status: "Resolved", comment: "Issue fixed and verified.", by: "Admin", at: resolvedAt });
        }

        const doc = new Complaint({
            ticketNo: `MT-${await nextSequence("complaint")}`,
            flair,
            flairGroup: flairById[flair].group,
            location: { ...location, spot: null },
            title,
            description,
            photos: [{ url: `https://placehold.co/800x600?text=${encodeURIComponent(title)}`, name: "photo.jpg" }],
            priority: detected.priority,
            prioritySource: detected.source,
            detectedPriority: detected.priority,
            matchedKeywords: detected.matchedKeywords,
            status: finalStatus,
            reportedBy: reporter._id,
            reporterType: rand() > 0.8 ? "Teacher" : "Student",
            reporterDepartment: ["comp", "it", "ece", "cse"][Math.floor(rand() * 4)],
            isRecurring: prior.length > 0,
            recurrenceCount: prior.length,
            updates,
            resolution,
        });

        const err = doc.validateSync();
        if (err) throw err;

        // Raw insert so the back-dated createdAt is kept (Mongoose would overwrite it)
        const raw = doc.toObject();
        raw.createdAt = createdAt;
        raw.updatedAt = updates[updates.length - 1].at;
        await Complaint.collection.insertOne(raw);

        created.push({ ...raw });
    }

    console.log(`Created ${created.length} complaints reported by ${reporter.email}`);
    console.log("Demo: report 'switchboard sparking' in B Block > 2nd Floor > LH-204 with the Electrical Hazard flair.");
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error("Seed failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
});
