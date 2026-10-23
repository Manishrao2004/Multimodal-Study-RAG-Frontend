import type {
  AskResponse,
  ConversationDetail,
  ConversationSummary,
  EvidenceItem,
  AnswerScope,
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

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 20000,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new ApiError(
        "The request timed out. Please retry; your message has been kept.",
        408,
      );
    }
    throw new ApiError(
      "Could not reach the study engine. Make sure the backend is running on port 8000.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        detail?: string | { msg: string }[];
      };
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail))
        message = body.detail.map((item) => item.msg).join("; ");
    } catch {
      // Keep the status-based fallback for non-JSON responses.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return null as T;
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
  conversations: () => request<ConversationSummary[]>("/conversations"),
  createConversation: () =>
    request<ConversationDetail>(
      "/conversations",
      json({ title: "New conversation" }),
    ),
  importConversation: (body: {
    id: string;
    title: string;
    messages: {
      role: "user" | "assistant";
      content: string;
      evidence?: EvidenceItem[];
    }[];
  }) => request<ConversationDetail>("/conversations/import", json(body)),
  conversation: (id: string) =>
    request<ConversationDetail>(`/conversations/${encodeURIComponent(id)}`),
  renameConversation: (id: string, title: string) =>
    request<ConversationDetail>(`/conversations/${encodeURIComponent(id)}`, {
      ...json({ title }),
      method: "PATCH",
    }),
  deleteConversation: async (id: string) => {
    await request<null>(`/conversations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  conversationAsk: (
    id: string,
    body: {
      query: string;
      request_id: string;
      revision: number;
      top_k: number;
      mode: RetrievalMode;
      detect_contradictions: boolean;
      comprehensive: boolean;
      answer_scope: AnswerScope;
    },
  ) =>
    request<ConversationDetail>(
      `/conversations/${encodeURIComponent(id)}/ask`,
      json(body),
      300000,
    ),
  conversationVision: (id: string, body: FormData) =>
    request<ConversationDetail>(
      `/conversations/${encodeURIComponent(id)}/vision`,
      { method: "POST", body },
      300000,
    ),
  ask: (body: {
    query: string;
    top_k: number;
    mode: RetrievalMode;
    detect_contradictions: boolean;
    comprehensive?: boolean;
    history?: ConversationTurn[];
    answer_scope?: AnswerScope;
  }) => request<AskResponse>("/ask", json(body), 300000),
  visionAsk: (body: FormData) =>
    request<ScreenshotAskResponse>(
      "/vision/ask",
      { method: "POST", body },
      300000,
    ),
  ingest: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<IngestResponse>("/ingest", { method: "POST", body }, 600000);
  },
  deleteDocument: (name: string) =>
    request<{ source_file: string; chunks_removed: number }>(
      `/documents/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    ),
  summarize: (body: {
    topic: string;
    top_k: number;
    source_file: string | null;
  }) => request<StudyResponse>("/study/summarize", json(body), 300000),
  compare: (body: {
    topic: string;
    source_a: string;
    source_b: string;
    top_k: number;
  }) => request<StudyResponse>("/study/compare", json(body), 300000),
  quiz: (body: {
    topic: string;
    count: number;
    format: string;
    top_k: number;
    source_file: string | null;
  }) => request<QuizResponse>("/study/quiz", json(body), 300000),
};

export function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
