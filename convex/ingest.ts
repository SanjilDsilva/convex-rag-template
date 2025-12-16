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
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { chunkText, embedText } from "./utils";

/**
 * Internal mutation to insert a document
 */
export const insertDocument = internalMutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"documents">> => {
    const docId = await ctx.db.insert("documents", {
      text: args.text,
      createdAt: Date.now(),
    });
    return docId;
  },
});

/**
 * Internal mutation to insert an embedding
 */
export const insertEmbedding = internalMutation({
  args: {
    text: v.string(),
    embedding: v.array(v.number()),
    docId: v.id("documents"),
  },
  handler: async (ctx, args): Promise<Id<"embeddings">> => {
    const embeddingId = await ctx.db.insert("embeddings", {
      text: args.text,
      embedding: args.embedding,
      docId: args.docId,
      createdAt: Date.now(),
    });
    return embeddingId;
  },
});

/**
 * Action to ingest a document
 * Splits text into chunks, generates embeddings, and stores them
 */
export const ingestDocument = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<{ documentId: Id<"documents">; chunksProcessed: number }> => {
    // Insert the main document
    const docId = await ctx.runMutation(internal.ingest.insertDocument, {
      text: args.text,
    });

    // Split text into chunks
    const chunks = chunkText(args.text);
    console.log(`Split document into ${chunks.length} chunks`);

    // Process each chunk: generate embedding and insert
    let chunksProcessed = 0;
    for (const chunk of chunks) {
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
  },
});
>>>>>>> 368316ad71f416805513bbc89e050b931cb2bba4
