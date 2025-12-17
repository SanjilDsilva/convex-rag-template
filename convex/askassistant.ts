
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
    ctx: any,
    args: {
      query: string;
      userId: string;
      workspaceId: string;
      channelId?: string;
      email?: string;
    }
  ): Promise<{ answer: string; sources: string[] }> => {
    // Validate required args
    if (!args.query || !args.userId || !args.workspaceId) {
      throw new Error("Missing required arguments: query, userId, workspaceId");
    }
    // Membership check
    const membership: any[] = await ctx.runQuery(api.dbqueries.getUsersInWorkspace, {
      userId: args.userId,
      workspaceId: args.workspaceId,
    });
    const isMember = membership.some((u: { _id: string }) => u._id === args.userId);
    if (!isMember) throw new Error("Access denied: user not in workspace");

    // Intent classification
    const intentPrompt = `You classify user queries into these intents:\n- list_channels\n- list_users\n- summarize_channel\n- get_workspace_info\n- get_user_profile\n- search_users\n- rag_fallback\nReturn ONLY compact JSON: {\"intent\":\"...\",\"params\":{...}}. If unsure, return {\"intent\":\"rag_fallback\",\"params\":{}}.`;
    const llmOut = await generateLLMResponse(intentPrompt + " User Query: " + args.query);
    let parsed;
    try {
      parsed = JSON.parse(llmOut);
    } catch {
      parsed = { intent: "rag_fallback", params: {} };
    }
    const { intent, params } = parsed;

    // DB Intents
    if (intent === "list_channels") {
      const channels: any[] = await ctx.runQuery(api.dbqueries.getChannelsInWorkspace, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      return {
        answer: channels.length
          ? `Channels in this workspace:\n` + channels.map((c: any) => `- ${c.name}`).join("\n")
          : "No channels found in this workspace.",
        sources: ["channels"],
      };
    }
    if (intent === "list_users") {
      const users: any[] = await ctx.runQuery(api.dbqueries.getUsersInWorkspace, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      return {
        answer: users.length
          ? `Users in this workspace:\n` + users.map((u: any) => `- ${u.name || u.email || u._id}`).join("\n")
          : "No users found in this workspace.",
        sources: ["users"],
      };
    }
    if (intent === "summarize_channel" && args.channelId) {
      const messages: any[] = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
      });
      const context = messages.map((m: any) => m.body).join("\n");
      const answer = await generateLLMResponse("Summarize the following messages:", context);
      return { answer, sources: ["summary"] };
    }
    if (intent === "get_workspace_info") {
      const ws: any = await ctx.runQuery(api.dbqueries.getWorkspace, {
        workspaceId: args.workspaceId,
      });
      if (!ws) return { answer: "Workspace not found.", sources: [] };
      return { answer: `Workspace: ${ws.name}\nJoin code: ${ws.joinCode}`, sources: ["workspace"] };
    }
    if (intent === "get_user_profile") {
      const user: any = await ctx.runQuery(api.dbqueries.getUser, {
        userId: args.userId,
      });
      if (!user) return { answer: "User not found.", sources: [] };
      return { answer: `User: ${user.name}\nEmail: ${user.email}`, sources: ["user"] };
    }
    if (intent === "search_users" && args.email) {
      const users: any[] = await ctx.runQuery(api.dbqueries.searchUsersByEmail, {
        email: args.email,
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      return {
        answer: users.length
          ? `Matching users:\n` + users.map((u: any) => `- ${u.name || u.email || u._id}`).join("\n")
          : "No users found with that email.",
        sources: ["users"],
      };
    }

    // RAG fallback
    const vector = await embedText(args.query);
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector,
      limit: 5,
    });
    const chunks = results.map((r: any) => r.text).filter(Boolean);
    const context = chunks.join("\n\n");
    const answer = await generateLLMResponse(args.query, context);
    return {
      answer,
      sources: chunks,
    };
  },
});
