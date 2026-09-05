import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const uid = await getAuthUserId(ctx);
    if (!uid) throw new Error("Authentication required");

    const events = await ctx.db.query("events").withIndex("by_user_day", q => q.eq("userId", uid)).collect();
    for (const row of events) await ctx.db.delete(row._id);

    const templates = await ctx.db.query("templates").withIndex("by_user", q => q.eq("userId", uid)).collect();
    for (const row of templates) await ctx.db.delete(row._id);

    const palettes = await ctx.db.query("palette").withIndex("by_user", q => q.eq("userId", uid)).collect();
    for (const row of palettes) await ctx.db.delete(row._id);

    const budgets = await ctx.db.query("budgets").withIndex("by_user", q => q.eq("userId", uid)).collect();
    for (const row of budgets) await ctx.db.delete(row._id);

    const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", q => q.eq("userId", uid)).collect();
    for (const account of accounts) {
      const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", q => q.eq("accountId", account._id)).collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    const sessions = await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", uid)).collect();
    for (const session of sessions) {
      const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", q => q.eq("sessionId", session._id)).collect();
      for (const token of tokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(uid);
  },
});
