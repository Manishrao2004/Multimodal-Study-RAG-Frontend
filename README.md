# Verity Study Frontend

A React + TypeScript + Tailwind frontend for the Multimodal Study RAG backend.

## Run locally

1. Start the FastAPI backend on `http://localhost:8000`.
2. Copy `.env.example` to `.env.local` if the API runs elsewhere.
3. Install and start the frontend:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Included workflows

- Citation-grounded questions with evidence inspection and token grounding
- Screenshot paste/upload with optional knowledge-base retrieval
- Document and lecture-audio ingestion, status, search, and removal
- Citation-grounded summaries and source comparisons
- Traceable MCQ, short-answer, and flashcard generation
