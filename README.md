# RAG Document Chat

A full-stack Retrieval Augmented Generation (RAG) system built with Convex, Next.js, and Google AI.

## Features

- 📤 Upload text and PDF documents
- 🔍 Vector-based semantic search
- 💬 AI-powered question answering
- 🎨 Modern dark-themed UI
- ⚡ Real-time processing with Convex

## Tech Stack

**Backend:**
- Convex (serverless backend with vector search)
- Google AI (text-embedding-004 for embeddings)
- Google AI (gemini-1.5-flash for generation)

**Frontend:**
- Next.js 15
- React 19
- TypeScript
- PDF parsing support

## Getting Started

### Prerequisites

- Node.js 18+
- Google AI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=your-convex-url
```

3. Set Google API key in Convex:
```bash
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY your-api-key
```

### Development

1. Start Convex dev server:
```bash
npm run convex
```

2. In a new terminal, start Next.js:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a document** - Click "Choose file" and select a .txt or .pdf file
2. **Process the document** - Click "Upload & Process" to chunk and embed the text
3. **Ask questions** - Type your question and press Enter or click "Ask"
4. **View results** - See AI-generated answers with source citations

## Project Structure

```
convex_rag/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── parse-pdf/     # PDF parsing endpoint
│   ├── page.tsx           # Main UI
│   └── layout.tsx         # Root layout
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── ingest.ts          # Document ingestion
│   ├── askassistant.ts    # RAG query handler
│   └── utils.ts           # Helper functions
└── package.json
```

## How It Works

1. **Document Ingestion**:
   - Document is split into 500-700 character chunks
   - Each chunk is embedded using Google's text-embedding-004 (768 dimensions)
   - Embeddings are stored in Convex with vector index

2. **Question Answering**:
   - User query is embedded using the same model
   - Vector search finds top 5 most relevant chunks
   - Relevant chunks are passed as context to Gemini 1.5 Flash
   - AI generates an answer based on the context

## License

MIT
