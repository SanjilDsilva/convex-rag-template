import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { embedText, generateLLMResponse } from "./utils";

export const askAssistant = action({
  // Combine args from both worlds:
  // 1. Chat Context (optional, for "Slack" features)
  // 2. Query (required)
  args: {
    query: v.string(),
    userId: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    // -------------------------------------------------------------------------
    // 1. INTENT CLASSIFICATION
    // -------------------------------------------------------------------------
    // We ask the LLM to decide if this is a "Chat Query" (about messages/users)
    // or a "Document Query" (about uploaded PDFs/text).
    const classifyPrompt = `
    You are an AI assistant routing logic.
    User Query: "${args.query}"
    Context Available: channelId=${args.channelId ? "YES" : "NO"}, workspaceId=${args.workspaceId ? "YES" : "NO"}.

    Determine the INTENT:
    - "chat_search": if the user asks about messages, chat history, channel summary, users.
    - "rag_search": if the user asks about documents, "the file", "uploaded text", or general knowledge that might be in the PDFs.
    
    Return ONLY a JSON string: {"intent": "chat_search"} or {"intent": "rag_search"}.
    `;

    // We use a simple generation call for classification (could be optimized)
    const classificationJson = await generateLLMResponse(classifyPrompt, "");
    let intent = "rag_search"; // Default
    try {
      const parsed = JSON.parse(classificationJson.replace(/```json/g, "").replace(/```/g, "").trim());
      if (parsed.intent) intent = parsed.intent;
    } catch (e) {
      console.log("Classification failed, defaulting to RAG");
    }

    console.log(`Intent detected: ${intent}`);

    // -------------------------------------------------------------------------
    // 2. BRANCH: CHAT SEARCH (Slack-like)
    // -------------------------------------------------------------------------
    if (intent === "chat_search" && args.channelId) {
      // Fetch recent messages from the channel
      const messages = await ctx.runQuery(api.dbqueries.getMessagesInChannel, {
        channelId: args.channelId
      });

      // If no messages, fallback or just say empty
      if (!messages || messages.length === 0) {
        return { answer: "No messages found in this channel to summarize.", sources: [] };
      }

      const messageContext = messages
        .map((m: any) => `[${new Date(m._creationTime).toISOString()}] User ${m.memberId}: ${m.body}`)
        .join("\n");

      const answer = await generateLLMResponse(args.query, messageContext);
      return { answer, sources: ["Chat History"] };
    }

    // -------------------------------------------------------------------------
    // 3. BRANCH: RAG SEARCH (Document-like)
    // -------------------------------------------------------------------------
    // Fallback to RAG if intent is RAG OR if Chat intent failed (missing channelId)

    // Generate embedding for the query
    const queryEmbedding = await embedText(args.query);

    // Perform vector search
    const searchResults = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: queryEmbedding,
      limit: 5,
    });

    if (searchResults.length === 0) {
      return {
        answer: "I don't have enough information in the documents (or chat context) to answer that.",
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

    return { answer, sources };
  },
});
