"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CircleHelp,
  Files,
  LoaderCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  DocumentSummary,
  EvidenceItem,
  QuizResponse,
  StudyResponse,
} from "@/lib/rag-types";
import { toast } from "sonner";
import { PracticeSession } from "./practice-session";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EvidencePanel } from "@/components/workbench/evidence-panel";
import { RichText } from "@/components/workbench/rich-text";
import { SelectField } from "@/components/workbench/select-field";

type Tool = "summary" | "compare" | "quiz";
const tools = [
  {
    id: "summary" as const,
    label: "Summary",
    title: "Topic summary",
    action: "Create summary",
    icon: BookOpen,
  },
  {
    id: "compare" as const,
    label: "Compare",
    title: "Source comparison",
    action: "Compare sources",
    icon: Files,
  },
  {
    id: "quiz" as const,
    label: "Practice",
    title: "Practice set",
    action: "Create practice set",
    icon: CircleHelp,
  },
];

type SavedStudy = { id: string; tool: Tool; topic: string; format: string; source: string; sourceA: string; sourceB: string; result: StudyResponse | QuizResponse };
const STORAGE_KEY = "verity-study-sessions-v1";

export function StudyWorkspace({ revision }: { revision: number }) {
  const [tool, setTool] = useState<Tool>("summary");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [sourceA, setSourceA] = useState("");
  const [sourceB, setSourceB] = useState("");
  const [quizFormat, setQuizFormat] = useState("mcq");
  const [quizCount, setQuizCount] = useState(5);
  const [result, setResult] = useState<StudyResponse | QuizResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourcesError, setSourcesError] = useState("");
  const [saved, setSaved] = useState<SavedStudy[]>([]);
  const [resultTopic, setResultTopic] = useState("");
  const [resultFormat, setResultFormat] = useState("mcq");
  const [sessionKey, setSessionKey] = useState(0);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setSaved(stored.filter(s => s && typeof s.id === "string" && typeof s.topic === "string" && ["summary", "compare", "quiz"].includes(s.tool) && s.result && (typeof s.result.summary === "string" || typeof s.result.comparison === "string" || (Array.isArray(s.result.items) && Array.isArray(s.result.evidence)))).slice(0, 12));
    } catch { toast.error("Saved study sessions could not be read."); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const store = (sessions: SavedStudy[]) => {
    setSaved(sessions);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
    catch { toast.error("Browser storage is full or unavailable. Export this result to keep it."); }
  };
  const busyRef = useRef(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let active = true;
    api
      .documents()
      .then((items) => {
        if (!active) return;
        setDocuments(items);
        setSourcesError("");
        setSourceA((current) =>
          items.some((item) => item.source_file === current)
            ? current
            : (items[0]?.source_file ?? ""),
        );
        setSourceB((current) =>
          items.some((item) => item.source_file === current)
            ? current
            : (items[1]?.source_file ?? ""),
        );
        setSource((current) =>
          current === "all" ||
          items.some((item) => item.source_file === current)
            ? current
            : "all",
        );
      })
      .catch((cause: unknown) => {
        if (active)
          setSourcesError(
            cause instanceof Error ? cause.message : "Could not load sources.",
          );
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const chooseTool = (next: Tool) => {
    if (busyRef.current) return;
    setTool(next);
    setResult(null);
    setError("");
  };
  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim() || busyRef.current || !documents.length) return;
    if (tool === "compare" && (!sourceA || !sourceB || sourceA === sourceB)) {
      setError("Choose two different sources to compare.");
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response =
        tool === "summary"
          ? await api.summarize({
              topic: topic.trim(),
              top_k: 8,
              source_file: source === "all" ? null : source,
            })
          : tool === "compare"
            ? await api.compare({
                topic: topic.trim(),
                source_a: sourceA,
                source_b: sourceB,
                top_k: 4,
              })
            : await api.quiz({
                topic: topic.trim(),
                count: quizCount,
                format: quizFormat,
                top_k: 8,
                source_file: source === "all" ? null : source,
              });
      setResult(response);
      setResultTopic(topic.trim());
      setResultFormat(quizFormat);
      setSessionKey(key => key + 1);
      store([{ id: crypto.randomUUID(), tool, topic: topic.trim(), format: quizFormat, source, sourceA, sourceB, result: response }, ...saved].slice(0, 12));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not finish. Your topic is still here; try again.",
      );
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };
  const active = tools.find((item) => item.id === tool)!;
  const isQuiz = result && "items" in result;
  const study = result && !isQuiz ? (result as StudyResponse) : null;
  const evidence: EvidenceItem[] = isQuiz
    ? result.evidence
    : (study?.evidence ?? [
        ...(study?.evidence_a ?? []),
        ...(study?.evidence_b ?? []),
      ]);
  const sourceOptions = documents.map((document) => ({
    value: document.source_file,
    label: document.source_file,
  }));

  const exportResult = () => {
    if (!result) return;
    const body = "items" in result ? result.items.map((item, i) => `## ${i + 1}. ${item.question}\n\n${item.options?.map(o => `- ${o}`).join("\n") || ""}\n\nAnswer: ${item.answer}\n\n${item.explanation || ""} [${item.citation_marker}]`).join("\n\n") : (result.summary || result.comparison || "");
    const references = evidence.map((e, i) => `[${i + 1}] ${e.chunk.source_file}: ${e.chunk.text}`).join("\n\n");
    const url = URL.createObjectURL(new Blob([`# ${resultTopic}\n\n${body}\n\n## Sources\n\n${references}`], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = `verity-${tool}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="workspace-page tools-workspace">
      <div className="page-heading">
        <div>
          <h1>Study tools</h1>
          <p>{documents.length} sources available</p>
        </div>
      </div>
      <div className="tools-tabs" role="tablist" aria-label="Study tools">
        {tools.map((item, index) => (
          <button
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`study-tab-${item.id}`}
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tool === item.id}
            aria-controls="study-tool-panel"
            tabIndex={tool === item.id ? 0 : -1}
            disabled={loading}
            onClick={() => chooseTool(item.id)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tools.length;
              else if (event.key === "ArrowLeft")
                next = (index + tools.length - 1) % tools.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tools.length - 1;
              else return;
              event.preventDefault();
              chooseTool(tools[next].id);
              tabRefs.current[next]?.focus();
            }}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
      {sourcesError && (
        <div className="request-error" role="alert">
          <p>{sourcesError}</p>
        </div>
      )}
      <div
        id="study-tool-panel"
        role="tabpanel"
        aria-labelledby={`study-tab-${tool}`}
        className="study-layout"
      >
        <form onSubmit={run} className="study-controls">
          <h2>{active.title}</h2>

          <fieldset disabled={loading} className="study-fields">
            <label>
              Topic
              <textarea
                aria-label="Topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Enter a topic"
              />
            </label>
            {tool === "compare" ? (
              <>
                <label>
                  First source
                  <SelectField
                    label="First source"
                    value={sourceA}
                    onValueChange={setSourceA}
                    options={sourceOptions}
                    disabled={loading}
                    placeholder="Choose a source"
                  />
                </label>
                <label>
                  Second source
                  <SelectField
                    label="Second source"
                    value={sourceB}
                    onValueChange={setSourceB}
                    options={sourceOptions}
                    disabled={loading}
                    placeholder="Choose a source"
                  />
                </label>
              </>
            ) : (
              <label>
                Source
                <SelectField
                  label="Source"
                  value={source}
                  onValueChange={setSource}
                  options={[
                    { value: "all", label: "All sources" },
                    ...sourceOptions,
                  ]}
                  disabled={loading}
                />
              </label>
            )}
            {tool === "quiz" && (
              <>
                <label>
                  Question format
                  <SelectField
                    label="Question format"
                    value={quizFormat}
                    onValueChange={setQuizFormat}
                    options={[
                      { value: "mcq", label: "Multiple choice" },
                      { value: "short_answer", label: "Short answer" },
                      { value: "flashcard", label: "Flashcards" },
                    ]}
                    disabled={loading}
                  />
                </label>
                <div>
                  <label className="count-label" htmlFor="quiz-count">
                    <span>Questions</span>
                    <output>{quizCount}</output>
                  </label>
                  <Slider
                    id="quiz-count"
                    aria-label="Question count"
                    value={[quizCount]}
                    min={1}
                    max={20}
                    step={1}
                    disabled={loading}
                    onValueChange={(value) => setQuizCount(value[0])}
                  />
                </div>
              </>
            )}
          </fieldset>
          <Button
            type="submit"
            disabled={loading || !topic.trim() || !documents.length}
            className="study-submit"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <active.icon size={16} />
            )}
            {loading ? "Preparing..." : active.action}
          </Button>
          {error && (
            <div className="request-error mt-4" role="alert">
              <p>{error}</p>
            </div>
          )}
          {saved.length > 0 && <details className="saved-studies"><summary>Saved sessions ({saved.length})</summary><div className="saved-studies-content"><SelectField label="Saved study sessions" value="" placeholder="Reopen a saved session" disabled={loading} options={saved.map(s => ({ value: s.id, label: `${s.tool === "quiz" ? s.format : s.tool}: ${s.topic}` }))} onValueChange={id => {
            const session = saved.find(s => s.id === id); if (!session) return;
            setTool(session.tool); setTopic(session.topic); setResultTopic(session.topic); setQuizFormat(session.format); setResultFormat(session.format); setSource(session.source); setSourceA(session.sourceA); setSourceB(session.sourceB); setResult(session.result); setSessionKey(key => key + 1); setError("");
          }} /><p className="state-text">Last 12 results saved in this browser. Practice restarts when reopened.</p><Button type="button" variant="ghost" size="sm" onClick={() => store([])}>Clear saved sessions</Button></div></details>}
        </form>
        <div className="study-result" aria-busy={loading}>
          {loading ? (
            <div role="status">
              <p className="state-text mb-5">
                Preparing {active.label.toLowerCase()}...
              </p>
              <div className="loading-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : result ? (
            <>
              <div className="practice-toolbar"><p className="study-result-topic">{resultTopic}</p><Button variant="outline" size="sm" onClick={exportResult}>Export Markdown</Button></div>
              <div className="study-result-heading">
                <h2>
                  {isQuiz ? `${result.items.length} ${resultFormat === "flashcard" ? "flashcards" : "questions"}` : active.title}
                </h2>
                <span>
                  {isQuiz
                    ? `${Math.round(result.grounded_rate * 100)}% grounded`
                    : `${evidence.length} evidence passages`}
                </span>
              </div>
              {isQuiz && result.dropped > 0 && <p className="state-text">{result.dropped} duplicate or invalid items were omitted.</p>}
              {isQuiz ? (
                <PracticeSession key={sessionKey} result={result as QuizResponse} format={resultFormat} />
              ) : (
                <article>
                  <RichText evidence={evidence}>
                    {study?.summary || study?.comparison || ""}
                  </RichText>
                  <div className="result-metrics">
                    <span>
                      {study?.citation_validity_rate == null
                        ? "Citation validity not recorded"
                        : `${Math.round(study.citation_validity_rate * 100)}% valid citations`}
                    </span>
                    {study?.grounding_ratio != null && (
                      <span>
                        {Math.round(study.grounding_ratio * 100)}% grounded
                      </span>
                    )}
                  </div>
                </article>
              )}
              <div className="study-evidence">
                <EvidencePanel items={evidence} />
              </div>
            </>
          ) : (
            <div className="study-empty">
              <active.icon size={24} strokeWidth={1.5} />
              <h2>
                {documents.length ? "Choose a topic to begin" : "Add sources in the library to begin"}
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
