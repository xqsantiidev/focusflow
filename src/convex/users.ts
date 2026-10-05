import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/**
 * Permanently delete the signed-in user's account and all of their data:
 * events, templates, palette, budgets, and every auth record
 * (accounts, sessions, refresh tokens, verification codes), then the user
 * document itself. Requires the client to send confirm: "delete".
 */
export const deleteAccount = mutation({
  args: { confirm: v.string() },
  handler: async (ctx, args) => {
    if (args.confirm !== "delete") {
      throw new Error("Type 'delete' to confirm account deletion.");
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated.");
    }
    const user = await ctx.db.get(userId);
    if (user === null) {
      throw new Error("User not found.");
    }

    /* ── App data ─────────────────────────────────── */
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_day", (q) => q.eq("userId", userId))
      .collect();
    for (const doc of events) await ctx.db.delete(doc._id);

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const doc of templates) await ctx.db.delete(doc._id);

    const palettes = await ctx.db
      .query("palette")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const doc of palettes) await ctx.db.delete(doc._id);

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const doc of budgets) await ctx.db.delete(doc._id);

    /* ── Auth records: refresh tokens + verification
       codes hang off sessions/accounts, so clear those first. ── */
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    /* PKCE verifiers are only indexed by signature; filter in memory. */
    const verifiers = await ctx.db.query("authVerifiers").collect();
    const sessionIds = new Set(sessions.map((s) => s._id));
    for (const verifier of verifiers) {
      if (verifier.sessionId !== undefined && sessionIds.has(verifier.sessionId)) {
        await ctx.db.delete(verifier._id);
      }
    }

    /* OTP rate-limit rows are keyed by the sign-in identifier. */
    for (const identifier of [user.email]) {
      if (!identifier) continue;
      const rows = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", (q) => q.eq("identifier", identifier))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }

    /* ── Finally, the user document itself ───────── */
    await ctx.db.delete(userId);
  },
});
