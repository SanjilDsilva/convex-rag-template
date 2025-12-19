"use client";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loader from "./Loader";

export default function AssistantPanel({ workspaceId, channelId }: { workspaceId?: string, channelId?: string }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const askAssistant = useAction(api.askassistant.askAssistant);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !userId || !workspaceId) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    try {
      const res = await askAssistant({
        query,
        userId,
        workspaceId,
        channelId,
      });
      setAnswer(res.answer);
      setSources(res.sources);
    } catch (err) {
      setAnswer("Error: Could not get answer.");
    }
    setLoading(false);
  };

  return (
    <div className="w-96 bg-background-panel border-l border-background-secondary flex flex-col h-full p-4">
      <h2 className="font-bold mb-2 text-lg text-text-primary">AI Assistant</h2>
      <form onSubmit={handleAsk} className="flex mb-2">
        <input
          className="flex-1 p-2 border border-background-secondary bg-background rounded mr-2 text-text-primary placeholder-text-secondary focus:outline-accent"
          placeholder="Ask a question..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="bg-accent text-text-primary px-4 py-2 rounded transition-colors duration-150 hover:bg-accent/80 focus:outline-accent">
          Ask
        </button>
      </form>
      {loading && <Loader />}
      {answer && (
        <div className="bg-background rounded p-3 shadow-soft mb-2">
          <div className="mb-2 whitespace-pre-line text-text-primary">{answer}</div>
          {sources.length > 0 && (
            <div className="text-xs text-text-secondary">Sources: {sources.join(", ")}</div>
          )}
        </div>
      )}
    </div>
  );
}
