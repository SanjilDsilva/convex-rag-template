import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { embedText, generateLLMResponse } from "./utils";

export const askAssistant = action({
  args: {
    query: v.string(),
    userId: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
  },

  handler: async (ctx, args) => {
    if (!args.workspaceId) {
      return {
        answer: "Workspace context is required.",
        sources: [],
      };
    }

    // ---------------------------------------------------------------------
    // 1. EXTRACT CHANNEL NAME (if mentioned)
    // ---------------------------------------------------------------------
    const channelExtractionPrompt = `
You are an information extractor.

User query:
"${args.query}"

If the query mentions a channel name, extract it.

Examples:
- "What happened in general channel?" → {"channel":"general"}
- "Summarize announcements" → {"channel":"announcements"}
- "What did we discuss today?" → {"channel":null}

Return ONLY JSON:
{"channel": string | null}
`;

    const extractionRaw = await generateLLMResponse(
      channelExtractionPrompt,
      ""
    );

    let channelName: string | null = null;

    try {
      const parsed = JSON.parse(
        extractionRaw.replace(/```json|```/g, "").trim()
      );
      channelName = parsed.channel ?? null;
    } catch {
      console.log("Channel extraction failed");
    }

    // ---------------------------------------------------------------------
    // 2. RESOLVE CHANNEL ID (if name found)
    // ---------------------------------------------------------------------
    let channelId = null;

    if (channelName) {
      const channel = await ctx.runQuery(
        api.dbqueries.getChannelByName,
        {
          name: channelName,
          workspaceId: args.workspaceId,
        }
      );

      if (!channel) {
        return {
          answer: `I couldn't find a channel named "${channelName}".`,
          sources: [],
        };
      }

      channelId = channel._id;
    }

    // ---------------------------------------------------------------------
    // 3. CHAT SEARCH (Slack-like)
    // ---------------------------------------------------------------------
    if (channelId) {
      const messages = await ctx.runQuery(
        api.dbqueries.getMessagesInChannel,
        { channelId }
      );

      if (!messages.length) {
        return {
          answer: `No messages found in #${channelName}.`,
          sources: [],
        };
      }

      const messageContext = messages
        .map(m => `[${new Date(m._creationTime).toISOString()}] ${m.body}`)
        .join("\n");

      const chatPrompt = `
You are an AI assistant summarizing a developer chat channel.

INSTRUCTIONS:
- Provide a clear, structured summary of the conversation.
- Use Markdown headers (###) to organize sections.
- Use bullet points for lists, but simple paragraphs are allowed if better for flow.
- Highlight key decisions, blockers, and progress.
- Be concise but complete.

FORMAT:

### Summary
[Executive summary of the conversation]

### Key Discussions
- [Topic]: [Details]

### Decisions made
- [Decision]

### Open Issues
- [Issue]

USER QUESTION:
${args.query}

CHAT HISTORY:
${messageContext}
`;

      const answer = await generateLLMResponse(chatPrompt, "");
      return { answer, sources: [`#${channelName}`] };
    }

    // ---------------------------------------------------------------------
    // 4. FALLBACK → RAG SEARCH
    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
    // 4. FALLBACK → MIXED SEARCH (RAG + All Channels)
    // ---------------------------------------------------------------------

    // A. Fetch RAG Context
    const embedding = await embedText(args.query);
    const ragResults = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: embedding,
      limit: 5,
    });

    const ragChunks = await Promise.all(
      ragResults.map(r =>
        ctx.runQuery(api.askassistant.getEmbedding, { id: r._id })
      )
    );

    const ragContext = ragChunks
      .map((c, i) => `[Doc ${i + 1}] ${c?.text ?? ""}`)
      .join("\n\n");

    // B. Fetch Recent Chat Activity (Multi-channel)
    const [recentMessages, allChannels] = await Promise.all([
      ctx.runQuery(api.dbqueries.getAllMessages, {
        workspaceId: args.workspaceId,
      }),
      ctx.runQuery(api.dbqueries.getAllChannels, {
        workspaceId: args.workspaceId,
      }),
    ]);

    const channelMap = new Map(allChannels.map(c => [c._id, c.name]));

    // Group messages by channel
    const messagesByChannel = new Map<string, string[]>();

    // Reverse to show oldest first in context (natural reading order)
    [...recentMessages].reverse().forEach(m => {
      const chName = (m.channelId && channelMap.get(m.channelId)) || "unknown";
      if (!messagesByChannel.has(chName)) {
        messagesByChannel.set(chName, []);
      }
      messagesByChannel
        .get(chName)!
        .push(`[${new Date(m._creationTime).toISOString()}] ${m.body}`);
    });

    let chatContext = "";
    if (messagesByChannel.size > 0) {
      chatContext = "RECENT CHANNEL ACTIVITY:\n";
      for (const [chName, msgs] of messagesByChannel.entries()) {
        chatContext += `\n#${chName}:\n${msgs.join("\n")}\n`;
      }
    }

    // ---------------------------------------------------------------------
    // 5. GENERATE RESPONSE WITH MIXED CONTEXT
    // ---------------------------------------------------------------------

    const combinedContext = `
${ragContext ? "KNOWLEDGE BASE:\n" + ragContext : ""}

${chatContext}
`.trim();

    if (!combinedContext) {
      return {
        answer: "I don't have enough information (no documents or recent messages found).",
        sources: [],
      };
    }

    const mixedPrompt = `
You are a senior AI assistant for full-stack and AI engineers.

INSTRUCTIONS:
- Answer the question using the provided context (Knowledge Base + Recent Channel Activity).
- If the user asks for a summary or "what happened", group your answer by channel (e.g., "In #general...", "In #random...").
- If the user asks a specific question, answer directly.
- Use Markdown formatting (headers, bold, lists).
- If the answer is not in the context, say so clearly.

FORMAT:

### Answer/Summary
[Direct answer or Channel-wise summary]

### Key Details
- [Points]

QUESTION:
${args.query}

CONTEXT:
${combinedContext}
`;

    const answer = await generateLLMResponse(mixedPrompt, "");

    // Collect sources
    const uniqueChannels = Array.from(messagesByChannel.keys()).map(c => `#${c}`);
    const sources = [...(ragResults.length ? ["Knowledge Base"] : []), ...uniqueChannels];

    return { answer, sources };
  },
});
