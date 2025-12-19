"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MessageInput({ workspaceId, channelId }: { workspaceId: string, channelId: string }) {
  const [value, setValue] = useState("");
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const sendMessage = useMutation(api.dbqueries.createMessage);
  const ingestString = useMutation(api.ingest.ingestString);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !userId) return;
    const msg = await sendMessage({ userId, workspaceId, channelId, body: value });
    await ingestString({ messageId: msg._id, body: value });
    setValue("");
  };

  return (
    <form onSubmit={handleSend} className="flex p-2 border-t border-background-secondary bg-background-panel">
      <input
        className="flex-1 p-2 border border-background-secondary bg-background rounded mr-2 text-text-primary placeholder-text-secondary focus:outline-accent"
        placeholder="Type a message..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className="bg-accent text-text-primary px-4 py-2 rounded transition-colors duration-150 hover:bg-accent/80 focus:outline-accent">
        Send
      </button>
    </form>
  );
}
