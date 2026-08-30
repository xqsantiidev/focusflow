import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = { ADMIN: "admin", USER: "user", MEMBER: "member" } as const;
export const roleValidator = v.union(v.literal(ROLES.ADMIN), v.literal(ROLES.USER), v.literal(ROLES.MEMBER));
export type Role = Infer<typeof roleValidator>;

const eventFields = {
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
};

const templateFields = {
  userId: v.id("users"),
  templateId: v.number(),
  title: v.string(),
  start: v.string(),
  end: v.string(),
  category: v.string(),
  note: v.string(),
  color: v.optional(v.string()),
};

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()), image: v.optional(v.string()), email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()), isAnonymous: v.optional(v.boolean()), role: v.optional(roleValidator), onboarded: v.optional(v.boolean()),
  }).index("email", ["email"]),
  events: defineTable(eventFields).index("by_user_day", ["userId", "day"]),
  templates: defineTable(templateFields).index("by_user", ["userId"]),
  palette: defineTable({ userId: v.id("users"), colors: v.any() }).index("by_user", ["userId"]),
  budgets: defineTable({
    userId: v.id("users"),
    targets: v.any(),
  }).index("by_user", ["userId"]),
}, { schemaValidation: false });

export default schema;
