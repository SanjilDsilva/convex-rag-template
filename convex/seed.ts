import { mutation } from "./_generated/server";

export const seedAll = mutation(async (ctx) => {
  const now = Date.now();

  // ---------- USERS ----------
  const users = await Promise.all([
    ctx.db.insert("users", {
      name: "Easha",
      email: "easha@company.com",
      bio: "Full-stack developer working on the core app",
    }),
    ctx.db.insert("users", {
      name: "Alex",
      email: "alex@company.com",
      bio: "AI engineer focusing on RAG and embeddings",
    }),
    ctx.db.insert("users", {
      name: "Sam",
      email: "sam@company.com",
      bio: "Backend engineer handling Convex and APIs",
    }),
    ctx.db.insert("users", {
      name: "Priya",
      email: "priya@company.com",
      bio: "Frontend engineer working on Next.js",
    }),
    ctx.db.insert("users", {
      name: "Jordan",
      email: "jordan@company.com",
      bio: "ML engineer optimizing AI responses",
    }),
  ]);

  // ---------- WORKSPACE ----------
  const workspaceId = await ctx.db.insert("workspaces", {
    name: "AI Product Development",
    joinCode: "AIDEV123",
    userId: users[0], // Easha is owner
  });

  // ---------- MEMBERS ----------
  const members = await Promise.all(
    users.map((userId) =>
      ctx.db.insert("members", {
        userId,
        workspaceId,
      })
    )
  );

  // ---------- CHANNELS ----------
  const generalChannel = await ctx.db.insert("channels", {
    name: "general",
    icon: "💬",
    workspaceId,
  });

  const backendChannel = await ctx.db.insert("channels", {
    name: "backend",
    icon: "🛠️",
    workspaceId,
  });

  const aiChannel = await ctx.db.insert("channels", {
    name: "ai",
    icon: "🤖",
    workspaceId,
  });

  // ---------- MESSAGES ----------
  const messages = [
    { text: "Morning everyone! Let's focus on stabilizing the RAG pipeline today.", channel: generalChannel, member: members[0] },
    { text: "Agreed. Gemini responses are good but need better grounding.", channel: generalChannel, member: members[1] },
    { text: "I’ll review Convex indexes for better retrieval.", channel: backendChannel, member: members[2] },
    { text: "Frontend is blocked until answers are more consistent.", channel: generalChannel, member: members[3] },
    { text: "We should summarize context instead of dumping messages.", channel: aiChannel, member: members[4] },

    { text: "Embeddings look correct so far.", channel: aiChannel, member: members[1] },
    { text: "Vector search can be added next.", channel: aiChannel, member: members[4] },
    { text: "Actions are stable under load.", channel: backendChannel, member: members[2] },
    { text: "Users keep asking what happened today.", channel: generalChannel, member: members[0] },
    { text: "Date-based filtering will help.", channel: generalChannel, member: members[3] },

    { text: "We can parse timestamps server-side.", channel: backendChannel, member: members[2] },
    { text: "Prompt quality matters more than embeddings initially.", channel: aiChannel, member: members[1] },
    { text: "The model must reason, not repeat.", channel: aiChannel, member: members[4] },
    { text: "Once fixed, the app will feel much better.", channel: generalChannel, member: members[3] },
    { text: "I’ll update the RAG prompt today.", channel: generalChannel, member: members[0] },

    { text: "Let’s review progress after lunch.", channel: generalChannel, member: members[0] },
    { text: "Sounds good.", channel: generalChannel, member: members[1] },
    { text: "Backend changes coming soon.", channel: backendChannel, member: members[2] },
    { text: "AI experiments are documented in the AI channel.", channel: aiChannel, member: members[4] },
    { text: "Great progress today 👏", channel: generalChannel, member: members[0] },
  ];

  for (const msg of messages) {
    await ctx.db.insert("messages", {
      body: msg.text,
      channelId: msg.channel,
      memberId: msg.member,
      workspaceId,
      updatedAt: now,
    });
  }

  return { success: true };
});
