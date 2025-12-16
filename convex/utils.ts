import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------
// LLM: Gemini 2.5 Flash
// ---------------------
export async function generateLLMResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google("models/gemini-2.5-flash"),
    prompt,
  });

  return text;
}
// ------------------------
// Embeddings for DB RAG
// ------------------------
export async function embedText(text: string): Promise<number[]> {
  // Requires: npm install @google/generative-ai
  // And set GOOGLE_API_KEY in your .env file
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
