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
    };
  },
});
