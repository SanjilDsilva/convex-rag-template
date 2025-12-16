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