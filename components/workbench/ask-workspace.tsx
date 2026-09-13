"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Gauge,
  LoaderCircle,
  Paperclip,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { AskResponse, RetrievalMode, ScreenshotAskResponse } from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EvidencePanel } from "@/components/workbench/evidence-panel";
import { RichText } from "@/components/workbench/rich-text";

const promptIdeas = [
  "Explain the key idea and cite the strongest evidence",
  "What do my sources disagree about?",
  "Turn this topic into a concise exam answer",
];

const modes: { value: RetrievalMode; label: string; detail: string }[] = [
  { value: "full", label: "Full pipeline", detail: "HyDE + hybrid retrieval + reranking" },
  { value: "hybrid", label: "Hybrid", detail: "BM25 + dense retrieval with fusion" },
  { value: "dense_only", label: "Dense only", detail: "Semantic vector retrieval" },
  { value: "bm25_only", label: "BM25 only", detail: "Exact lexical retrieval" },
];

type Result = AskResponse | ScreenshotAskResponse;

function isAskResult(result: Result): result is AskResponse {
  return "mode" in result;
}

export function AskWorkspace({ indexReady, onLibraryChanged }: { indexReady: boolean; onLibraryChanged?: () => void }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<RetrievalMode>("full");
  const [topK, setTopK] = useState(5);
  const [detectContradictions, setDetectContradictions] = useState(true);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [saveScreenshot, setSaveScreenshot] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));
      if (pasted) {
        setImage(pasted);
        toast.success("Screenshot attached");
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    type ModelToolContext = {
      registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => Promise<unknown>;
      }, options: { signal: AbortSignal }) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelToolContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "ask_study_library",
      title: "Ask study library",
      description: "Ask a grounded question across the indexed study material and show the answer with its evidence in the workspace.",
      inputSchema: {
        type: "object",
        properties: {
          question: { type: "string", minLength: 1, maxLength: 4000 },
          evidenceDepth: { type: "integer", minimum: 1, maximum: 20, default: 5 },
        },
        required: ["question"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== "object") throw new Error("Input must be an object.");
        const values = input as { question?: unknown; evidenceDepth?: unknown };
        if (typeof values.question !== "string" || !values.question.trim() || values.question.length > 4000) {
          throw new Error("question must be a non-empty string up to 4000 characters.");
        }
        const depth = typeof values.evidenceDepth === "number" && Number.isInteger(values.evidenceDepth)
          ? values.evidenceDepth
          : topK;
        if (depth < 1 || depth > 20) throw new Error("evidenceDepth must be between 1 and 20.");

        setQuery(values.question.trim());
        setImage(null);
        setLoading(true);
        setResult(null);
        try {
          const response = await api.ask({
            query: values.question.trim(),
            top_k: depth,
            mode,
            detect_contradictions: detectContradictions,
          });
          setResult(response);
          return {
            answer: response.answer,
            evidenceCount: response.evidence.length,
            groundingRatio: response.grounding_ratio,
            citationValidityRate: response.citation_validity_rate,
          };
        } finally {
          setLoading(false);
        }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, [detectContradictions, mode, topK]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    if (!image && !indexReady) {
      toast.error("Add study material before asking a knowledge-base question.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = image
        ? await (() => {
            const body = new FormData();
            body.append("question", cleanQuery);
            body.append("image", image);
            body.append("use_knowledge_base", String(useKnowledgeBase));
            body.append("save_to_library", String(saveScreenshot));
            body.append("top_k", String(topK));
            return api.visionAsk(body);
          })()
        : await api.ask({
            query: cleanQuery,
            top_k: topK,
            mode,
            detect_contradictions: detectContradictions,
          });
      setResult(response);
      if ("saved" in response && response.saved) onLibraryChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The answer could not be generated.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const evidence = result?.evidence ?? [];
  const grounding = result && isAskResult(result) ? result.token_grounding : null;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Grounded workspace</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
            Ask your material. Inspect every claim.
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <ShieldCheck className="size-4 text-cyan-deep" />
          Answers constrained to retrieved evidence
        </div>
      </div>

      <Card className="overflow-hidden rounded-[24px] border-line bg-white py-0 shadow-[0_20px_60px_rgba(8,31,43,0.08)]">
        <CardContent className="p-0">
          <form onSubmit={submit} className="p-4 sm:p-6">
            {image && preview && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-cyan/20 bg-cyan-soft/55 p-3">
                {/* Local object URLs are intentionally rendered without image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Attached screenshot preview" className="size-16 rounded-xl border border-white object-cover shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{image.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">Screenshot mode · visual analysis{useKnowledgeBase ? " + your library" : ""}</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setImage(null)} aria-label="Remove screenshot" className="rounded-full">
                  <X />
                </Button>
              </div>
            )}

            <label htmlFor="question" className="sr-only">Ask a question about your study material</label>
            <textarea
              id="question"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              rows={3}
              maxLength={4000}
              placeholder={image ? "What should I explain in this image?" : "Ask a question across your notes, slides, diagrams, and lectures…"}
              className="min-h-28 w-full resize-none bg-transparent px-1 py-2 text-[17px] leading-7 text-ink outline-none placeholder:text-ink-faint"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} className="rounded-xl text-ink-muted" aria-label="Attach screenshot">
                      <Paperclip />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach or paste a screenshot</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink"
              >
                <Settings2 className="size-4" />
                {image ? "Vision settings" : modes.find((item) => item.value === mode)?.label}
                <ChevronDown className="size-3.5" />
              </button>

              <span className="ml-auto hidden text-xs text-ink-faint sm:block">Enter to ask · Shift + Enter for a new line</span>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                size="icon-lg"
                className="ml-auto rounded-xl action-surface shadow-[0_8px_20px_rgba(8,31,43,0.18)] sm:ml-0"
                aria-label="Ask question"
              >
                {loading ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!result && !loading && (
        <div className="mt-5 flex flex-wrap gap-2">
          {promptIdeas.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuery(prompt)}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink-muted transition hover:border-cyan/30 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-cyan-soft text-cyan-deep">
              <ScanSearch className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full bg-cyan" />
            </span>
            <div>
              <p className="font-semibold text-ink">Tracing the strongest evidence</p>
              <p className="text-sm text-ink-muted">Retrieving, reranking, and validating citations…</p>
            </div>
          </div>
          <div className="mt-7 space-y-3">
            <div className="h-3 w-[92%] animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-[76%] animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-6">
            <article className="rounded-[24px] border border-line bg-white p-6 shadow-[0_18px_45px_rgba(8,31,43,0.06)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl action-surface"><Bot className="size-5" /></span>
                  <div>
                    <p className="font-semibold text-ink">Grounded answer</p>
                    <p className="text-xs text-ink-muted">Generated from {evidence.length} retrieved chunks</p>
                  </div>
                </div>
                {grounding?.length ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowGrounding((value) => !value)} className="rounded-xl border-line">
                    <Sparkles /> {showGrounding ? "Plain answer" : "Token map"}
                  </Button>
                ) : null}
              </div>

              {showGrounding && grounding ? (
                <div className="flex flex-wrap gap-x-1 gap-y-2 leading-8" aria-label="Token grounding map">
                  {grounding.map((token, index) => (
                    <span
                      key={`${token.token}-${index}`}
                      title={`${token.match_type}: ${(token.score * 100).toFixed(0)}%`}
                      className={cn(
                        "rounded px-0.5 text-[16px]",
                        token.score >= 0.8 && "bg-emerald-100 text-emerald-950",
                        token.score >= 0.45 && token.score < 0.8 && "bg-amber-100 text-amber-950",
                        token.score < 0.45 && "bg-rose-100 text-rose-950",
                      )}
                    >
                      {token.token}
                    </span>
                  ))}
                </div>
              ) : (
                <RichText evidence={evidence}>{result.answer}</RichText>
              )}

              {isAskResult(result) && result.disagreements.length > 0 && (
                <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-amber-950">
                    <Gauge className="size-4" /> Source disagreement detected
                  </div>
                  {result.disagreements.map((item) => (
                    <p key={`${item.chunk_id_a}-${item.chunk_id_b}`} className="mt-2 text-sm leading-6 text-amber-900">
                      {item.explanation || `${item.source_a} and ${item.source_b} make conflicting claims.`}
                    </p>
                  ))}
                </div>
              )}

              {!isAskResult(result) && (
                <details className="mt-7 rounded-2xl border border-line bg-canvas px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-ink">What the vision model found</summary>
                  <p className="mt-3 whitespace-pre-wrap leading-6 text-ink-muted">{result.image_analysis}</p>
                </details>
              )}
            </article>

            <EvidencePanel items={evidence} />
          </div>

          <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="eyebrow">Answer integrity</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-muted">Grounded tokens</span>
                  <strong className="font-mono text-sm text-ink">{Math.round((result.grounding_ratio ?? 0) * 100)}%</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${Math.round((result.grounding_ratio ?? 0) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm text-ink-muted">Citation validity</span>
                  <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="size-4" /> {Math.round((result.citation_validity_rate ?? 0) * 100)}%
                  </span>
                </div>
                {isAskResult(result) && result.latency_ms != null && (
                  <div className="flex items-center justify-between border-t border-line pt-4">
                    <span className="text-sm text-ink-muted">Pipeline time</span>
                    <strong className="font-mono text-sm text-ink">{(result.latency_ms / 1000).toFixed(1)}s</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl action-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-cyan-light" /> How to read this</div>
              <p className="mt-2 text-sm leading-6 text-white/65">Open any source card to inspect the exact chunk that supported the answer.</p>
            </div>
          </aside>
        </div>
      )}

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetTrigger asChild><span className="hidden" /></SheetTrigger>
        <SheetContent className="border-line bg-white sm:max-w-md">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="text-xl text-ink">Retrieval settings</SheetTitle>
            <SheetDescription>Control how evidence is selected for this question.</SheetDescription>
          </SheetHeader>
          <div className="space-y-7 px-4 pb-6">
            {!image ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">Pipeline mode</label>
                {modes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition", mode === item.value ? "border-cyan bg-cyan-soft/60" : "border-line hover:bg-canvas")}
                  >
                    <span className={cn("mt-1 size-3 rounded-full border-2", mode === item.value ? "border-cyan bg-cyan" : "border-slate-300")} />
                    <span><strong className="block text-sm text-ink">{item.label}</strong><span className="mt-0.5 block text-xs text-ink-muted">{item.detail}</span></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-sm font-semibold text-ink">Use knowledge base</p><p className="mt-1 text-xs text-ink-muted">Blend the screenshot with relevant uploaded material.</p></div>
                  <Switch checked={useKnowledgeBase} onCheckedChange={setUseKnowledgeBase} />
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
                  <div><p className="text-sm font-semibold text-ink">Save to library</p><p className="mt-1 text-xs text-ink-muted">Make this visual searchable in future questions.</p></div>
                  <Switch checked={saveScreenshot} onCheckedChange={setSaveScreenshot} />
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm font-semibold text-ink">Evidence depth</label>
                <Badge variant="outline" className="font-mono">{topK} chunks</Badge>
              </div>
              <Slider value={[topK]} min={1} max={image ? 10 : 20} step={1} onValueChange={(value) => setTopK(value[0])} className="[&_[data-slot=slider-range]]:bg-cyan [&_[data-slot=slider-thumb]]:border-cyan" />
            </div>

            {!image && (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
                <div><p className="text-sm font-semibold text-ink">Detect contradictions</p><p className="mt-1 text-xs text-ink-muted">Verify likely conflicts across different sources.</p></div>
                <Switch checked={detectContradictions} onCheckedChange={setDetectContradictions} />
              </div>
            )}

            <div className="rounded-2xl bg-canvas p-4 text-xs leading-5 text-ink-muted">
              <div className="mb-2 flex items-center gap-2 font-semibold text-ink"><ClipboardPaste className="size-4" /> Screenshot tip</div>
              Paste an image anywhere in this workspace to ask about a diagram, equation, or slide.
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
