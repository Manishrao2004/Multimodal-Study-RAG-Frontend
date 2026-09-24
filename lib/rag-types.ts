export type ChunkType = "text" | "table" | "visual" | "audio";

export type RetrievalMode = "bm25_only" | "dense_only" | "hybrid" | "full";

export interface Chunk {
  chunk_id: string;
  source_file: string;
  page_number: number | null;
  section_path: string | null;
  text: string;
  chunk_length: number;
  type: ChunkType;
  image_ref: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
}

export interface EvidenceItem {
  chunk: Chunk;
  rerank_score: number;
  attribution_score: number | null;
  attribution_percent: number | null;
}

export interface TokenGrounding {
  token: string;
  score: number;
  match_type: "exact" | "stem" | "substring" | "ungrounded";
}

export interface Citation {
  marker: number;
  chunk_id: string;
  valid: boolean;
}

export interface Disagreement {
  chunk_id_a: string;
  chunk_id_b: string;
  source_a: string;
  source_b: string;
  similarity: number;
  claim_a: string;
  claim_b: string;
  verified: boolean;
  explanation: string | null;
}

export interface AskResponse {
  answer: string;
  evidence: EvidenceItem[];
  token_grounding: TokenGrounding[] | null;
  citations: Citation[] | null;
  grounding_ratio: number | null;
  citation_validity_rate: number | null;
  disagreements: Disagreement[];
  mode: RetrievalMode;
  latency_ms: number | null;
  comprehensive: boolean;
  sources_considered: string[];
  sources_used: string[];
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ScreenshotAskResponse {
  answer: string;
  image_analysis: string;
  image_width: number;
  image_height: number;
  evidence: EvidenceItem[];
  citations: Citation[];
  grounding_ratio: number;
  citation_validity_rate: number;
  used_knowledge_base: boolean;
  saved: boolean;
  saved_chunk_id: string | null;
}

export interface DocumentSummary {
  source_file: string;
  chunk_count: number;
  text_chunks: number;
  table_chunks: number;
  visual_chunks: number;
  audio_chunks: number;
  pages: number | null;
}

export interface KnowledgeBaseStats {
  documents: number;
  chunks: number;
  by_type: Record<string, number>;
  index_ready: boolean;
}

export interface IngestResponse {
  source_file: string;
  chunks_added: number;
  text_chunks: number;
  table_chunks: number;
  visual_chunks: number;
  audio_chunks: number;
  figures_detected: number;
  figures_captioned: number;
  warnings: string[];
}

export interface StudyResponse {
  summary?: string;
  comparison?: string;
  evidence?: EvidenceItem[];
  evidence_a?: EvidenceItem[];
  evidence_b?: EvidenceItem[];
  citations: Citation[];
  citation_validity_rate: number;
  grounding_ratio?: number;
}

export interface QuizItem {
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  citation_marker: number | null;
  chunk_id: string | null;
  grounded: boolean;
}

export interface QuizResponse {
  items: QuizItem[];
  evidence: EvidenceItem[];
  grounded_rate: number;
  dropped: number;
}

export interface RuntimeConfig {
  llm: { provider: string; model: string; api_key_set: boolean };
  hyde: { enabled: boolean; provider: string; model: string; api_key_set: boolean };
  vlm: { provider: string; model: string; api_key_set: boolean };
  asr: { provider: string; model: string; api_key_set: boolean };
  embedding_model: string;
  reranker_model: string;
}
