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

## Conversations

Conversation transcripts and complete answer metadata are persisted by the
backend. A fresh launch opens a new conversation without selecting old history.
Older browser
sessions are imported once, without removing their original local storage.

The workspace supports conversation search, rename, delete, Markdown export,
image questions, per-answer evidence inspection, and token grounding. Each
submission carries a revision and an idempotency key, so retries cannot duplicate
completed turns. Failed submissions preserve the draft. Navigation preserves
the state of previously opened workspaces and in-flight operations.

The API connection timeout is 20 seconds; generation requests allow five minutes
and document ingestion allows ten. The backend continues to own conversation
state if a browser request times out.

Validation: `npm run build`, `npm run lint`, and `npx tsc --noEmit --incremental false`.

## Interface

The workspace is dark-only. Navigation and searchable history share one sidebar;
mobile navigation, settings, and evidence open only on request. General-knowledge
and document-supported answer provenance remain distinct. The design system is
documented in `DESIGN.md`, with product constraints in `PRODUCT.md`.

## Sources and answer context

Click a library source name or an answer citation to open its viewer inside the
app. PDF pages render as images with page navigation, avoiding browser download
prompts. Office documents, HTML, Markdown and text show indexed content; original
Open full document renders the original Word pages and PowerPoint slides locally
through Microsoft Office (Windows) or LibreOffice, retaining their visual layout.
The reader includes Previous/Next, direct page/slide selection and zoom. This does
not activate browser fullscreen or download the original file. Extracted text
is available separately as a fallback. Audio is
represented by its saved transcript. Cited passages are
highlighted in the reading view. Missing originals retain the saved evidence.

Study engine settings include a country/region preference, defaulting to India
and INR examples. The browser sends its timezone for current dates and scheduling;
no GPS or precise location is collected. Explicit countries/currencies in a
question override the default. Current legal, financial and other changing facts
still require verification; the app does not claim to have searched the web.
