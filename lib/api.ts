import type {
  AskResponse,
  ConversationTurn,
  DocumentSummary,
  IngestResponse,
  KnowledgeBaseStats,
  QuizResponse,
  RetrievalMode,
  RuntimeConfig,
  ScreenshotAskResponse,
  StudyResponse,
} from "@/lib/rag-types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError("Could not reach the study engine. Make sure the backend is running on port 8000.", 0);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      // Keep the status-based fallback for non-JSON responses.
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  health: () => request<{ status: string }>("/health"),
  config: () => request<RuntimeConfig>("/config"),
  documents: () => request<DocumentSummary[]>("/documents"),
  stats: () => request<KnowledgeBaseStats>("/documents/stats"),
  ask: (body: { query: string; top_k: number; mode: RetrievalMode; detect_contradictions: boolean; comprehensive?: boolean; history?: ConversationTurn[] }) =>
    request<AskResponse>("/ask", json(body)),
  visionAsk: (body: FormData) => request<ScreenshotAskResponse>("/vision/ask", { method: "POST", body }),
  ingest: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<IngestResponse>("/ingest", { method: "POST", body });
  },
  deleteDocument: (name: string) =>
    request<{ source_file: string; chunks_removed: number }>(`/documents/${encodeURIComponent(name)}`, { method: "DELETE" }),
  summarize: (body: { topic: string; top_k: number; source_file: string | null }) =>
    request<StudyResponse>("/study/summarize", json(body)),
  compare: (body: { topic: string; source_a: string; source_b: string; top_k: number }) =>
    request<StudyResponse>("/study/compare", json(body)),
  quiz: (body: { topic: string; count: number; format: string; top_k: number; source_file: string | null }) =>
    request<QuizResponse>("/study/quiz", json(body)),
};

export function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
