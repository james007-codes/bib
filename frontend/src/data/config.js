// Single source of truth shared with the backend: flairs, keywords, locations, workflow.
// Editing backend/src/config/complaintConfig.json updates both sides.
import config from "../../../backend/src/config/complaintConfig.json";

export const PRIORITIES = config.priorities;
export const STATUSES = config.statuses;
export const RECURRENCE_WINDOW_DAYS = config.recurrenceWindowDays;
export const FLAIR_GROUPS = config.flairGroups;
export const FLAIRS = config.flairs;
export const ESCALATION_KEYWORDS = config.escalationKeywords;
export const ROOM_TYPES = config.roomTypes;
export const BUILDINGS = config.buildings;

export const flairById = Object.fromEntries(FLAIRS.map((f) => [f.id, f]));
export const groupById = Object.fromEntries(FLAIR_GROUPS.map((g) => [g.id, g]));

export const getFlair = (id) =>
  flairById[id] || { id, label: id || "Unknown", group: "campus", icon: "CircleHelp", color: "#64748B", defaultPriority: "Low" };

export const flairsByGroup = FLAIR_GROUPS.map((g) => ({
  ...g,
  flairs: FLAIRS.filter((f) => f.group === g.id),
}));

export default config;
