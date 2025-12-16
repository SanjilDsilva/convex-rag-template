import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---------------------------------------------------------------------------
  // RAG / DOCUMENTS
  // ---------------------------------------------------------------------------
  documents: defineTable({
    text: v.string(),
    createdAt: v.number(),
  }),

  // Unified Embeddings Table
  // Supports both RAG (docId) and potentially future Chat logic
  embeddings: defineTable({
    text: v.string(),
    embedding: v.array(v.float64()),
    docId: v.optional(v.id("documents")),
    // Optional fields for wider compatibility if needed
    messageId: v.optional(v.id("messages")),
    createdAt: v.number(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768,
  }),

  // ---------------------------------------------------------------------------
  // SLACK CLONE / CHAT TABLES (Restored)
  // ---------------------------------------------------------------------------
  users: defineTable({
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    location: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    website: v.optional(v.string()),
  }).index("email", ["email"]),

  workspaces: defineTable({
    joinCode: v.string(),
    name: v.string(),
    userId: v.id("users"),
  }),

  channels: defineTable({
    icon: v.optional(v.string()),
    name: v.string(),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),

  messages: defineTable({
    body: v.optional(v.string()),
    calendarEvent: v.optional(v.object({
      date: v.float64(),
      time: v.optional(v.string()),
    })),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    image: v.optional(v.id("_storage")),
    memberId: v.optional(v.id("members")),
    parentMessageId: v.optional(v.id("messages")),
    tags: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.float64()),
    workspaceId: v.id("workspaces"),
  })
    .index("by_channel_id", ["channelId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_parent_message_id", ["parentMessageId"])
    .index("by_conversation_id", ["conversationId"])
    .index(
      "by_channel_id_parent_message_id_conversation_id",
      ["channelId", "parentMessageId", "conversationId"]
    ),

  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"])
    .index("by_user_id", ["userId"]),

  conversations: defineTable({
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),
});
