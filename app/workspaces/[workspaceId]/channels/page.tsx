// This file enables the /workspaces/[workspaceId]/channels route to exist and redirect to the first channel or show a message.
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ChannelsPage() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const channels = useQuery(api.dbqueries.getChannelsInWorkspace, userId && workspaceId ? { userId, workspaceId } : "skip");
  const createChannel = useMutation(api.dbqueries.createChannel);
  const [newChannel, setNewChannel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (channels && channels.length > 0) {
      router.replace(`/workspaces/${workspaceId}/channels/${channels[0]._id}`);
    }
  }, [channels, router, workspaceId]);

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

  if (!channels) return <div className="p-8">Loading channels...</div>;
  if (channels.length === 0) return (
    <div className="p-8">
      <div>No channels found in this workspace.</div>
      <form onSubmit={handleCreate} className="flex mt-4">
        <input
          className="p-2 border rounded-l"
          placeholder="New channel name"
          value={newChannel}
          onChange={e => setNewChannel(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r"
          disabled={creating || !newChannel.trim()}
        >
          {creating ? "Creating..." : "Create Channel"}
        </button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
  return null;
}
