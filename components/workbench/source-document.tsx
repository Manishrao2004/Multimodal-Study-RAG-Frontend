"use client";

import { useEffect, useRef, useState } from "react";
import { PdfPages } from "@/components/workbench/pdf-pages";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE, formatTimestamp } from "@/lib/api";
import type { Chunk } from "@/lib/rag-types";

interface SourcePreview { source_file: string; original_available: boolean; chunks: Chunk[]; full_sections: {title: string; text: string}[]; preview_warning: string | null }

export function SourceDocument({ chunk, sourceFile, expanded = false, onExpand }: { chunk?: Chunk; sourceFile?: string; expanded?: boolean; onExpand?: (open: boolean) => void }) {
  const name = chunk?.source_file ?? sourceFile ?? "";
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [error, setError] = useState("");
  const [sectionIndex, setSectionIndex] = useState(0);
  const selectedPassage = useRef<HTMLElement | null>(null);
  const readingView = useRef<HTMLDivElement | null>(null);
  const page = Math.max(1, chunk?.page_number ?? 1);
  const extension = name.split(".").pop()?.toLowerCase();
  const isAudio = ["mp3", "mpga", "wav", "m4a", "flac", "ogg"].includes(extension ?? "");
  const isVideo = ["mp4", "webm"].includes(extension ?? "");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/documents/${encodeURIComponent(name)}/preview`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("This source is no longer indexed. Refresh the library to check its status.");
        const result: SourcePreview = await response.json();
        result.full_sections ??= [];
        result.preview_warning ??= null;
        if (result.source_file !== name) throw new Error("The source did not match the selected document.");
        if (!controller.signal.aborted) {
          setPreview(result);
          const normalized = (text: string) => text.replace(/\s+/g, " ").trim();
          const match = chunk ? result.full_sections.findIndex(section => normalized(section.text).includes(normalized(chunk.text).slice(0, 80))) : -1;
          setSectionIndex(extension === "pptx" && chunk?.page_number != null ? Math.min(Math.max(0, chunk.page_number - 1), Math.max(0, result.full_sections.length - 1)) : Math.max(0, match));
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load source.");
      });
    return () => controller.abort();
  }, [name, chunk, extension]);
  useEffect(() => {
    const selected = selectedPassage.current;
    const container = readingView.current;
    if (preview && chunk && selected && container) {
      container.scrollTop += selected.getBoundingClientRect().top - container.getBoundingClientRect().top;
    }
  }, [preview, chunk]);
  return (
    <section className={`source-document${expanded ? " is-full-reader" : ""}`} aria-label={`Source document ${name}`}>
      {expanded && <h2 className="full-reader-title">{name}</h2>}
      <div className="source-document-heading">
        <h3>{chunk?.page_number != null ? `Original document · page ${page}` : "Original source"}</h3>
        {onExpand && <Button variant="outline" size="sm" onClick={() => onExpand(!expanded)} aria-pressed={expanded}>
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {expanded ? "Back to citation" : "Open full document"}
        </Button>}
      </div>
      {error ? <p role="alert">{error} {chunk && "The saved cited passage is shown below."}</p> : !preview ? <p role="status">Loading source…</p> : (
        <>
          {!preview.original_available && <p role="status">The original file is unavailable. You can still read its indexed content below.</p>}
          {preview.original_available && (extension === "pdf" || (expanded && ["docx", "pptx"].includes(extension ?? ""))) && <>
            <PdfPages name={name} initialPage={page} kind={extension === "pptx" ? "Slide" : "Page"} />
          </>}
          {preview.preview_warning && <p role="status">{preview.preview_warning}</p>}
          <details open={!expanded || !["pdf", "docx", "pptx"].includes(extension ?? "") || !preview.original_available}>
          <summary>Extracted text and supporting passages</summary>
          <h3>{isAudio || isVideo ? "Transcript" : preview.full_sections.length ? "Full document text" : "Reading view"}</h3>
          {!["pdf", "mp3", "mpga", "wav", "m4a", "flac", "ogg", "mp4", "webm"].includes(extension ?? "") && <p className="state-text">Read the extracted content here. Word and slide layouts are simplified; HTML is displayed as safe text.</p>}
          {preview.full_sections.length > 0 && <div className="document-section-controls">
            <Button variant="outline" size="sm" disabled={sectionIndex <= 0} onClick={() => { setSectionIndex(sectionIndex - 1); if (readingView.current) readingView.current.scrollTop = 0; }}>Previous</Button>
            <label> {extension === "pptx" ? "Slide" : "Section"} {sectionIndex + 1} of {preview.full_sections.length}
              <select aria-label={extension === "pptx" ? "Go to slide" : "Go to document section"} value={sectionIndex} onChange={(event) => { setSectionIndex(Number(event.target.value)); if (readingView.current) readingView.current.scrollTop = 0; }}>
                {preview.full_sections.map((section, index) => <option value={index} key={index}>{index + 1}. {section.title.slice(0, 80)}</option>)}
              </select>
            </label>
            <Button variant="outline" size="sm" disabled={sectionIndex >= preview.full_sections.length - 1} onClick={() => { setSectionIndex(sectionIndex + 1); if (readingView.current) readingView.current.scrollTop = 0; }}>Next</Button>
          </div>}
          <div className="source-reading-view" ref={readingView}>
            {preview.full_sections.length ? <section className="source-reading-passage">
              <h4>{preview.full_sections[sectionIndex]?.title}</h4><p>{preview.full_sections[sectionIndex]?.text || "No readable text on this slide or section."}</p>
            </section> : preview.chunks.map((passage) => <section key={passage.chunk_id}
              ref={passage.chunk_id === chunk?.chunk_id ? (node) => { selectedPassage.current = node; } : undefined}
              className={passage.chunk_id === chunk?.chunk_id ? "cited-passage" : "source-reading-passage"}>
              <p className="state-text">{passage.timestamp_start != null ? formatTimestamp(passage.timestamp_start) : passage.page_number != null ? `${extension === "pptx" ? "Slide" : "Page"} ${passage.page_number}` : passage.section_path || "Passage"}</p>
              <p>{passage.chunk_id === chunk?.chunk_id ? <mark>{passage.text}</mark> : passage.text}</p>
            </section>)}
          </div>
          </details>
        </>
      )}
    </section>
  );
}
