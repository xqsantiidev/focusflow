/**
 * Natural-language quick-add parser for Thyme.
 *
 * Handles inputs like:
 *   "gym 6-7pm"
 *   "chem study tomorrow 3-4"
 *   "lunch 12:00-1pm"
 *   "meeting 2:30-3:30pm"
 *   "workout today 6-7"
 *   "yoga 7am-8am"
 *   "coffee with sarah 3-3:30pm"
 */

type ParsedEvent = {
  title: string;
  start: string;
  end: string;
  category: string;
  targetDate: Date;
};

/** Convert 12h hour (1-12) + optional am/pm to 24h hour (0-23) */
function to24(h: number, meridian: string | null): number {
  if (meridian) {
    const m = meridian.toLowerCase();
    if (m === "am") return h === 12 ? 0 : h;
    if (m === "pm") return h === 12 ? 12 : h + 12;
  }
  // No meridian specified — guess based on context
  if (h >= 1 && h <= 5) return h + 12; // "3-4" → 3pm-4pm (most college activities are afternoon)
  return h; // 6-12 stays as-is (6am-12pm)
}

/** Convert a number of minutes to "HH:MM" string */
function minToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Map common keywords to category names */
function guessCategory(title: string, paletteKeys: string[]): string {
  const lower = title.toLowerCase();
  const mapping: Record<string, string[]> = {
    gym: ["Health", "health", "gym", "workout", "exercise", "run", "running", "lift", "cardio", "yoga", "stretch", "sports"],
    study: ["Study", "study", "studying", "review", "revision", "practice", "homework", "hw", "reading", "read", "notes"],
    class: ["Class", "class", "lecture", "lab", "tutorial", "seminar", "recitation", "recitation", "pre-calc", "calculus", "chem", "chemistry", "bio", "biology", "physics", "math", "english", "history", "government", "psych", "econ", "cs", "computer"],
    life: ["Life", "life", "eat", "lunch", "dinner", "breakfast", "brunch", "coffee", "meal", "snack", "cook", "groceries", "errand", "errands", "clean", "laundry", "shower", "nap", "rest", "relax"],
    commute: ["Commute", "commute", "drive", "bus", "walk", "bike", "transit", "parking", "travel"],
    free: ["Free", "free", "chill", "hang", "hangout", "game", "gaming", "movie", "show", "tv", "music", "podcast", "walk", "friend", "friends", "party", "social"],
  };

  for (const [cat, keywords] of Object.entries(mapping)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // Return the palette key that best matches (case-insensitive)
        const match = paletteKeys.find(k => k.toLowerCase() === cat);
        if (match) return match;
        // Partial match
        const partial = paletteKeys.find(k => k.toLowerCase().startsWith(cat.slice(0, 3)));
        if (partial) return partial;
      }
    }
  }

  // Fallback: try to match any palette key against the title
  for (const k of paletteKeys) {
    if (lower.includes(k.toLowerCase())) return k;
  }

  // Default to first palette key or "Study"
  return paletteKeys[0] || "Study";
}

/**
 * Parse a natural-language quick-add string.
 *
 * Supported patterns:
 *   - "title H-Hpm" or "title H-H am/pm"
 *   - "title H:MM-H:MMpm"
 *   - "title Hpm-Hpm"
 *   - "title today/tomorrow/yesterday H-H"
 *   - "title next monday H-H"
 *
 * Returns null if the string can't be parsed.
 */
export function parseQuickAdd(
  input: string,
  paletteKeys: string[],
  currentDate: Date = new Date(),
): ParsedEvent | null {
  const raw = input.trim();
  if (!raw) return null;

  // --- Extract optional date modifier ---
  let targetDate = new Date(currentDate);
  let cleaned = raw;

  const datePatterns: [RegExp, (d: Date) => Date][] = [
    [/\btomorrow\b/i, d => { const r = new Date(d); r.setDate(r.getDate() + 1); return r; }],
    [/\byesterday\b/i, d => { const r = new Date(d); r.setDate(r.getDate() - 1); return r; }],
    [/\btoday\b/i, d => d],
  ];

  // Handle 'next weekday' separately since it needs a capture group
  const nextDayMatch = cleaned.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (nextDayMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const target = days.indexOf(nextDayMatch[1]!.toLowerCase());
    const diff = ((target - targetDate.getDay()) + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + diff);
    cleaned = cleaned.replace(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, "").trim();
  }

  for (const [re, fn] of datePatterns) {
    const m = cleaned.match(re);
    if (m) {
      targetDate = fn(targetDate);
      cleaned = cleaned.replace(re, "").trim();
    }
  }

  // --- Extract time range ---
  // Patterns: "6-7pm", "6:00-7:00pm", "6pm-7pm", "6:30-7", "12-1pm"
  const timeRangeRe = /(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i;
  const timeMatch = cleaned.match(timeRangeRe);

  let start = "09:00";
  let end = "10:00";
  let titlePart = cleaned;

  if (timeMatch) {
    const [, sHr, sMeridian, eHr, eMeridian] = timeMatch;

    // Parse start time
    const sHasColon = sHr!.includes(":");
    let sHour: number, sMin: number;
    if (sHasColon) {
      const [h, m] = sHr!.split(":").map(Number);
      sHour = h!; sMin = m!;
    } else {
      sHour = Number(sHr);
      // Guess minutes: if meridian exists, :00; otherwise treat as hour-only
      sMin = sMeridian ? 0 : 0;
    }
    // If only one meridian applies to start (no end meridian), use it for start too
    const s24 = to24(sHour, sMeridian || eMeridian || null);
    start = minToTime(s24 * 60 + sMin);

    // Parse end time
    const eHasColon = eHr!.includes(":");
    let eHour: number, eMin: number;
    if (eHasColon) {
      const [h, m] = eHr!.split(":").map(Number);
      eHour = h!; eMin = m!;
    } else {
      eHour = Number(eHr);
      eMin = eMeridian ? 0 : 0;
    }
    const e24 = to24(eHour, eMeridian || null);
    end = minToTime(e24 * 60 + eMin);

    // If end <= start, it probably means next day wrap (e.g. "11pm-1am") — just add 12h to end
    if (e24 * 60 + eMin <= s24 * 60 + sMin && !eMeridian && !sMeridian) {
      // Both without meridian: if end is less than start, end is likely pm
      const e24pm = to24(eHour, "pm");
      if (e24pm * 60 + eMin > s24 * 60 + sMin) {
        end = minToTime(e24pm * 60 + eMin);
      }
    }

    // Remove the time portion from the title
    titlePart = cleaned.slice(0, timeMatch.index).trim();
  }

  // --- Clean up the title ---
  // Remove trailing connector words that might cling to the last word
  titlePart = titlePart.replace(/\s*(with|at|in|on|for)\s*$/i, "").trim();

  // If no title was given, use a fallback
  if (!titlePart) {
    // Try to guess from the time context
    const hour = parseInt(start.split(":")[0]!, 10);
    if (hour >= 6 && hour < 9) titlePart = "Morning routine";
    else if (hour >= 11 && hour < 13) titlePart = "Lunch";
    else if (hour >= 17 && hour < 20) titlePart = "Evening";
    else titlePart = "Event";
  }

  // Capitalize title words
  titlePart = titlePart.replace(/\b\w/g, c => c.toUpperCase());

  // --- Guess category ---
  const category = guessCategory(titlePart, paletteKeys);

  return { title: titlePart, start, end, category, targetDate };
}
