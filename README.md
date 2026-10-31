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

## Answer modes and checking

In chat, **Auto** chooses between source-based, mixed, and general-knowledge
answers; **My sources** restricts the answer to uploaded material; **General
knowledge** does not retrieve documents. The backend normally uses its
`aspect` evidence method for source-aware chat. This is an internal checking
process, not a model or a frontend mode. It can withhold claims or show
excerpts when verification fails. Checks are model-assisted and can be wrong.

Summaries, comparisons, quizzes, flashcards, and screenshot questions have
separate generation paths; they do not currently use the complete chat claim
audit. Citation markers and grounding indicators are not proof of factuality.
Study sessions are saved only in this browser (up to 12); reopening a practice
session starts practice again. Chat conversations are stored by the backend.

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
app. PDF, Word and PowerPoint show their formatted pages immediately in the compact
preview. Word/PowerPoint conversion uses local Microsoft Office or LibreOffice.
Fit page is the default; fit width, numeric zoom, keyboard arrows and page/slide
jumping are available. The Text tab provides extracted content separately.

Open full document opens `/reader?source=...&page=...` in a separate tab, preserving
the selected file and current page. It does not resize the sheet, activate browser
fullscreen or download the original file. The dedicated reader uses the available
window height, including on mobile. HTML, Markdown and plain text use a safe text
view; audio is
represented by its saved transcript. Cited passages are
highlighted in the reading view. Missing originals retain the saved evidence.

Study engine settings include a country/region preference, defaulting to India
and INR examples. The browser sends its timezone for current dates and scheduling;
no GPS or precise location is collected. Explicit countries/currencies in a
question override the default. Current legal, financial and other changing facts
still require verification; the app does not claim to have searched the web.
