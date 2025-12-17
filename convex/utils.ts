<<<<<<< HEAD
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
=======
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, generateText } from "ai";

/** Create chunks for RAG */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
<<<<<<< Updated upstream
  const minChunkSize = 500;
  const maxChunkSize = 700;
  
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChunkSize, text.length);
    
    // If we're not at the end of the text, try to break at a sentence or word boundary
    if (endIndex < text.length) {
      // Look for sentence endings within the last 200 chars of the chunk
      const searchStart = Math.max(startIndex + minChunkSize, endIndex - 200);
      const substring = text.substring(searchStart, endIndex);
      const lastPeriod = substring.lastIndexOf(". ");
      const lastQuestion = substring.lastIndexOf("? ");
      const lastExclamation = substring.lastIndexOf("! ");
      
      const sentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
      
      if (sentenceEnd !== -1) {
        endIndex = searchStart + sentenceEnd + 2; // Include the punctuation and space
      } else {
        // If no sentence boundary, try to break at a space
        const lastSpace = text.lastIndexOf(" ", endIndex);
        if (lastSpace > startIndex + minChunkSize) {
          endIndex = lastSpace + 1;
        }
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex;
  }
  
=======
  const size = 600;

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
>>>>>>> Stashed changes
  return chunks;
}

/** Generate embeddings */
export async function embedText(text: string): Promise<number[]> {
<<<<<<< Updated upstream
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
  }
  
=======
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
>>>>>>> Stashed changes
  const google = createGoogleGenerativeAI({ apiKey });
  
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });
  
  return embedding;
}

<<<<<<< Updated upstream
/**
 * Generate LLM response using Gemini 2.5 Flash
 */
export async function generateLLMResponse(
  prompt: string,
  context: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
  }
  
  const google = createGoogleGenerativeAI({ apiKey });
  
  const { text } = await generateText({
    model: google("models/gemini-2.5-flash"),
    prompt: `Context:\n${context}\n\nQuestion: ${prompt}\n\nPlease answer the question based on the context provided above. If the answer is not in the context, say so.`,
    temperature: 0.7,
    maxTokens: 500,
  });
  
=======
/** Generate LLM answer */
export async function generateLLMResponse(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
  const google = createGoogleGenerativeAI({ apiKey });

  const { text } = await generateText({
    model: google("models/gemini-2.5-flash"),
    prompt: `Context:\n${context}\n\nQuestion: ${prompt}`,
  });

>>>>>>> Stashed changes
  return text;
}
>>>>>>> 368316ad71f416805513bbc89e050b931cb2bba4
