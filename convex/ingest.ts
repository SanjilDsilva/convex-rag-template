<<<<<<< HEAD
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { embedText } from "./utils";
import { internal } from "./_generated/api";

export const ingestString = mutation({
  args: {
    table: v.union(v.literal("messages"), v.literal("channels"), v.literal("users")),
    rowId: v.union(v.id("messages"), v.id("channels"), v.id("users")),
    text: v.string(),
    withEmbedding: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.ingest.insertString, args);
    if (args.withEmbedding) {
      const embedding = await embedText(args.text);
      // Convert rowId to Id<"messages"> for embeddings table
      let embeddingRowId: any = args.rowId;
      if (args.table !== "messages") {
        embeddingRowId = args.rowId as any;
      }
      await ctx.runMutation(internal.ingest.insertEmbedding, {
        table: args.table,
        rowId: embeddingRowId,
        embedding,
        text: args.text,
        createdAt: Date.now(),
      });
    }
  },
});

export const insertString = internalMutation({
  args: {
    table: v.union(v.literal("messages"), v.literal("channels"), v.literal("users")),
    rowId: v.union(v.id("messages"), v.id("channels"), v.id("users")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.table === "messages") {
      await ctx.db.patch(args.rowId as any, { body: args.text });
    } else if (args.table === "channels") {
      await ctx.db.patch(args.rowId as any, { name: args.text });
    } else if (args.table === "users") {
      await ctx.db.patch(args.rowId as any, { name: args.text });
    }
  },
});

export const insertEmbedding = internalMutation({
  args: {
    table: v.union(v.literal("messages"), v.literal("channels"), v.literal("users")),
    rowId: v.id("messages"),
    embedding: v.array(v.float64()),
    text: v.string(),
    createdAt: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("embeddings", {
      table: args.table,
      rowId: args.rowId,
      embedding: args.embedding,
      text: args.text,
      createdAt: args.createdAt,
    });
  },
});
=======
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
  handler: async (ctx, args) => {
    const docId = await ctx.runMutation(internal.ingest.insertDocument, { text: args.text });
    const chunks = chunkText(args.text);

    for (const chunk of chunks) {
<<<<<<< Updated upstream
      try {
        // Generate embedding for the chunk
        const embedding = await embedText(chunk);
        
        // Insert embedding into database
        await ctx.runMutation(internal.ingest.insertEmbedding, {
          text: chunk,
          embedding,
          docId,
        });
        
        chunksProcessed++;
      } catch (error) {
        console.error(`Failed to process chunk: ${error}`);
        throw error;
      }
    }

    console.log(`Successfully processed ${chunksProcessed} chunks for document ${docId}`);
    
    return {
      documentId: docId,
      chunksProcessed,
    };
=======
      const vector = await embedText(chunk);
      await ctx.runMutation(internal.ingest.insertEmbedding, {
        text: chunk,
        embedding: vector,
        docId,
      });
    }

    return { docId, chunks: chunks.length };
>>>>>>> Stashed changes
  },
});
>>>>>>> 368316ad71f416805513bbc89e050b931cb2bba4
