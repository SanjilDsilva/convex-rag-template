import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
<<<<<<< HEAD
  // ---------------------------------------------------------------------------
  // USERS TABLE
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


  // ---------------------------------------------------------------------------
  // WORKSPACES TABLE
  // ---------------------------------------------------------------------------
  workspaces: defineTable({
    joinCode: v.string(),
    name: v.string(),
    userId: v.id("users"),
  }),


  // ---------------------------------------------------------------------------
  // CHANNELS TABLE
  // ---------------------------------------------------------------------------
  channels: defineTable({
    icon: v.optional(v.string()),
    name: v.string(),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),


  // ---------------------------------------------------------------------------
  // MESSAGES TABLE
  // ---------------------------------------------------------------------------
  messages: defineTable({
    body: v.optional(v.string()), // allow null for body
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


  // ---------------------------------------------------------------------------
  // MEMBERS TABLE
  // ---------------------------------------------------------------------------
  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"])
    .index("by_user_id", ["userId"]),


  // ---------------------------------------------------------------------------
  // CONVERSATIONS TABLE
  // ---------------------------------------------------------------------------
  conversations: defineTable({
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),


  // ---------------------------------------------------------------------------
  // EMBEDDINGS TABLE (OPTIONAL FOR LATER — SAFE)
  // ---------------------------------------------------------------------------
  embeddings: defineTable({
    table: v.string(), // "messages", "channels", etc.
    rowId: v.id("messages"), // NOTE: placeholder; embedding use-case optional
    embedding: v.array(v.float64()),
    text: v.string(),
    createdAt: v.float64(),
  }).index("by_table", ["table"]),
=======
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
>>>>>>> 368316ad71f416805513bbc89e050b931cb2bba4
});
