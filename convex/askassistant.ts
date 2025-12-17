<<<<<<< HEAD
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { generateLLMResponse } from "./utils";


export const askAssistant = action({
  args: {
    query: v.string(),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
  },
<<<<<<< Updated upstream
  handler: async (
    ctx: any,
    args: {
      query: string;
      userId: string;
      workspaceId: string;
      channelId?: string;
    }
  ): Promise<{ answer: string; dbResult: any }> => {
    if (!args || typeof args !== 'object' || !args.query || !args.userId || !args.workspaceId) {
      throw new Error("Missing required arguments: query, userId, workspaceId");
    }
    // 1) Check membership
    const isMember = await ctx.db
      .query("members")
      .withIndex("by_user_workspace", (q: any) =>
        q.eq("userId", args.userId).eq("workspaceId", args.workspaceId)
      )
      .first();

    if (!isMember) {
      throw new Error("User does not have access to this workspace.");
    }

    // 2) LLM Intent classification
    const classifyPrompt = `You are Proddy's internal AI assistant. You translate natural language into structured database intents. Context: userId: ${args.userId}, workspaceId: ${args.workspaceId}, channelId: ${args.channelId ?? "null"}. Valid intents: summarize_current_channel, get_channel_info, get_workspace_info, list_channels_in_workspace, list_members, get_user_profile, search_messages, search_users. Return ONLY minified JSON: {"intent":"...", "params":{...}}. If unclear, return: {"intent":"unknown","params":{}}.`;
    const llmOutput = await generateLLMResponse(classifyPrompt + " User Query: " + args.query);

    let parsed;
    try {
      parsed = JSON.parse(llmOutput);
    } catch {
      return {
        answer: "I couldn't understand your request.",
        dbResult: null,
      };
    }

    const { intent, params } = parsed;
    let dbResult = null;

    switch (intent) {
      case "summarize_current_channel":
        if (!args.channelId) {
          return { answer: "No channel selected for summarization.", dbResult: null };
        }
        dbResult = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
          channelId: args.channelId,
        });
        break;

      case "get_channel_info":
        dbResult = await ctx.runQuery(api.dbqueries.getChannel, {
          channelId: params.channelId,
        });
        break;

      // No getChannelsInWorkspace query exists, so we return a message
      case "list_channels_in_workspace":
        return {
          answer: "Listing channels in a workspace is not yet implemented.",
          dbResult: null,
        };
        break;

      case "get_workspace_info":
        dbResult = await ctx.runQuery(api.dbqueries.getWorkspace, {
          workspaceId: args.workspaceId,
        });
        break;

      case "get_user_profile":
        dbResult = await ctx.runQuery(api.dbqueries.getUser, params);
        break;

      case "search_users":
        dbResult = await ctx.runQuery(api.dbqueries.searchUsersByEmail, params);
        break;

      default:
        return {
          answer:
            "I can’t understand this request yet, but I'll improve with more training.",
          dbResult: null,
        };
    }

    // 3) Convert result to natural language
    const answer = await generateLLMResponse(
      `Summarize this data for the user: ${JSON.stringify(dbResult)}`
    );

    return { answer, dbResult };
  },
});
=======
import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { embedText, generateLLMResponse } from "./utils";

/**
 * Internal query to get an embedding document by ID
 */
export const getEmbedding = internalQuery({
  args: {
    id: v.id("embeddings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Action to ask a question using RAG
 */
export const askAssistant = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<{ answer: string; sources: string[] }> => {
    // Generate embedding for the query
    const queryEmbedding = await embedText(args.query);
    console.log(`Generated embedding for query: "${args.query}"`);

    // Perform vector search to find relevant chunks
    const searchResults = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: queryEmbedding,
      limit: 5,
    });

    console.log(`Found ${searchResults.length} relevant chunks`);

    if (searchResults.length === 0) {
      return {
        answer: "I don't have enough information to answer that question.",
        sources: [],
      };
    }

    // Fetch the full embedding documents
    const relevantChunks = await Promise.all(
      searchResults.map((result: any) => ctx.runQuery(internal.askassistant.getEmbedding, { id: result._id }))
    );

    // Build context string from top chunks
    const context = relevantChunks
      .map((chunk: any, idx: number) => `[${idx + 1}] ${chunk?.text || ''}`)
      .filter((text: string) => text.trim().length > 0)
      .join("\n\n");

    // Generate response using LLM
    const answer = await generateLLMResponse(args.query, context);

    // Extract source texts for reference
    const sources = relevantChunks
      .map((chunk: any) => chunk?.text)
      .filter((text: any) => text);

    return {
      answer,
      sources,
=======

  handler: async (ctx, args) => {
    const prompt = args.query;


    // --- Detect workspace/channel/user info requests ---
    const lower = prompt.toLowerCase();
    // 1. Channels in workspace
    if (lower.includes("channels in this workspace") && args.userId && args.workspaceId) {
      const channels = await ctx.runQuery(api.dbqueries.getChannelsInWorkspace, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      const answer = channels.length
        ? `Channels in this workspace:\n` + channels.map(c => `- ${c.name}`).join("\n")
        : "No channels found in this workspace.";
      return { answer, sources: ["channels"] };
    }
    // 2. Users in workspace
    if (lower.includes("users in this workspace") && args.userId && args.workspaceId) {
      const users = await ctx.runQuery(api.dbqueries.getUsersInWorkspace, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      const answer = users.length
        ? `Users in this workspace:\n` + users.map(u => `- ${u.name || u.email || u._id}`).join("\n")
        : "No users found in this workspace.";
      return { answer, sources: ["users"] };
    }
    // 3. Workspace details
    if (lower.includes("workspace details") && args.userId && args.workspaceId) {
      const ws = await ctx.runQuery(api.dbqueries.getWorkspace, {
        userId: args.userId,
        workspaceId: args.workspaceId,
      });
      if (!ws) return { answer: "Workspace not found.", sources: [] };
      const answer = `Workspace: ${ws.name}\nJoin code: ${ws.joinCode}`;
      return { answer, sources: ["workspace"] };
    }
    // 4. Summarize messages in a channel
    if (lower.includes("summarize messages in this channel") && args.userId && args.workspaceId && args.channelId) {
      const messages = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
      });
      const context = messages.map(m => m.body).join("\n");
      const answer = await generateLLMResponse("Summarize the following messages:", context);
      return { answer, sources: ["summary"] };
    }

    // --- Default: classify as chat or rag ---
    const classify = await generateLLMResponse(
      `Classify into "chat" or "rag": ${prompt}`,
      ""
    );
    const mode = classify.includes("chat") ? "chat" : "rag";

    // -----------------------
    // CHAT MODE
    // -----------------------
    if (mode === "chat" && args.channelId && args.userId && args.workspaceId) {
      const messages = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
        userId: args.userId,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
      });
      const context = messages.map(m => m.body).join("\n");
      const answer = await generateLLMResponse(prompt, context);
      return { answer, sources: ["chat"] };
    }

    // -----------------------
    // RAG MODE
    // -----------------------
    const vector = await embedText(prompt);
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector,
      limit: 5,
    });
    const chunks = await Promise.all(
      results.map(r =>
        ctx.runQuery(internal.askassistant.getEmbedding, { id: r._id })
      )
    );
    const context = chunks.map(c => c?.text).join("\n\n");
    const answer = await generateLLMResponse(prompt, context);
    return {
      answer,
      sources: chunks.map(c => c?.text),
>>>>>>> Stashed changes
    };
  },
});
>>>>>>> 368316ad71f416805513bbc89e050b931cb2bba4
