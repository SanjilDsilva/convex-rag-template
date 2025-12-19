"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MessageList({ workspaceId, channelId }: { workspaceId: string, channelId: string }) {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const messages = useQuery(api.dbqueries.getMessagesInChannel, userId && workspaceId && channelId ? { userId, workspaceId, channelId } : "skip");
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-background-panel">
      {messages?.length ? (
        messages.map((msg: any) => (
          <div key={msg._id} className="mb-2">
            <span className="font-semibold text-accent">{msg.authorName || msg.userId}</span>
            <span className="ml-2 text-text-primary">{msg.body}</span>
          </div>
        ))
      ) : (
        <div className="text-text-secondary">No messages yet.</div>
      )}
    </div>
  );
}
