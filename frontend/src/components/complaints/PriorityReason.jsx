import React from "react";
import { COLORS } from "../../styles/tokens.js";
import { getFlair } from "../../data/config.js";

// "Flair default: Medium → raised to Critical by keyword: sparking"
export function priorityReason(c) {
  const flair = getFlair(c.flair);

  if (c.prioritySource === "admin") {
    return `Set to ${c.priority} by admin${c.priorityOverrideReason ? `: ${c.priorityOverrideReason}` : ""} (detected: ${c.detectedPriority})`;
  }
  if (c.prioritySource === "keyword") {
    return `Flair default: ${flair.defaultPriority} → raised to ${c.priority} by keyword: ${c.matchedKeywords.join(", ")}`;
  }
  return `Flair default for ${flair.label}: ${c.priority}`;
}

export function PriorityReason({ complaint }) {
  return <p className="text-xs" style={{ color: COLORS.slate }}>{priorityReason(complaint)}</p>;
}

export default PriorityReason;
