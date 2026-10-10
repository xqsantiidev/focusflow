import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/* ── Field limits ──────────────────────────────────────────── */
const MAX_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 500;
const MAX_EVENTS_PER_DAY = 100;
const MAX_TEMPLATES = 50;
const MAX_REPEAT_DAYS = 7;
const MAX_CATEGORY_LENGTH = 40;
const MAX_COLORS = 64;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
const dayKeyRegex = /^\d{4}-\d{2}-\d{2}$/;

/* ── Validators ────────────────────────────────────────────── */
const timeString = v.string();
const colorString = v.string();

const eventArgs = {
  eventId: v.number(),
  day: v.string(),
  title: v.string(),
  start: timeString,
  end: timeString,
  category: v.string(),
  note: v.string(),
  repeat: v.array(v.number()),
  color: v.optional(colorString),
};
const templateArgs = {
  templateId: v.number(),
  title: v.string(),
  start: timeString,
  end: v.string(),
  category: v.string(),
  note: v.string(),
  color: v.optional(colorString),
};

/* category name -> hex color string */
export const paletteValidator = v.record(v.string(), colorString);

/* ── Shared return shapes ──────────────────────────────────── */
const eventDoc = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  userId: v.id("users"),
  eventId: v.number(),
  day: v.string(),
  title: v.string(),
  start: v.string(),
  end: v.string(),
  category: v.string(),
  note: v.string(),
  repeat: v.array(v.number()),
  color: v.optional(v.string()),
});
const templateDoc = v.object({
  _id: v.id("templates"),
  _creationTime: v.number(),
  userId: v.id("users"),
  templateId: v.number(),
  title: v.string(),
  start: v.string(),
  end: v.string(),
  category: v.string(),
  note: v.string(),
  color: v.optional(v.string()),
});

/**
 * Helper to validate a day-YYYY-MM-DD string. Throws when malformed.
 */
function checkDayKey(day: string) {
  if (!dayKeyRegex.test(day)) throw new Error("Day must be formatted YYYY-MM-DD.");
}

/**
 * Validates an event's fields server-side (client checks are only cosmetic).
 */
function checkEventFields(event: { title: string; start: string; end: string; category: string; note: string; repeat: unknown[]; color?: string }) {
  if (event.title.length > MAX_TITLE_LENGTH) throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (event.note.length > MAX_NOTE_LENGTH) throw new Error(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
  if (event.category.length > MAX_CATEGORY_LENGTH) throw new Error(`Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`);
  if (!timeRegex.test(event.start)) throw new Error(`Invalid start time, expected HH:MM (00:00-23:59), got ${event.start}`);
  if (!timeRegex.test(event.end)) throw new Error(`Invalid end time, expected HH:MM (00:00-23:59), got ${event.end}`);
  if (Number(event.start.slice(0, 2) + event.start.slice(3)) > Number(event.end.slice(0, 2) + event.end.slice(3))) {
    throw new Error("Start time must not be after end time.");
  }
  if (event.repeat.length > MAX_REPEAT_DAYS) throw new Error("Repeat can cover at most 7 days of the week.");
  for (const r of event.repeat) {
    if (typeof r !== "number" || r < 0 || r > 6 || !Number.isInteger(r)) throw new Error("Repeat days must be integers 0-6.");
  }
  if (event.color !== undefined && !hexColorRegex.test(event.color)) {
    throw new Error(`Event color must be a #RRGGBB hex string, got ${event.color}`);
  }
}

function checkTemplateFields(template: { title: string; start: string; end: string; category: string; note: string; color?: string }) {
  if (template.title.length > MAX_TITLE_LENGTH) throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (template.note.length > MAX_NOTE_LENGTH) throw new Error(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
  if (template.category.length > MAX_CATEGORY_LENGTH) throw new Error(`Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`);
  if (!timeRegex.test(template.start)) throw new Error(`Invalid start time, expected HH:MM (00:00-23:59), got ${template.start}`);
  if (!timeRegex.test(template.end)) throw new Error(`Invalid end time, expected HH:MM (00:00-23:59), got ${template.end}`);
  if (template.color !== undefined && !hexColorRegex.test(template.color)) {
    throw new Error(`Template color must be a #RRGGBB hex string, got ${template.color}`);
  }
}

/**
 * Enforces a per-user write rate limit, backed by a small `rateLimits` table.
 * Sliding hourly window; stricter for anonymous/guest sessions to cap abuse.
 */
async function enforceRateLimit(ctx: any, uid: string) {
  const user = await ctx.db.get(uid);
  const anonymous = user?.isAnonymous === true;
  const limit = anonymous ? 60 : 480;      /* writes per hour */
  const windowMs = 60 * 60 * 1000;         /* 1h */
  const now = Date.now();

  const recent = await ctx.db.query("rateLimits")
    .withIndex("by_user_session", (q: any) => q.eq("userId", uid))
    .order("desc")
    .collect();

  const windowRows = recent.filter((r: any) => now - r._creationTime < windowMs);
  if (windowRows.length >= limit) {
    throw new Error("You're making changes very quickly. Please wait a moment and try again.");
  }
  /* fire-and-forget write; will get cleaned up by the pruning below */
  await ctx.db.insert("rateLimits", { userId: uid, anonymous, purpose: "write" });

  /* Occasionally prune stale rows to keep the table small. */
  if (recent.length > 400) {
    for (const row of recent.filter((r: any) => now - r._creationTime >= windowMs)) {
      await ctx.db.delete(row._id);
    }
  }
}

async function userId(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Authentication required");
  return id;
}

type EventInput = {
  eventId: number; day: string; title: string; start: string; end: string;
  category: string; note: string; repeat: number[]; color?: string;
};

export const listEvents = query({
  args: { day: v.string() },
  returns: v.array(eventDoc),
  handler: async (ctx, { day }) => {
    const uid = await userId(ctx);
    checkDayKey(day);
    return await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
  },
});

export const upsertEvent = mutation({
  args: eventArgs,
  returns: v.null(),
  handler: async (ctx, event: EventInput) => {
    const uid = await userId(ctx);
    checkDayKey(event.day);
    checkEventFields(event);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", event.day)).collect();
    if (existing.length >= MAX_EVENTS_PER_DAY) {
      throw new Error(`A day can hold at most ${MAX_EVENTS_PER_DAY} events.`);
    }
    const row = existing.find(item => item.eventId === event.eventId);
    if (row) await ctx.db.patch(row._id, { ...event, userId: uid });
    else await ctx.db.insert("events", { ...event, userId: uid });
    return null;
  },
});

export const deleteEvent = mutation({
  args: { day: v.string(), eventId: v.number() },
  returns: v.null(),
  handler: async (ctx, { day, eventId }) => {
    const uid = await userId(ctx);
    checkDayKey(day);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
    for (const row of existing.filter(item => item.eventId === eventId)) await ctx.db.delete(row._id);
    return null;
  },
});

export const replaceDayEvents = mutation({
  args: { day: v.string(), events: v.array(v.object(eventArgs)) },
  returns: v.null(),
  handler: async (ctx, { day, events }) => {
    const uid = await userId(ctx);
    checkDayKey(day);
    if (events.length > MAX_EVENTS_PER_DAY) {
      throw new Error(`A day can hold at most ${MAX_EVENTS_PER_DAY} events.`);
    }
    for (const event of events) checkEventFields(event);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const event of events) await ctx.db.insert("events", { ...event, userId: uid, day });
    return null;
  },
});

export const listTemplates = query({
  args: {},
  returns: v.array(templateDoc),
  handler: async ctx => {
    const uid = await userId(ctx);
    return await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
  },
});

export const replaceTemplates = mutation({
  args: { templates: v.array(v.object(templateArgs)) },
  returns: v.null(),
  handler: async (ctx, { templates }) => {
    const uid = await userId(ctx);
    if (templates.length > MAX_TEMPLATES) {
      throw new Error(`You can have at most ${MAX_TEMPLATES} templates.`);
    }
    for (const template of templates) checkTemplateFields(template);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const template of templates) await ctx.db.insert("templates", { ...template, userId: uid });
    return null;
  },
});

