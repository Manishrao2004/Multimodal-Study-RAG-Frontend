"use client";

/* eslint-disable @next/next/no-img-element -- Screenshot object URLs and the static SVG are rendered directly. */

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  History,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type {
  AnswerScope,
  AskResponse,
  ConversationDetail,
  ConversationSummary,
  RetrievalMode,
  ScreenshotAskResponse,
  StoredMessage,
} from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EvidencePanel } from "@/components/workbench/evidence-panel";
import { RichText } from "@/components/workbench/rich-text";

const ACTIVE_KEY = "verity-active-conversation";
type Answer = AskResponse | ScreenshotAskResponse;
const scopes: { value: AnswerScope; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "sources_only", label: "My sources" },
  { value: "model_only", label: "General knowledge" },
];
function isAsk(result: Answer): result is AskResponse {
  return "answer_basis" in result;
}
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function AnswerMessage({ message }: { message: StoredMessage }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const result = message.result;
  const evidence = result?.evidence ?? [];
  const basis = result && isAsk(result) ? result.answer_basis : "sources";
  const tokens = result && isAsk(result) ? result.token_grounding : null;
  const showCitation = (marker: number) => {
    setEvidenceOpen(true);
    window.requestAnimationFrame(() =>
      document
        .getElementById(`evidence-${message.id}-${marker}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the answer.");
    }
  };
  return (
    <article className="answer-message">
      <div className="answer-meta">
        <span className="font-semibold text-ink">Verity</span>
        <span
          className={cn(
            "provenance-dot",
            basis === "mixed" && "mixed",
            basis === "model" && "model",
          )}
        />
        <span>
          {basis === "model"
            ? "General knowledge"
            : basis === "mixed"
              ? "Sources + general knowledge"
              : "From your sources"}
        </span>
        <time
          className="ml-auto"
          dateTime={new Date(message.created_at * 1000).toISOString()}
        >
          {new Date(message.created_at * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
      <div className="answer-body">
        <RichText evidence={evidence} onCitationClick={showCitation}>
          {message.content}
        </RichText>
      </div>
      {result &&
        isAsk(result) &&
        result.provenance_notice &&
        basis !== "sources" && (
          <details className="answer-provenance">
            <summary>Answer provenance</summary>
            <p>{result.provenance_notice}</p>
          </details>
        )}
      {result &&
        isAsk(result) &&
        result.disagreements.map((item) => (
          <p
            className="answer-notice conflict"
            key={`${item.chunk_id_a}-${item.chunk_id_b}`}
          >
            {item.explanation ||
              `${item.source_a} and ${item.source_b} disagree.`}
          </p>
        ))}
      {result && !isAsk(result) && (
        <details className="mt-4 text-sm text-ink-muted">
          <summary>Image analysis</summary>
          <p className="mt-2 whitespace-pre-wrap">{result.image_analysis}</p>
        </details>
      )}
      <div className="answer-actions">
        {evidence.length > 0 && (
          <button
            type="button"
            onClick={() => setEvidenceOpen(!evidenceOpen)}
            aria-expanded={evidenceOpen}
          >
            <FileText className="size-3.5" />
            {evidence.length} evidence passages
            <ChevronDown
              className={cn("size-3", evidenceOpen && "rotate-180")}
            />
          </button>
        )}
        {tokens?.length ? (
          <button
            type="button"
            onClick={() => setGroundingOpen(!groundingOpen)}
            aria-expanded={groundingOpen}
          >
            Grounding{" "}
            {result?.grounding_ratio == null
              ? ""
              : `${Math.round(result.grounding_ratio * 100)}%`}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy answer"
          title="Copy answer"
          className="ml-auto"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
      {evidenceOpen && (
        <div className="evidence-drawer">
          <EvidencePanel
            items={evidence}
            title="Evidence"
            compact
            idPrefix={`evidence-${message.id}`}
          />
          {result?.citation_validity_rate != null && (
            <p className="mt-3 text-xs text-ink-muted">
              Citation validity:{" "}
              {Math.round(result.citation_validity_rate * 100)}%
            </p>
          )}
        </div>
      )}
      {groundingOpen && tokens && (
        <div className="token-drawer" aria-label="Token grounding">
          {tokens.map((token, index) => (
            <span
              key={index}
              title={`${token.match_type}: ${Math.round(token.score * 100)}%`}
              className={cn(
                token.score >= 0.8
                  ? "token-grounded"
                  : token.score >= 0.45
                    ? "token-partial"
                    : "token-unsupported",
              )}
            >
              {token.token}{" "}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function AskWorkspace({
  indexReady,
  onLibraryChanged,
}: {
  indexReady: boolean;
  onLibraryChanged?: () => void;
}) {
  const [sessions, setSessions] = useState<ConversationSummary[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [failure, setFailure] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scope, setScope] = useState<AnswerScope>("auto");
  const [mode, setMode] = useState<RetrievalMode>("full");
  const [topK, setTopK] = useState(5);
  const [comprehensive, setComprehensive] = useState(false);
  const [contradictions, setContradictions] = useState(true);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [saveImage, setSaveImage] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const selectionRef = useRef(0);
  const retryRef = useRef<{ signature: string; id: string } | null>(null);

  const remember = (id: string) => {
    try {
      window.localStorage.setItem(ACTIVE_KEY, id);
    } catch {
      /* Server remains the source of truth. */
    }
  };
  const updateSession = useCallback((detail: ConversationDetail) => {
    setSessions((current) =>
      [detail, ...current.filter((item) => item.id !== detail.id)].sort(
        (a, b) => b.updated_at - a.updated_at,
      ),
    );
  }, []);
  const load = useCallback(async () => {
    setInitializing(true);
    setConnectionError("");
    try {
      try {
        const raw = window.localStorage.getItem(
          "verity-study-chat-sessions-v1",
        );
        const migrated = window.localStorage.getItem(
          "verity-chat-migration-v2",
        );
        if (raw && !migrated) {
          const legacy = JSON.parse(raw) as {
            sessions?: {
              id: string;
              title: string;
              messages: {
                role: "user" | "assistant";
                content: string;
                evidence?: AskResponse["evidence"];
              }[];
            }[];
          };
          for (const session of legacy.sessions ?? []) {
            if (session.messages.length)
              await api.importConversation({
                id: session.id,
                title: session.title.slice(0, 120),
                messages: session.messages,
              });
          }
          window.localStorage.setItem("verity-chat-migration-v2", "complete");
        }
      } catch {
        toast.warning(
          "Some browser history could not be imported. The original history is still stored in this browser.",
        );
      }
      const list = await api.conversations();
      setSessions(list);
      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem(ACTIVE_KEY);
      } catch {
        /* Storage may be disabled. */
      }
      const id = list.find((item) => item.id === saved)?.id ?? list[0]?.id;
      if (id) {
        const detail = await api.conversation(id);
        setConversation(detail);
        remember(id);
      }
    } catch (error) {
      setConnectionError(errorMessage(error));
    } finally {
      setInitializing(false);
    }
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation?.messages.length, loading]);
  useEffect(() => {
    const field = textareaRef.current;
    if (field) {
      field.style.height = "auto";
      field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
    }
  }, [query]);

  const attach = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Choose an image smaller than 10 MB.");
      return;
    }
    setImage(file);
  };
  const newChat = () => {
    if (busyRef.current) return;
    selectionRef.current++;
    setConversation(null);
    setQuery("");
    setImage(null);
    setFailure("");
    setHistoryOpen(false);
    retryRef.current = null;
    textareaRef.current?.focus();
  };
  const openChat = async (id: string) => {
    if (busyRef.current) return;
    const selection = ++selectionRef.current;
    setHistoryOpen(false);
    setInitializing(true);
    setFailure("");
    try {
      const detail = await api.conversation(id);
      if (selection !== selectionRef.current) return;
      setConversation(detail);
      remember(id);
      setQuery("");
      setImage(null);
      retryRef.current = null;
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      if (selection === selectionRef.current) setInitializing(false);
    }
  };
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = query.trim();
    if (!question || busyRef.current || initializing || connectionError) return;
    if (!image && scope === "sources_only" && !indexReady) {
      setFailure("Add a source to your library before using My sources.");
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setFailure("");
    setPendingQuestion(question);
    setQuery("");
    try {
      const current = conversation ?? (await api.createConversation());
      if (!conversation) {
        setConversation(current);
        remember(current.id);
        updateSession(current);
      }
      const signature = JSON.stringify([
        current.id,
        current.revision,
        question,
        scope,
        mode,
        topK,
        comprehensive,
        contradictions,
        image?.name,
        image?.lastModified,
        useKnowledgeBase,
        saveImage,
      ]);
      const requestId =
        retryRef.current?.signature === signature
          ? retryRef.current.id
          : crypto.randomUUID();
      retryRef.current = { signature, id: requestId };
      let detail: ConversationDetail;
      if (image) {
        const body = new FormData();
        body.append("question", question);
        body.append("image", image);
        body.append("request_id", requestId);
        body.append("revision", String(current.revision));
        body.append("top_k", String(Math.min(topK, 10)));
        body.append("use_knowledge_base", String(useKnowledgeBase));
        body.append("save_to_library", String(saveImage));
        detail = await api.conversationVision(current.id, body);
      } else {
        detail = await api.conversationAsk(current.id, {
          query: question,
          request_id: requestId,
          revision: current.revision,
          top_k: topK,
          mode,
          comprehensive,
          detect_contradictions: contradictions,
          answer_scope: scope,
        });
      }
      setConversation(detail);
      updateSession(detail);
      retryRef.current = null;
      setImage(null);
      const result = detail.messages.at(-1)?.result;
      if (result && "saved" in result && result.saved) onLibraryChanged?.();
    } catch (error) {
      setQuery(question);
      setFailure(errorMessage(error));
      if (error instanceof ApiError && error.status === 409 && conversation) {
        try {
          const latest = await api.conversation(conversation.id);
          setConversation(latest);
          updateSession(latest);
        } catch {
          /* Keep the draft for a later retry. */
        }
      }
    } finally {
      busyRef.current = false;
      setLoading(false);
      setPendingQuestion("");
      textareaRef.current?.focus();
    }
  };
  const rename = async (event: FormEvent) => {
    event.preventDefault();
    if (!renameId || !renameTitle.trim()) return;
    try {
      const detail = await api.renameConversation(renameId, renameTitle.trim());
      updateSession(detail);
      if (conversation?.id === detail.id) setConversation(detail);
      setRenameId(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.deleteConversation(deleteId);
      setSessions((current) => current.filter((item) => item.id !== deleteId));
      if (conversation?.id === deleteId) newChat();
      setDeleteId(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const exportChat = () => {
    if (!conversation) return;
    const text =
      `# ${conversation.title}\n\n` +
      conversation.messages
        .map(
          (message) =>
            `## ${message.role === "user" ? "You" : "Verity"}\n\n${message.content}\n` +
            (message.result?.evidence
              .map(
                (item, index) =>
                  `\n[${index + 1}] ${item.chunk.source_file}${item.chunk.page_number ? `, p.${item.chunk.page_number}` : ""}: ${item.chunk.text}`,
              )
              .join("\n") ?? ""),
        )
        .join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `verity-${conversation.id.slice(0, 8)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const history = (
    <>
      <div className="history-heading">
        <span>Conversations</span>
        <button
          type="button"
          onClick={newChat}
          disabled={loading}
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <label className="history-search">
        <Search className="size-4" />
        <input
          aria-label="Search conversations"
          placeholder="Search conversations"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="history-list">
        {sessions
          .filter((item) =>
            item.title.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => (
            <div
              className={cn(
                "history-row",
                conversation?.id === item.id && "active",
              )}
              key={item.id}
            >
              <button
                type="button"
                disabled={loading}
                onClick={() => void openChat(item.id)}
                className="history-select"
              >
                <span>{item.title}</span>
                <small>
                  {new Date(item.updated_at * 1000).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                  )}
                </small>
              </button>
              <div className="history-tools">
                <button
                  type="button"
                  disabled={loading}
                  title="Rename conversation"
                  aria-label={`Rename ${item.title}`}
                  onClick={() => {
                    setRenameId(item.id);
                    setRenameTitle(item.title);
                  }}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={loading}
                  title="Delete conversation"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        {sessions.length === 0 && (
          <p className="history-empty">No conversations yet.</p>
        )}
      </div>
      <div className="history-footer">
        <span className={cn("status-dot", !indexReady && "empty")} />
        {indexReady ? "Library ready" : "No sources added"}
      </div>
    </>
  );

  return (
    <div className="study-chat">
      <aside className="conversation-sidebar">{history}</aside>
      <section className="conversation-main" aria-label="Study conversation">
        <div className="conversation-toolbar">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setHistoryOpen(true)}
            aria-label="Open conversations"
          >
            <History />
          </Button>
          <h1>{conversation?.title || "New conversation"}</h1>
          <div className="ml-auto flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={exportChat}
              disabled={!conversation?.messages.length}
              title="Export conversation"
              aria-label="Export conversation"
            >
              <Download />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
              title="Conversation settings"
              aria-label="Conversation settings"
            >
              <Settings2 />
            </Button>
          </div>
        </div>
        <div className="conversation-scroll">
          {connectionError ? (
            <div className="chat-empty">
              <MessageSquare className="size-8 text-ink-faint" />
              <h2>Unable to load conversations</h2>
              <p>{connectionError}</p>
              <Button variant="outline" onClick={() => void load()}>
                Reconnect
              </Button>
            </div>
          ) : initializing ? (
            <div className="chat-empty" role="status">
              <LoaderCircle className="size-6 animate-spin text-ink-muted" />
              <p>Loading conversation...</p>
            </div>
          ) : !conversation?.messages.length && !loading ? (
            <div className="chat-empty">
              <img src="/favicon.svg" alt="" width="44" height="44" />
              <h2>What are you studying?</h2>
              <p>
                {indexReady
                  ? "Your sources are ready."
                  : "Start a conversation or add material to your library."}
              </p>
              <div className="empty-suggestions">
                {[
                  "Explain a concept",
                  "Compare two ideas",
                  "Work through a problem",
                ].map((text) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => {
                      setQuery(text + ": ");
                      textareaRef.current?.focus();
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {!initializing && (
            <div className="conversation-transcript">
              {conversation?.messages.map((message) =>
                message.role === "assistant" ? (
                  <AnswerMessage key={message.id} message={message} />
                ) : (
                  <div className="user-message" key={message.id}>
                    <span>You</span>
                    <p>{message.content}</p>
                  </div>
                ),
              )}
              {loading && (
                <>
                  <div className="user-message">
                    <span>You</span>
                    <p>{pendingQuestion}</p>
                  </div>
                  <div className="generation-status" role="status">
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Preparing your answer...</span>
                  </div>
                </>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <div className="composer-region">
          {failure && (
            <div className="request-error" role="alert">
              <p>{failure}</p>
              <button
                type="button"
                onClick={() => setFailure("")}
                aria-label="Dismiss error"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <form
            onSubmit={submit}
            className="chat-composer"
            onPaste={(event) => {
              const file = Array.from(event.clipboardData.files).find((item) =>
                item.type.startsWith("image/"),
              );
              if (file) {
                event.preventDefault();
                attach(file);
              }
            }}
          >
            {image && (
              <div className="composer-attachment">
                {preview && <img src={preview} alt="Attached screenshot" />}
                <span>{image.name}</span>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  disabled={loading}
                  aria-label="Remove attachment"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              aria-label="Message"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loading || initializing || Boolean(connectionError)}
              maxLength={4000}
              rows={2}
              placeholder={
                image ? "Ask about this image..." : "Ask a question..."
              }
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <div className="composer-tools">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  attach(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                title="Attach image"
                aria-label="Attach image"
              >
                <Paperclip />
              </Button>
              <select
                aria-label="Knowledge scope"
                value={scope}
                disabled={loading || Boolean(image)}
                onChange={(event) =>
                  setScope(event.target.value as AnswerScope)
                }
              >
                {scopes.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {image && (
                <span className="text-xs text-ink-muted">Image question</span>
              )}
              <Button
                type="submit"
                size="icon-sm"
                className="ml-auto"
                disabled={
                  loading ||
                  initializing ||
                  Boolean(connectionError) ||
                  !query.trim()
                }
                aria-label="Send message"
                title="Send message"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowUp />
                )}
              </Button>
            </div>
          </form>
          <div className="composer-caption">
            <span>
              {loading
                ? "Generating"
                : conversation
                  ? "Conversation saved"
                  : "New conversation"}
            </span>
            <span>
              {query.length > 3500 ? `${query.length}/4000` : "Verity Study"}
            </span>
          </div>
        </div>
      </section>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="bg-card p-4">
          <SheetHeader className="sr-only">
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Saved conversations</SheetDescription>
          </SheetHeader>
          {history}
        </SheetContent>
      </Sheet>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-card">
          <SheetHeader>
            <SheetTitle>Conversation settings</SheetTitle>
            <SheetDescription>Sources and answer preferences</SheetDescription>
          </SheetHeader>
          <div className="conversation-settings">
            <label>
              Retrieval
              <select
                value={mode}
                disabled={loading}
                onChange={(event) =>
                  setMode(event.target.value as RetrievalMode)
                }
              >
                <option value="full">Full pipeline</option>
                <option value="hybrid">Hybrid</option>
                <option value="dense_only">Semantic</option>
                <option value="bm25_only">Keyword</option>
              </select>
            </label>
            <label>
              Evidence passages
              <input
                type="number"
                min={1}
                max={image ? 10 : 20}
                value={topK}
                disabled={loading}
                onChange={(event) =>
                  setTopK(
                    Math.max(
                      1,
                      Math.min(
                        image ? 10 : 20,
                        Number(event.target.value) || 1,
                      ),
                    ),
                  )
                }
              />
            </label>
            <div>
              <span>Source diversity</span>
              <Switch
                checked={comprehensive}
                disabled={loading}
                onCheckedChange={setComprehensive}
              />
            </div>
            <div>
              <span>Detect source conflicts</span>
              <Switch
                checked={contradictions}
                disabled={loading}
                onCheckedChange={setContradictions}
              />
            </div>
            <div>
              <span>Use library for images</span>
              <Switch
                checked={useKnowledgeBase}
                disabled={loading}
                onCheckedChange={setUseKnowledgeBase}
              />
            </div>
            <div>
              <span>Save images to library</span>
              <Switch
                checked={saveImage}
                disabled={loading}
                onCheckedChange={setSaveImage}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        open={Boolean(renameId)}
        onOpenChange={(open) => {
          if (!open) setRenameId(null);
        }}
      >
        <SheetContent className="bg-card">
          <SheetHeader>
            <SheetTitle>Rename conversation</SheetTitle>
            <SheetDescription>Conversation title</SheetDescription>
          </SheetHeader>
          <form onSubmit={rename} className="conversation-settings">
            <input
              aria-label="Conversation title"
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              maxLength={120}
              autoFocus
            />
            <Button type="submit" disabled={!renameTitle.trim()}>
              Save
            </Button>
          </form>
        </SheetContent>
      </Sheet>
      <Sheet
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <SheetContent className="bg-card">
          <SheetHeader>
            <SheetTitle>Delete conversation?</SheetTitle>
            <SheetDescription>
              This removes the conversation and its saved answers.
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-2 p-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void remove()}>
              Delete conversation
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
