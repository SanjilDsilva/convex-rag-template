import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    text: v.string(),
    createdAt: v.number(),
  }),
  
  embeddings: defineTable({
    text: v.string(),
    embedding: v.array(v.float64()),
    docId: v.id("documents"),
    createdAt: v.number(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768,
  }),
});
