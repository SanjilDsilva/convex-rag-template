# Quick Setup Guide

This is a template for a RAG (Retrieval Augmented Generation) document chat system.

## 🚀 Deploy Your Own

### 1. Clone this template
Click "Use this template" button on GitHub or clone directly:
```bash
git clone <your-repo-url>
cd convex_rag
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Convex
```bash
npx convex dev
```
- Create a new Convex project or select existing
- This will create `.env.local` with your Convex URL

### 4. Set up Google AI API Key

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

Set it in Convex environment:
```bash
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY your-api-key-here
```

### 5. Start the app

In one terminal (Convex):
```bash
npm run convex
```

In another terminal (Next.js):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ You're Ready!

1. Upload a document (.txt or .pdf)
2. Ask questions about it
3. Get AI-powered answers with source citations

## 📝 Configuration

- **Embedding Model**: Google text-embedding-004 (768 dimensions)
- **LLM Model**: Google gemini-1.5-flash
- **Chunk Size**: 500-700 characters
- **Vector Search**: Top 5 relevant chunks

## 🔧 Customization

Edit these files to customize:
- `convex/utils.ts` - Change models, chunk size, or temperature
- `app/page.tsx` - Modify UI and functionality
- `convex/schema.ts` - Adjust database schema

## 📚 Learn More

- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI Documentation](https://ai.google.dev)
