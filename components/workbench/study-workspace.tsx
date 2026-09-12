"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  Check,
  ChevronDown,
  CircleHelp,
  Files,
  Layers3,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { DocumentSummary, EvidenceItem, QuizResponse, StudyResponse } from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidencePanel } from "@/components/workbench/evidence-panel";

type Tool = "summary" | "compare" | "quiz";

const toolInfo = {
  summary: { title: "Topic summary", description: "Build a concise, citation-grounded overview from your material.", icon: BookMarked },
  compare: { title: "Source comparison", description: "See how two documents explain the same topic differently.", icon: Files },
  quiz: { title: "Practice set", description: "Generate questions that stay traceable to a real source chunk.", icon: CircleHelp },
};

function ResultText({ children }: { children: string }) {
  return <div className="whitespace-pre-wrap text-[16px] leading-8 text-ink">{children}</div>;
}

export function StudyWorkspace({ revision }: { revision: number }) {
  const [tool, setTool] = useState<Tool>("summary");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [sourceA, setSourceA] = useState("");
  const [sourceB, setSourceB] = useState("");
  const [quizFormat, setQuizFormat] = useState("mcq");
  const [quizCount, setQuizCount] = useState(5);
  const [result, setResult] = useState<StudyResponse | QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.documents().then((items) => {
      setDocuments(items);
      if (items.length > 0) {
        setSourceA((current) => current || items[0].source_file);
        setSourceB((current) => current || items[1]?.source_file || items[0].source_file);
      }
    }).catch(() => setDocuments([]));
  }, [revision]);

  const resetResult = (next: Tool) => {
    setTool(next);
    setResult(null);
    setRevealed(new Set());
  };

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) return;
    if (tool === "compare" && (!sourceA || !sourceB || sourceA === sourceB)) {
      toast.error("Choose two different sources to compare.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = tool === "summary"
        ? await api.summarize({ topic: topic.trim(), top_k: 8, source_file: source === "all" ? null : source })
        : tool === "compare"
          ? await api.compare({ topic: topic.trim(), source_a: sourceA, source_b: sourceB, top_k: 4 })
          : await api.quiz({ topic: topic.trim(), count: quizCount, format: quizFormat, top_k: 8, source_file: source === "all" ? null : source });
      setResult(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The study tool could not finish.");
    } finally {
      setLoading(false);
    }
  };

  const isQuiz = result && "items" in result;
  const studyResult = result && !isQuiz ? result as StudyResponse : null;
  const evidence: EvidenceItem[] = isQuiz
    ? result.evidence
    : studyResult?.evidence ?? [...(studyResult?.evidence_a ?? []), ...(studyResult?.evidence_b ?? [])];
  const ActiveIcon = toolInfo[tool].icon;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="eyebrow">Study studio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Turn evidence into understanding.</h1>
      </div>

      <Tabs value={tool} onValueChange={(value) => resetResult(value as Tool)}>
        <TabsList variant="line" className="mb-6 w-full justify-start gap-5 overflow-x-auto border-b border-line pb-3 sm:gap-8">
          {(Object.keys(toolInfo) as Tool[]).map((item) => {
            const Icon = toolInfo[item].icon;
            return <TabsTrigger key={item} value={item} className="h-10 flex-none px-1 text-sm"><Icon /> {toolInfo[item].title}</TabsTrigger>;
          })}
        </TabsList>

        {(Object.keys(toolInfo) as Tool[]).map((item) => (
          <TabsContent key={item} value={item}>
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <form onSubmit={run} className="h-fit rounded-[24px] border border-line bg-white p-5 shadow-[0_15px_38px_rgba(8,31,43,0.06)] lg:sticky lg:top-24 sm:p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-soft text-cyan-deep"><ActiveIcon className="size-5" /></span>
                <h2 className="mt-5 text-xl font-semibold text-ink">{toolInfo[tool].title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{toolInfo[tool].description}</p>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-ink">Topic</span>
                    <textarea
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      rows={3}
                      maxLength={4000}
                      placeholder="e.g. backpropagation and vanishing gradients"
                      className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-faint focus:border-cyan/50 focus:bg-white focus:ring-2 focus:ring-cyan/10"
                    />
                  </label>

                  {tool === "compare" ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-ink">Sources</label>
                      <Select value={sourceA} onValueChange={setSourceA}>
                        <SelectTrigger className="w-full rounded-xl border-line bg-white"><SelectValue placeholder="First source" /></SelectTrigger>
                        <SelectContent>{documents.map((document) => <SelectItem key={document.source_file} value={document.source_file}>{document.source_file}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex justify-center"><ArrowRight className="size-4 rotate-90 text-ink-faint" /></div>
                      <Select value={sourceB} onValueChange={setSourceB}>
                        <SelectTrigger className="w-full rounded-xl border-line bg-white"><SelectValue placeholder="Second source" /></SelectTrigger>
                        <SelectContent>{documents.map((document) => <SelectItem key={document.source_file} value={document.source_file}>{document.source_file}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink">Source scope</span>
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="w-full rounded-xl border-line bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All material</SelectItem>
                          {documents.map((document) => <SelectItem key={document.source_file} value={document.source_file}>{document.source_file}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </label>
                  )}

                  {tool === "quiz" && (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-ink">Question format</span>
                        <Select value={quizFormat} onValueChange={setQuizFormat}>
                          <SelectTrigger className="w-full rounded-xl border-line bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple choice</SelectItem>
                            <SelectItem value="short_answer">Short answer</SelectItem>
                            <SelectItem value="flashcard">Flashcards</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <div>
                        <div className="mb-4 flex items-center justify-between text-sm"><span className="font-semibold text-ink">Question count</span><Badge variant="outline" className="font-mono">{quizCount}</Badge></div>
                        <Slider value={[quizCount]} min={1} max={20} step={1} onValueChange={(value) => setQuizCount(value[0])} className="[&_[data-slot=slider-range]]:bg-cyan [&_[data-slot=slider-thumb]]:border-cyan" />
                      </div>
                    </>
                  )}
                </div>

                <Button type="submit" disabled={loading || !topic.trim()} className="mt-7 w-full rounded-xl bg-ink text-white hover:bg-ink/90">
                  {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  {loading ? "Working from your sources…" : tool === "summary" ? "Create summary" : tool === "compare" ? "Compare sources" : "Generate practice set"}
                </Button>
              </form>

              <div className="min-w-0">
                {loading ? (
                  <div className="rounded-[24px] border border-line bg-white p-8">
                    <div className="flex items-center gap-3 text-sm font-semibold text-ink"><LoaderCircle className="size-5 animate-spin text-cyan-deep" /> Building from verified evidence</div>
                    <div className="mt-7 space-y-3">{[88, 100, 72, 94, 61].map((width) => <div key={width} className="h-3 animate-pulse rounded-full bg-slate-100" style={{ width: `${width}%` }} />)}</div>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {isQuiz ? (
                      <section className="space-y-3">
                        <div className="mb-5 flex items-end justify-between">
                          <div><p className="eyebrow">Practice set</p><h2 className="mt-1 text-xl font-semibold text-ink">{result.items.length} grounded questions</h2></div>
                          <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{Math.round(result.grounded_rate * 100)}% grounded</Badge>
                        </div>
                        {result.items.map((quizItem, index) => {
                          const isRevealed = revealed.has(index);
                          return (
                            <article key={`${quizItem.question}-${index}`} className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
                              <div className="flex items-start gap-3">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-white">{String(index + 1).padStart(2, "0")}</span>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-[16px] font-semibold leading-7 text-ink">{quizItem.question}</h3>
                                  {quizItem.options && <div className="mt-4 grid gap-2 sm:grid-cols-2">{quizItem.options.map((option, optionIndex) => <div key={option} className={cn("rounded-xl border px-3 py-2.5 text-sm", isRevealed && option === quizItem.answer ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-line bg-canvas text-ink-muted")}><span className="mr-2 font-mono text-xs">{String.fromCharCode(65 + optionIndex)}</span>{option}{isRevealed && option === quizItem.answer && <Check className="ml-2 inline size-4" />}</div>)}</div>}
                                  {isRevealed && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-950">{quizItem.answer}</p>{quizItem.explanation && <p className="mt-2 text-sm leading-6 text-emerald-900">{quizItem.explanation}</p>}</div>}
                                  <div className="mt-4 flex items-center justify-between">
                                    <span className="font-mono text-xs text-ink-faint">{quizItem.citation_marker ? `Source [${quizItem.citation_marker}]` : "Source verified"}</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed((current) => { const next = new Set(current); if (isRevealed) next.delete(index); else next.add(index); return next; })} className="rounded-lg">{isRevealed ? <RotateCcw /> : <ChevronDown />}{isRevealed ? "Hide" : "Reveal answer"}</Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </section>
                    ) : (
                      <article className="rounded-[24px] border border-line bg-white p-6 shadow-[0_15px_38px_rgba(8,31,43,0.06)] sm:p-8">
                        <div className="mb-6 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-cyan-soft text-cyan-deep"><ActiveIcon className="size-5" /></span><div><p className="font-semibold text-ink">{toolInfo[tool].title}</p><p className="text-xs text-ink-muted">Synthesized from {evidence.length} evidence chunks</p></div></div>
                        <ResultText>{studyResult?.summary || studyResult?.comparison || ""}</ResultText>
                        <div className="mt-7 flex flex-wrap gap-2 border-t border-line pt-5">
                          <Badge variant="outline" className="rounded-full border-line"><Check className="text-emerald-600" /> {Math.round((studyResult?.citation_validity_rate ?? 0) * 100)}% valid citations</Badge>
                          {studyResult?.grounding_ratio != null && <Badge variant="outline" className="rounded-full border-line"><Layers3 className="text-cyan-deep" /> {Math.round(studyResult.grounding_ratio * 100)}% grounded</Badge>}
                        </div>
                      </article>
                    )}
                    <EvidencePanel items={evidence} />
                  </div>
                ) : (
                  <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[24px] border border-line bg-white px-6 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-cyan-soft text-cyan-deep"><ActiveIcon className="size-6" /></span>
                    <h2 className="mt-5 text-lg font-semibold text-ink">Ready when your topic is</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">Choose a topic and scope. The result will include the evidence trail, not just generated text.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
