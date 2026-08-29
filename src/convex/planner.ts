import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const eventArgs = {
  eventId: v.number(), day: v.string(), title: v.string(), start: v.string(), end: v.string(),
  category: v.string(), note: v.string(), repeat: v.array(v.number()), color: v.optional(v.string()),
};
const templateArgs = {
  templateId: v.number(), title: v.string(), start: v.string(), end: v.string(), category: v.string(), note: v.string(), color: v.optional(v.string()),
};

async function userId(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Authentication required");
  return id;
}

export const listEvents = query({ args: { day: v.string() }, handler: async (ctx, { day }) => {
  const uid = await userId(ctx);
  return await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
}});

export const upsertEvent = mutation({ args: eventArgs, handler: async (ctx, event) => {
  const uid = await userId(ctx);
  const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", event.day)).collect();
  const row = existing.find(item => item.eventId === event.eventId);
  if (row) await ctx.db.patch(row._id, { ...event, userId: uid });
  else await ctx.db.insert("events", { ...event, userId: uid });
}});

export const deleteEvent = mutation({ args: { day: v.string(), eventId: v.number() }, handler: async (ctx, { day, eventId }) => {
  const uid = await userId(ctx);
  const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
  for (const row of existing.filter(item => item.eventId === eventId)) await ctx.db.delete(row._id);
}});

export const replaceDayEvents = mutation({ args: { day: v.string(), events: v.array(v.object(eventArgs)) }, handler: async (ctx, { day, events }) => {
  const uid = await userId(ctx);
  const existing = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid).eq("day", day)).collect();
  for (const row of existing) await ctx.db.delete(row._id);
  for (const event of events) await ctx.db.insert("events", { ...event, userId: uid, day });
}});

export const listTemplates = query({ args: {}, handler: async ctx => {
  const uid = await userId(ctx); return await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
}});
export const replaceTemplates = mutation({ args: { templates: v.array(v.object(templateArgs)) }, handler: async (ctx, { templates }) => {
  const uid = await userId(ctx); const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
  for (const row of existing) await ctx.db.delete(row._id);
  for (const template of templates) await ctx.db.insert("templates", { ...template, userId: uid });
}});

export const upsertTemplate = mutation({ args: templateArgs, handler: async (ctx, template) => {
  const uid = await userId(ctx);
  const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
  const row = existing.find(item => item.templateId === template.templateId);
  if (row) await ctx.db.patch(row._id, { ...template, userId: uid });
  else await ctx.db.insert("templates", { ...template, userId: uid });
}});

export const deleteTemplate = mutation({ args: { templateId: v.number() }, handler: async (ctx, { templateId }) => {
  const uid = await userId(ctx);
  const existing = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
  for (const row of existing.filter(item => item.templateId === templateId)) await ctx.db.delete(row._id);
}});

export const getPalette = query({ args: {}, handler: async ctx => {
  const uid = await userId(ctx); return await ctx.db.query("palette").withIndex("by_user", q => q.eq("userId", uid)).first();
}});
export const setPalette = mutation({ args: { colors: v.any() }, handler: async (ctx, { colors }) => {
  const uid = await userId(ctx); const existing = await ctx.db.query("palette").withIndex("by_user", q => q.eq("userId", uid)).first();
  if (existing) await ctx.db.patch(existing._id, { colors }); else await ctx.db.insert("palette", { userId: uid, colors });
}});
