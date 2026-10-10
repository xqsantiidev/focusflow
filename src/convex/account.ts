import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Permanently delete the signed-in user's account and all of their data:
 * every row in events, templates, palette and rateLimits, all Convex Auth
 * records (accounts, sessions, refresh tokens, verification codes, plus the
 * matching PKCE verifiers and OTP rate-limit rows), and finally the user
 * document itself. The client must send confirm: "delete".
 */
export const deleteAccount = mutation({
  args: { confirm: v.string() },
  handler: async (ctx, args) => {
    if (args.confirm !== "delete") {
      throw new Error("Type 'delete' to confirm account deletion.");
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("You must be signed in to delete your account.");
    }
    const user = await ctx.db.get(userId);
    if (user === null) {
      throw new Error("User not found.");
    }

    /* ── App data ──────────────────────────────────────────────────── */
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

    const rateLimits = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_session", (q) => q.eq("userId", userId))
      .collect();
    for (const doc of rateLimits) await ctx.db.delete(doc._id);

    /* ── Convex Auth records ─────────────────────────────────────────
       Refresh tokens and verification codes hang off sessions/accounts,
       so those children are deleted before their parents. ───────────── */
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

    /* OTP rate-limit rows are keyed by the sign-in identifier (email). */
    const email = user.email;
    if (typeof email === "string" && email.length > 0) {
      const rateLimitRows = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", (q) => q.eq("identifier", email))
        .collect();
      for (const row of rateLimitRows) await ctx.db.delete(row._id);
    }

    /* ── Finally, the user document itself ─────────────────────────── */
    await ctx.db.delete(userId);
  },
});
