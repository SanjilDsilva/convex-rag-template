
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerified: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    createdAt: v.optional(v.float64()),
  }).index("email", ["email"]),

  workspaces: defineTable({
    joinCode: v.string(),
    name: v.string(),
    userId: v.id("users"),
  }),

  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]).index("by_user_id", ["userId"]),

  channels: defineTable({
    name: v.string(),
    workspaceId: v.id("workspaces"),
    icon: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  }).index("by_workspace_id", ["workspaceId"]),

  messages: defineTable({
    body: v.string(),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    channelId: v.id("channels"),
    createdAt: v.optional(v.float64()),
    updatedAt: v.optional(v.float64()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_channel_id", ["channelId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"]),

  documents: defineTable({
    text: v.string(),
    createdAt: v.float64(),
  }),

  embeddings: defineTable({
    text: v.string(),
    embedding: v.array(v.float64()),
    createdAt: v.float64(),
    docId: v.optional(v.id("documents")),
    messageId: v.optional(v.id("messages")),
    table: v.optional(v.string()),
    rowId: v.optional(v.string()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768,
  }),
});