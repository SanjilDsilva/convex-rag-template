"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function ChannelList({ workspaceId, channelId }: { workspaceId: string, channelId: string }) {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const channels = useQuery(api.dbqueries.getChannelsInWorkspace, userId && workspaceId ? { userId, workspaceId } : "skip");
  const createChannel = useMutation(api.dbqueries.createChannel);
  const [newChannel, setNewChannel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim() || !userId) return;
    setCreating(true);
    setError("");
    try {
      await createChannel({ name: newChannel, workspaceId, userId });
      setNewChannel("");
    } catch (err: any) {
      setError(err.message || "Error creating channel");
    }
    setCreating(false);
  };

  return (
    <div className="flex flex-row items-center bg-background-panel border-b border-background-secondary px-4 py-2">
      {channels?.map((c: any) => (
        <Link
          key={c._id}
          href={`/workspaces/${workspaceId}/channels/${c._id}`}
          className={`mr-4 px-2 py-1 rounded transition-colors duration-150 ${c._id === channelId ? "bg-accent text-text-primary" : "hover:bg-background-secondary text-text-secondary"}`}
        >
          #{c.name}
        </Link>
      ))}
      <form onSubmit={handleCreate} className="flex ml-auto">
        <input
          className="p-1 border border-background-secondary bg-background rounded-l text-sm text-text-primary placeholder-text-secondary focus:outline-accent"
          placeholder="New channel"
          value={newChannel}
          onChange={e => setNewChannel(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-accent text-text-primary px-2 py-1 rounded-r text-sm transition-colors duration-150 hover:bg-accent/80 focus:outline-accent"
          disabled={creating || !newChannel.trim()}
        >
          {creating ? "..." : "+"}
        </button>
      </form>
      {error && <span className="text-red-500 ml-2 text-xs">{error}</span>}
    </div>
  );
}
