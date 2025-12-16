
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => ctx.db.get(args.workspaceId),
});

export const getChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => ctx.db.get(args.channelId),
});

export const getMessagesInChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) =>
    ctx.db
      .query("messages")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .collect(),
});

export const searchUsersByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect(),
});
