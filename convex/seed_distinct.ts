import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDistinct = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Users
    const alice = await ctx.db.insert("users", { email: "alice@example.com", name: "Alice" });
    const bob = await ctx.db.insert("users", { email: "bob@example.com", name: "Bob" });
    const carol = await ctx.db.insert("users", { email: "carol@example.com", name: "Carol" });

    // 2. Workspaces
    const wsAlpha = await ctx.db.insert("workspaces", { name: "Alpha", joinCode: "ALPHA1", userId: alice });
    const wsBeta = await ctx.db.insert("workspaces", { name: "Beta", joinCode: "BETA2", userId: bob });

    // 3. Members (distinct memberships)
    // Alpha: Alice, Bob
    const memberAlphaAlice = await ctx.db.insert("members", { userId: alice, workspaceId: wsAlpha });
    const memberAlphaBob = await ctx.db.insert("members", { userId: bob, workspaceId: wsAlpha });
    // Beta: Bob, Carol
    const memberBetaBob = await ctx.db.insert("members", { userId: bob, workspaceId: wsBeta });
    const memberBetaCarol = await ctx.db.insert("members", { userId: carol, workspaceId: wsBeta });

    // 4. Channels
    const channelAlphaGeneral = await ctx.db.insert("channels", { name: "general", workspaceId: wsAlpha });
    const channelBetaGeneral = await ctx.db.insert("channels", { name: "general", workspaceId: wsBeta });

    // 5. Messages
    await ctx.db.insert("messages", {
      body: "Welcome to Alpha!",
      memberId: memberAlphaAlice,
      workspaceId: wsAlpha,
      channelId: channelAlphaGeneral,
      createdAt: Date.now(),
    });
    await ctx.db.insert("messages", {
      body: "Hello from Bob in Alpha!",
      memberId: memberAlphaBob,
      workspaceId: wsAlpha,
      channelId: channelAlphaGeneral,
      createdAt: Date.now(),
    });
    await ctx.db.insert("messages", {
      body: "Welcome to Beta!",
      memberId: memberBetaBob,
      workspaceId: wsBeta,
      channelId: channelBetaGeneral,
      createdAt: Date.now(),
    });
    await ctx.db.insert("messages", {
      body: "Carol here in Beta!",
      memberId: memberBetaCarol,
      workspaceId: wsBeta,
      channelId: channelBetaGeneral,
      createdAt: Date.now(),
    });

    return {
      users: [alice, bob, carol],
      workspaces: [wsAlpha, wsBeta],
      members: [memberAlphaAlice, memberAlphaBob, memberBetaBob, memberBetaCarol],
      channels: [channelAlphaGeneral, channelBetaGeneral],
    };
  },
});
