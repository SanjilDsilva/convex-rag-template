"use client";


import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import styles from "./page.module.css";

export default function Home() {

  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setWorkspaceId(localStorage.getItem("workspaceId"));
  }, []);

  const ingestDocument = useAction(api.ingest.ingestDocument);
  const askAssistant = useAction(api.askassistant.askAssistant);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setUploadStatus("Processing...");

    try {
      let text = "";

      if (file.type === "application/pdf") {
        // Send to API route for PDF parsing
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to parse PDF");
        const data = await response.json();
        text = data.text;
      } else {
        // Read text file directly
        text = await file.text();
      }

      // Send to Convex
      await ingestDocument({ text });
      setUploadStatus("✓ Document uploaded and processed!");
      setFile(null);
    } catch (error) {
      setUploadStatus("✗ Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const handleAsk = async () => {
    if (!query.trim() || !userId || !workspaceId) return;

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const result = await askAssistant({ query, userId, workspaceId });
      setAnswer(result.answer);
      setSources(result.sources);
    } catch (error) {
      setAnswer("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };


  if (!userId) {
    return (
      <div className={styles.container}>
        <p>Please log in to continue.</p>
        <a href="/login" className={styles.button}>Go to Login</a>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className={styles.container}>
        <p>Please select a workspace.</p>
        <a href="/workspaces" className={styles.button}>Go to Workspaces</a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📚 RAG Document Chat</h1>
        <p>Upload documents and ask questions about them</p>
      </header>

      <main className={styles.main}>
        {/* Upload Section */}
        <section className={styles.section}>
          <h2>Upload Document</h2>
          <div className={styles.uploadBox}>
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={styles.fileLabel}>
              {file ? file.name : "Choose file (.txt or .pdf)"}
            </label>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={styles.button}
            >
              {loading ? "Processing..." : "Upload & Process"}
            </button>
          </div>
          {uploadStatus && (
            <p className={styles.status}>{uploadStatus}</p>
          )}
        </section>

        {/* Question Section */}
        <section className={styles.section}>
          <h2>Ask a Question</h2>
          <div className={styles.queryBox}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAsk()}
              placeholder="What would you like to know?"
              className={styles.input}
            />
            <button
              onClick={handleAsk}
              disabled={!query.trim() || loading}
              className={styles.button}
            >
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>
        </section>

        {/* Answer Section */}
        {answer && (
          <section className={styles.section}>
            <h2>Answer</h2>
            <div className={styles.answer}>
              <p>{answer}</p>
            </div>
            {sources.length > 0 && (
              <div className={styles.sources}>
                <h3>Sources</h3>
                {sources.map((source, idx) => (
                  <div key={idx} className={styles.source}>
                    <span className={styles.sourceNum}>{idx + 1}</span>
                    <p>{source}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
