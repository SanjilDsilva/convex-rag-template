
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function generateLLMResponse(prompt: string, context = ""): Promise<string> {
  const { text } = await generateText({
    model: google("models/gemini-2.5-flash"),
    prompt: context ? `Context:\n${context}\n\nQuestion: ${prompt}` : prompt,
    temperature: 0.7,
    maxTokens: 500,
  });
  return text;
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const minChunkSize = 500;
  const maxChunkSize = 700;
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChunkSize, text.length);
    if (endIndex < text.length) {
      const searchStart = Math.max(startIndex + minChunkSize, endIndex - 200);
      const substring = text.substring(searchStart, endIndex);
      const lastPeriod = substring.lastIndexOf(". ");
      const lastQuestion = substring.lastIndexOf("? ");
      const lastExclamation = substring.lastIndexOf("! ");
      const sentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
      if (sentenceEnd !== -1) {
        endIndex = searchStart + sentenceEnd + 2;
      } else {
        const lastSpace = substring.lastIndexOf(" ");
        if (lastSpace !== -1) {
          endIndex = searchStart + lastSpace + 1;
        }
      }
    }
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex;
  }
  return chunks;
}