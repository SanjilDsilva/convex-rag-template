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

    // ------------------------------------------------------------------
    // 1. SUMMARIZE CHANNEL (by name OR channelId)
    // ------------------------------------------------------------------
    if (q.includes("summarize") && q.includes("channel")) {
      let channelId = args.channelId;

      // Try to extract channel name (default: general)
      let channelName = "general";
      const match = q.match(/channel\s+([a-z0-9_-]+)/i);
      if (match?.[1]) channelName = match[1];

      if (!channelId) {
        const channel = await ctx.runQuery(api.dbqueries.getChannelByName, {
          workspaceId: args.workspaceId,
          name: channelName,
        });
        if (!channel) {
          return {
            answer: `Channel "${channelName}" not found in this workspace.`,
            sources: [],
          };
        }
        channelId = channel._id;
      }
      if (!channelId) {
        return { answer: "No channelId provided.", sources: [] };
      }
      const messages = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId,
      });
      if (!messages.length) {
        return {
          answer: `No messages found in #${channelName}.`,
          sources: [],
        };
      }
      const context = messages
        .map((m: any) => m.body)
        .filter(Boolean)
        .join("\n");
      const answer = await generateLLMResponse(
        "Summarize these messages briefly:",
        context
      );
      return { answer, sources: [`channel:${channelName}`] };
    }

    // ------------------------------------------------------------------
    // 2. LIST USERS IN WORKSPACE (robust matching, supports named workspaces)
    // ------------------------------------------------------------------
    if (
      q.includes("users in this workspace") ||
      q.includes("who all are there in this workspace") ||
      q.includes("list users in this workspace") ||
      q.includes("who are the members in this workspace") ||
      q.includes("show all users in this workspace") ||
      q.match(/users in workspace [a-z0-9 _-]+/) ||
      q.match(/members in workspace [a-z0-9 _-]+/) ||
      q.match(/show all users in workspace [a-z0-9 _-]+/)
    ) {
      // Try to extract workspace name or ID from the query
      let targetWorkspaceId = args.workspaceId;
      let workspaceNameMatch = q.match(/workspace ([a-z0-9 _-]+)/);
      if (workspaceNameMatch && workspaceNameMatch[1]) {
        const wsLookup = await ctx.runQuery(api.dbqueries.getWorkspaceByNameOrId, {
          nameOrId: workspaceNameMatch[1].trim(),
        });
        if (wsLookup && wsLookup._id) targetWorkspaceId = wsLookup._id;
      }
      // Membership check
      const isMember = await ctx.runQuery(api.dbqueries.isUserInWorkspace, {
        userId: args.userId,
        workspaceId: targetWorkspaceId,
      });
      if (!isMember) {
        return { answer: "Access denied: you are not a member of that workspace.", sources: [] };
      }
      const users = await ctx.runQuery(
        api.dbqueries.getUsersInWorkspace,
        {
          userId: args.userId,
          workspaceId: targetWorkspaceId,
        }
      );
      return {
        answer: users.length
          ? users.filter(Boolean).map((u: any) => `- ${u.name || u.email || u._id}`).join("\n")
          : "No users found.",
        sources: ["users"],
      };
    }

    // ------------------------------------------------------------------
    // 3. LIST CHANNELS
    // ------------------------------------------------------------------
    if (q.includes("channels in this workspace")) {
      const channels = await ctx.runQuery(
        api.dbqueries.getChannelsInWorkspace,
        {
          userId: args.userId,
          workspaceId: args.workspaceId,
        }
      );

      return {
        answer: channels.length
          ? channels.map((c) => `- ${c.name}`).join("\n")
          : "No channels found.",
        sources: ["channels"],
      };
    }

    // ------------------------------------------------------------------
    // 4. WORKSPACE INFO
    // ------------------------------------------------------------------
    if (q.includes("workspace")) {
      // Use LLM to extract workspace name or ID from the query
      const extractionPrompt = `Extract the workspace name or ID the user is asking about from this query: "${args.query}". If none, return the current workspaceId.`;
      let extractionResult = await generateLLMResponse(extractionPrompt, "");
      extractionResult = extractionResult.replace(/\"/g, '').replace(/['\n]/g, '').trim();
      let targetWorkspaceId = args.workspaceId;
      if (extractionResult && extractionResult !== args.workspaceId) {
        const wsLookup = await ctx.runQuery(api.dbqueries.getWorkspaceByNameOrId, {
          nameOrId: extractionResult,
        });
        if (wsLookup && wsLookup._id) targetWorkspaceId = wsLookup._id;
      }
      // Membership check
      const isMember = await ctx.runQuery(api.dbqueries.isUserInWorkspace, {
        userId: args.userId,
        workspaceId: targetWorkspaceId,
      });
      if (!isMember) {
        return { answer: "Access denied: you are not a member of that workspace.", sources: [] };
      }
      const ws = await ctx.runQuery(api.dbqueries.getWorkspace, {
        workspaceId: targetWorkspaceId,
      });
      return {
        answer: ws
          ? `Workspace: ${ws.name}\nJoin code: ${ws.joinCode}`
          : "Workspace not found.",
        sources: ["workspace"],
      };
    }

    // ------------------------------------------------------------------
    // 5. RAG FALLBACK (minimal context)
    // ------------------------------------------------------------------
    const vector = await embedText(args.query);
    const results = await ctx.vectorSearch(
      "embeddings",
      "by_embedding",
      { vector, limit: 3 }
    );

    const context = results
      .map((r: any) => r.text || "")
      .filter(Boolean)
      .join("\n");

    const answer = await generateLLMResponse(args.query, context);

    return {
      answer,
      sources: results.map((r: any) => r._id),
    };
  },
});
