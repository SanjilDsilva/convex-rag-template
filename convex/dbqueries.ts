// Mutation: Create a new message in a channel
export const createMessage = mutation({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), channelId: v.id("channels"), body: v.string() },
  handler: async (ctx, args) => {
    // Find the memberId for this user in this workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
    if (!member) throw new Error("User is not a member of this workspace");
    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      memberId: member._id,
      workspaceId: args.workspaceId,
      channelId: args.channelId,
      createdAt: Date.now(),
    });
    return await ctx.db.get(messageId);
  },
});
// Mutation: Create a new channel in a workspace
export const createChannel = mutation({
  args: { name: v.string(), workspaceId: v.id("workspaces"), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Optionally, check if channel with same name exists in workspace
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .filter(q => q.eq(q.field("name"), args.name))
      .first();
    if (existing) throw new Error("Channel with this name already exists.");
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      workspaceId: args.workspaceId,
      createdBy: args.userId,
    });
    return await ctx.db.get(channelId);
  },
});
// Mutation: Create a new workspace
export const createWorkspace = mutation({
  args: { name: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Generate a professional join code (6 uppercase alphanumeric chars)
    const joinCode = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36).toUpperCase()
    ).join("");
    // Create the workspace with all required fields
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      joinCode,
      userId: args.userId,
    });
    // Add the user as a member
    await ctx.db.insert("members", {
      userId: args.userId,
      workspaceId,
    });
    return await ctx.db.get(workspaceId);
  },
});
// Query: Get all workspaces a user belongs to
export const getUserWorkspaces = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Find all memberships for this user
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .collect();
    const workspaceIds = memberships.map((m: any) => m.workspaceId);
    // Fetch all workspaces
    const workspaces = await Promise.all(
      workspaceIds.map((id: string) => ctx.db.get(id))
    );
    return workspaces.filter(Boolean);
  },
});
import { mutation } from "./_generated/server";
// Mutation: Create user (for login/signup)
export const createUser = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();
    if (existing) return existing;
    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});
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

// --- Security: Membership check ---
async function assertMembership(ctx: any, userId: string, workspaceId: string) {
  const membership = await ctx.db
    .query("members")
    .withIndex("by_workspace_id", q => q.eq("workspaceId", workspaceId))
    .filter(q => q.eq(q.field("userId"), userId))
    .first();
  if (!membership) throw new Error("Access denied: user not in workspace");
}

// --- Intents ---

// 1. list_channels
export const listChannels = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    return ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// 2. list_users
export const listUsers = query({
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

// 3. get_workspace_info
export const getWorkspaceInfo = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    return await ctx.db.get(args.workspaceId);
  },
});

// 4. get_channel_info
export const getChannelInfo = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.workspaceId !== args.workspaceId) throw new Error("Access denied: channel outside workspace");
    return channel;
  },
});

// 5. summarize_channel
export const summarizeChannel = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.workspaceId !== args.workspaceId) throw new Error("Access denied: channel outside workspace");
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel_id", q => q.eq("channelId", args.channelId))
      .collect();
    return messages;
  },
});

// 6. get_user_profile
export const getUserProfile = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    // Only allow if targetUserId is a member of workspace
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const isTargetMember = members.some((m: any) => m.userId === args.targetUserId);
    if (!isTargetMember) throw new Error("User not found in this workspace");
    return await ctx.db.get(args.targetUserId);
  },
});

// 7. search_users (by email, workspace-scoped)
export const searchUsers = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), email: v.string() },
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

// 8. search_messages (workspace-scoped)
export const searchMessages = query({
  args: { userId: v.id("users"), workspaceId: v.id("workspaces"), search: v.string() },
  handler: async (ctx, args) => {
    await assertMembership(ctx, args.userId, args.workspaceId);
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", q => q.eq("workspaceId", args.workspaceId))
      .collect();
    const channelIds = channels.map((c: any) => c._id);
    let results: any[] = [];
    for (const channelId of channelIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel_id", q => q.eq("channelId", channelId))
        .collect();
      results = results.concat(messages.filter((m: any) => m.body.includes(args.search)));
    }
    return results;
  },
});

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

// ...existing code...

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
