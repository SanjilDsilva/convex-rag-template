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