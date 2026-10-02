import config, { flairById, PRIORITY_RANK } from "../config/complaintConfig.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Pre-compile whole-word / whole-phrase matchers, e.g. "fire" must not match "firewall"
const keywordMatchers = Object.entries(config.escalationKeywords).flatMap(
    ([level, words]) =>
        words.map((word) => ({
            level,
            word,
            regex: new RegExp(`\\b${escapeRegex(word.toLowerCase()).replace(/\s+/g, "\\s+")}\\b`, "i"),
        }))
);

/**
 * Priority = the higher of (flair default) and (highest escalation keyword matched).
 * Keywords can only RAISE priority, never lower it.
 */
export function detectPriority(flairId, ...texts) {
    const flair = flairById[flairId];
    if (!flair) return null;

    const text = texts.filter(Boolean).join(" ");

    const matched = keywordMatchers.filter((m) => m.regex.test(text));

    let keywordLevel = null;
    for (const m of matched) {
        if (keywordLevel === null || PRIORITY_RANK[m.level] > PRIORITY_RANK[keywordLevel]) {
            keywordLevel = m.level;
        }
    }

    const raised =
        keywordLevel !== null &&
        PRIORITY_RANK[keywordLevel] > PRIORITY_RANK[flair.defaultPriority];

    // Only report keywords at the winning level (e.g. "sparking", not also "stuck")
    const matchedKeywords = raised
        ? [...new Set(matched.filter((m) => m.level === keywordLevel).map((m) => m.word))]
        : [];

    return {
        priority: raised ? keywordLevel : flair.defaultPriority,
        source: raised ? "keyword" : "flair",
        flairDefault: flair.defaultPriority,
        matchedKeywords,
    };
}
