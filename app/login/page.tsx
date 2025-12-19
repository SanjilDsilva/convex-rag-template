"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const createUser = useMutation(api.dbqueries.createUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await createUser({ name, email });
      if (user && user._id) {
        localStorage.setItem("userId", user._id);
      }
      window.location.href = "/workspaces";
    } catch (err) {
      setError("Login failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form
        onSubmit={handleLogin}
        className="bg-background-panel p-8 rounded-xl shadow-soft w-full max-w-sm border border-background-secondary"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-text-primary">Sign in</h1>
        <input
          className="w-full mb-4 p-2 border border-background-secondary rounded bg-background text-text-primary placeholder-text-secondary focus:outline-accent"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="w-full mb-4 p-2 border border-background-secondary rounded bg-background text-text-primary placeholder-text-secondary focus:outline-accent"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          className="w-full bg-accent text-text-primary py-2 rounded-xl hover:bg-accent/80 transition-colors duration-150"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}