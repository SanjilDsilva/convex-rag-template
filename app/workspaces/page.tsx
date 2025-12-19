"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkspacesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [wsName, setWsName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const workspaces = useQuery(api.dbqueries.getUserWorkspaces, userId ? { userId } : "skip");
  const createWorkspace = useMutation(api.dbqueries.createWorkspace);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !userId) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name: wsName, userId });
      setWsName("");
      if (ws && ws._id) router.push(`/workspaces/${ws._id}/channels`);
    } finally {
      setCreating(false);
    }
  };

  if (!userId) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-2xl font-bold mb-6 text-text-primary">Your Workspaces</h1>
      <form onSubmit={handleCreate} className="flex mb-4 w-full max-w-md">
        <input
          className="flex-1 p-2 border border-background-secondary rounded-l bg-background text-text-primary placeholder-text-secondary focus:outline-accent"
          placeholder="New workspace name"
          value={wsName}
          onChange={e => setWsName(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-accent text-text-primary px-4 py-2 rounded-r transition-colors duration-150 hover:bg-accent/80 focus:outline-accent"
          disabled={creating || !wsName.trim()}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>
      <div className="bg-background-panel rounded-xl shadow-soft p-6 w-full max-w-md border border-background-secondary">
        {workspaces?.length ? (
          <ul>
            {workspaces.map((ws: any) => (
              <li
                key={ws._id}
                className="mb-2 cursor-pointer hover:underline"
                onClick={() => router.push(`/workspaces/${ws._id}/channels`)}
              >
                {ws.name}
              </li>
            ))}
          </ul>
        ) : (
          <div>No workspaces found.</div>
        )}
      </div>
    </div>
  );
}