
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

export const getChannelByName = query({
  args: {
    name: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q =>
        q.eq("workspaceId", args.workspaceId)
      )
      .filter(q => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const getAllChannels = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getAllMessages = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(100);
  },
});
