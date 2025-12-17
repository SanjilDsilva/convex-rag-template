

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { chunkText, embedText } from "./utils";

export const insertDocument = internalMutation({
  args: { text: v.string() },
  handler: async (ctx, args) =>
    ctx.db.insert("documents", {
      text: args.text,
      createdAt: Date.now(),
    }),
});

export const insertEmbedding = internalMutation({
  args: {
    text: v.string(),
    embedding: v.array(v.float64()),
    docId: v.id("documents"),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("embeddings", {
      text: args.text,
      embedding: args.embedding,
      docId: args.docId,
      createdAt: Date.now(),
    }),
});

export const ingestDocument = action({
  args: { text: v.string() },
  handler: async (
    ctx: any,
    args: { text: string }
  ): Promise<{ docId: string; chunks: number }> => {
    const docId: string = await ctx.runMutation(internal.ingest.insertDocument, { text: args.text });
    const chunks: string[] = chunkText(args.text);
    for (const chunk of chunks) {
      const embedding: number[] = await embedText(chunk);
      await ctx.runMutation(internal.ingest.insertEmbedding, {
        text: chunk,
        embedding,
        docId,
      });
    }
    return { docId, chunks: chunks.length };
  },
});
