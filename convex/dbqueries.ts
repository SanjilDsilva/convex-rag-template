// Query: Get workspace by name or ID
export const getWorkspaceByNameOrId = query({
  args: { nameOrId: v.string() },
  handler: async (ctx, args) => {
    let ws = await ctx.db.query("workspaces").filter(q => q.eq(q.field("name"), args.nameOrId)).first();
    // Convex IDs are 22 characters long (adjust if your IDs are different)
    if (!ws && args.nameOrId.length === 22) {
      ws = await ctx.db.get(args.nameOrId as Id<"workspaces">);
    }
    return ws;
  },
});
// Query: Get channel by name in a workspace
export const getChannelByName = query({
  args: { workspaceId: v.id("workspaces"), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .filter(q => q.eq(q.field("name"), args.name))
      .first();
  },
});
import { query } from "./_generated/server";
import { v } from "convex/values";

// Query: Check if user is a member of the workspace (returns boolean)
export const isUserInWorkspace = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();
    return !!member;
  },
});

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
