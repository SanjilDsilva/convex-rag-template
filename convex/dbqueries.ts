
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

// 1. Get all users in a workspace
export const getUsersInWorkspace = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    // Get all members in workspace
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const userIds = members.map(m => m.userId);
    // Get user details
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    return users.filter(Boolean);
  },
});

// 2. Get workspace details (only if user is a member)
export const getWorkspace = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    return await ctx.db.get(args.workspaceId);
  },
});

// 3. Get all channels in a workspace
export const getChannelsInWorkspace = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    return await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// 4. Get messages in a channel (only if channel belongs to workspace and user is a member)
export const getMessagesInChannel = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.workspaceId !== args.workspaceId) {
      throw new Error("Access denied: channel outside workspace");
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_channel_id", q => q.eq("channelId", args.channelId))
      .collect();
  },
});

// 5. Search users by email in the same workspace only
export const searchUsers = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    // Find members in workspace
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const userIds = members.map(m => m.userId);
    // Get users with matching email
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    return users.filter(u => u && u.email === args.email);
  },
});
