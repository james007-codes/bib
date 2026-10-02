import mongoose from "mongoose";
import config from "../config/complaintConfig.js";

const groupIds = config.flairGroups.map((g) => g.id);

// Maintenance workers are records the admin assigns — they do not log in.
const workerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true, default: "" },
        skills: [{ type: String, enum: groupIds }],
        status: {
            type: String,
            enum: ["Available", "Busy", "Off Duty"],
            default: "Available",
        },
    },
    { timestamps: true }
);

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;