export const upsertTemplate = mutation({
  args: templateArgs,
  returns: v.null(),
  handler: async (ctx, template) => {
    const uid = await userId(ctx);
    checkTemplateFields(template);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
    if (existing.length >= MAX_TEMPLATES) {
      throw new Error(`You can have at most ${MAX_TEMPLATES} templates.`);
    }
    const row = existing.find(item => item.templateId === template.templateId);
    if (row) await ctx.db.patch(row._id, { ...template, userId: uid });
    else await ctx.db.insert("templates", { ...template, userId: uid });
    return null;
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.number() },
  returns: v.null(),
  handler: async (ctx, { templateId }) => {
    const uid = await userId(ctx);
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
    for (const row of existing.filter(item => item.templateId === templateId)) await ctx.db.delete(row._id);
    return null;
  },
});

export const getPalette = query({
  args: {},
  returns: v.union(paletteValidator, v.null()),
  handler: async ctx => {
    const uid = await userId(ctx);
    const row = await ctx.db.query("palette").withIndex("by_user", q => q.eq("userId", uid)).first();
    if (!row) return null;
    return (row.colors ?? {}) as Record<string, string>;
  },
});

export const setPalette = mutation({
  args: { colors: paletteValidator },
  returns: v.null(),
  handler: async (ctx, { colors }) => {
    const uid = await userId(ctx);
    /* Validate palette entries: non-empty name, valid hex, bounded size. */
    const entries = Object.entries(colors);
    if (entries.length > MAX_COLORS) throw new Error(`Palette can contain at most ${MAX_COLORS} categories.`);
    for (const [name, color] of entries) {
      if (name.length === 0 || name.length > MAX_CATEGORY_LENGTH) {
        throw new Error(`Category name must be 1-${MAX_CATEGORY_LENGTH} characters, got "${name}".`);
      }
      if (!hexColorRegex.test(color)) {
        throw new Error(`Color for category "${name}" must be a #RRGGBB hex string, got ${color}.`);
      }
    }
    await enforceRateLimit(ctx, uid);
    const existing = await ctx.db.query("palette").withIndex("by_user", q => q.eq("userId", uid)).first();
    if (existing) await ctx.db.patch(existing._id, { colors }); else await ctx.db.insert("palette", { userId: uid, colors });
    return null;
  },
});

export const listEventsForWeek = query({
  args: { startDay: v.string(), endDay: v.string() },
  returns: v.array(eventDoc),
  handler: async (ctx, { startDay, endDay }) => {
    const uid = await userId(ctx);
    checkDayKey(startDay);
    checkDayKey(endDay);
    return await ctx.db
      .query("events")
      .withIndex("by_user_day", q => q.eq("userId", uid).gte("day", startDay).lt("day", endDay))
      .collect();
  },
});

export const setOnboarded = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const uid = await userId(ctx);
    await ctx.db.patch(uid, { onboarded: true });
    return null;
  },
});
