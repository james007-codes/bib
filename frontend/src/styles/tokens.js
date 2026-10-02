/* ============================================================================
   DESIGN TOKENS — FixFlow (campus maintenance)
   ========================================================================== */

export const COLORS = {
  primary: "#4338CA", // deep indigo
  primaryDark: "#3730A3",
  primarySoft: "#EEF2FF",
  blue: "#2563EB",
  blueSoft: "#EFF6FF",
  success: "#059669",
  successSoft: "#ECFDF5",
  warning: "#D97706",
  warningSoft: "#FFFBEB",
  critical: "#DC2626",
  criticalSoft: "#FEF2F2",
  gray: "#64748B",
  graySoft: "#F1F5F9",
  ink: "#0F172A",
  slate: "#64748B",
  line: "#E2E8F0",
  bg: "#F8FAFC",
};

// Priority colors: Low = gray, Medium = blue, High = amber, Critical = red
export const PRIORITY_COLORS = {
  Low: { fg: COLORS.gray, bg: COLORS.graySoft },
  Medium: { fg: COLORS.blue, bg: COLORS.blueSoft },
  High: { fg: COLORS.warning, bg: COLORS.warningSoft },
  Critical: { fg: COLORS.critical, bg: COLORS.criticalSoft },
};

export const STATUS_COLORS = {
  Reported: { fg: COLORS.gray, bg: COLORS.graySoft },
  Assigned: { fg: COLORS.primary, bg: COLORS.primarySoft },
  "In Progress": { fg: COLORS.warning, bg: COLORS.warningSoft },
  Resolved: { fg: COLORS.success, bg: COLORS.successSoft },
};
