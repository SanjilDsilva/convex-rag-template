import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { embedText, generateLLMResponse } from "./utils";

export const askAssistant = action({
  args: {
    query: v.string(),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    email: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ answer: string; sources: string[] }> => {
    // --- Basic validation ---
    if (!args.query || !args.userId || !args.workspaceId) {
      throw new Error("Missing required arguments");
    }

    // --- Workspace membership check ---
    const isMember = await ctx.runQuery(api.dbqueries.isUserInWorkspace, {
      userId: args.userId,
      workspaceId: args.workspaceId,
    });
    if (!isMember) {
      throw new Error("Access denied");
    }

    const q = args.query.toLowerCase();

    // --- INTENT MAPPING ---
    // 1. Summarize channel
    if (q.includes("summarize") && q.includes("channel")) {
      let channelId = args.channelId;
      let channelName = "";
      // If channelId is provided, get the channel name from DB
      if (channelId) {
        const channel = await ctx.runQuery(api.dbqueries.getChannelInfo, {
          userId: args.userId,
          workspaceId: args.workspaceId,
          channelId,
        });
        channelName = channel?.name || "";
      }
      // If no channelId or no name found, try to extract from query or fallback to 'general'
      if (!channelName) {
        channelName = "general";
        const match = q.match(/channel\s+([a-z0-9_-]+)/i);
        if (match?.[1]) channelName = match[1];
      }
      if (!channelId) {
        const channel = await ctx.runQuery(api.dbqueries.getChannelByName, {
          workspaceId: args.workspaceId,
          name: channelName,
        });
        if (!channel) {
          return { answer: `Channel \"${channelName}\" not found in this workspace.`, sources: [] };
        }
        channelId = channel._id;
      }
      if (!channelId) {
        return { answer: "No channelId provided.", sources: [] };
      }
      const messages = await ctx.runQuery(api.dbqueries.summarizeChannel, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId,
      });
      if (!messages.length) {
        return { answer: `No messages found in #${channelName}.`, sources: [] };
      }
      const context = messages.map((m: any) => m.body).filter(Boolean).join("\n");
      const answer = await generateLLMResponse("Summarize these messages briefly:", context);
      return { answer, sources: [`channel:${channelName}`] };
    }

    // 2. List users in workspace
    if (
      q.includes("users in this workspace") ||
      q.includes("list users") ||
      q.includes("members in this workspace") ||
      q.includes("who all are there in this workspace") ||
      q.includes("who are the members in this workspace")
    ) {
      const users = await ctx.runQuery(api.dbqueries.listUsers, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      return {
        answer: users.length ? users.map((u: any) => `- ${u.name || u.email || u._id}`).join("\n") : "No users found.",
        sources: ["users"],
      };
    }

    // 3. List channels in workspace
    if (
      q.includes("channels in this workspace") ||
      q.includes("list channels")
    ) {
      const channels = await ctx.runQuery(api.dbqueries.getChannelsInWorkspace, {
        workspaceId: args.workspaceId,
      });
      return {
        answer: channels.length ? channels.map((c: any) => `- ${c.name}`).join("\n") : "No channels found.",
        sources: ["channels"],
      };
    }

    // 4. Workspace info
    if (
      (q.includes("workspace info") || q.includes("workspace details")) &&
      !(
        q.includes("users in this workspace") ||
        q.includes("list users") ||
        q.includes("members in this workspace") ||
        q.includes("who all are there in this workspace") ||
        q.includes("who are the members in this workspace")
      )
    ) {
      const ws = await ctx.runQuery(api.dbqueries.getWorkspaceInfo, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      return {
        answer: ws ? `Workspace: ${ws.name}\nJoin code: ${ws.joinCode}` : "Workspace not found.",
        sources: ["workspace"],
      };
    }

    // 5. Get channel info
    if (q.includes("channel info") && args.channelId) {
      const channel = await ctx.runQuery(api.dbqueries.getChannelInfo, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
      });
      return {
        answer: channel ? `Channel: ${channel.name}` : "Channel not found.",
        sources: ["channel"],
      };
    }

    // 6. Get user profile
    if (q.includes("user profile") && args.userId) {
      // Get user profile by userId in workspace
      const user = await ctx.runQuery(api.dbqueries.getUserProfile, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        targetUserId: args.userId,
      });
      if (!user || typeof user.name !== "string" || typeof user.email !== "string") {
        return { answer: "User not found in this workspace.", sources: [] };
      }
      return {
        answer: `User: ${user.name}\nEmail: ${user.email}`,
        sources: ["user"],
      };
    }

    // 7. Search users by email
    if (q.includes("search user") && args.email) {
      const users = await ctx.runQuery(api.dbqueries.searchUsers, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        email: args.email,
      });
      return {
        answer: users.length ? users.map((u: any) => `- ${u.name || u.email || u._id}`).join("\n") : "No users found.",
        sources: ["users"],
      };
    }

    // 8. Search messages
    if (q.includes("search message") && args.query) {
      const messages = await ctx.runQuery(api.dbqueries.searchMessages, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        search: args.query,
      });
      return {
        answer: messages.length ? messages.map((m: any) => `- ${m.body}`).join("\n") : "No messages found.",
        sources: ["messages"],
      };
    }

    // --- DENY ALL FORBIDDEN OR UNKNOWN ACTIONS ---
    return {
      answer:
        "Sorry, this action is not supported yet. Please try asking about a channel, workspace, or member.",
      sources: [],
    };
  },
});
