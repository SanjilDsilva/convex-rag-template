

import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper: Check if user is a member of the workspace
async function assertMembership(ctx: any, userId: string, workspaceId: string) {
  const membership = await ctx.db
    .query("members")
    .withIndex("by_workspace_id", q => q.eq("workspaceId", workspaceId))
    .filter(q => q.eq(q.field("userId"), userId))
    .first();
  if (!membership) throw new Error("Access denied: user not in workspace");
}

export const getChannelsInWorkspace = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    return ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getUsersInWorkspace = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const userIds = members.map((m: any) => m.userId);
    const users = await Promise.all(userIds.map((id: string) => ctx.db.get(id)));
    return users.filter(Boolean);
  },
});

export const getMessagesInChannel = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.workspaceId !== args.workspaceId) {
      throw new Error("Access denied: channel outside workspace");
    }
    return ctx.db
      .query("messages")
      .withIndex("by_channel_id", q => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => ctx.db.get(args.workspaceId),
});

export const searchUsersByEmail = query({
  args: { email: v.string(), userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const userIds = members.map((m: any) => m.userId);
    const users = await Promise.all(userIds.map((id: string) => ctx.db.get(id)));
    return users.filter(u => u && u.email === args.email);
  },
});
