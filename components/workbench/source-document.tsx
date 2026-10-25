"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PdfPages } from "@/components/workbench/pdf-pages";
import { Button } from "@/components/ui/button";
import { API_BASE, formatTimestamp } from "@/lib/api";
import type { Chunk } from "@/lib/rag-types";

interface SourcePreview {
  source_file: string;
  original_available: boolean;
  chunks: Chunk[];
  full_sections: { title: string; text: string }[];
  preview_warning: string | null;
}

export function SourceDocument({ chunk, sourceFile, fullPage = false, initialPage, citationId }: {
  chunk?: Chunk;
  sourceFile?: string;
  fullPage?: boolean;
  initialPage?: number;
  citationId?: string;
}) {
  const name = chunk?.source_file ?? sourceFile ?? "";
  const firstPage = Math.max(1, initialPage ?? chunk?.page_number ?? 1);
  const [currentPage, setCurrentPage] = useState(firstPage);
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"document" | "text">("document");
  const [retry, setRetry] = useState(0);
  const extension = name.split(".").pop()?.toLowerCase();
  const formatted = ["pdf", "docx", "pptx"].includes(extension ?? "");
  const selected = chunk ?? preview?.chunks.find(item => item.chunk_id === citationId);
  const readerParams = new URLSearchParams({ source: name, page: String(currentPage) });
  if (selected) readerParams.set("citation", selected.chunk_id);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/documents/${encodeURIComponent(name)}/preview`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("This source is no longer indexed. Refresh the library to check its status.");
        const result: SourcePreview = await response.json();
        if (result.source_file !== name) throw new Error("The source did not match the selected document.");
        result.full_sections ??= [];
        result.preview_warning ??= null;
        if (!controller.signal.aborted) setPreview(result);
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load the source."); });
    return () => controller.abort();
  }, [name, retry]);

  const showPages = formatted && preview?.original_available && tab === "document";
  const retrySource = () => { setError(""); setPreview(null); setRetry(value => value + 1); };

  return <section className="document-viewer" data-layout={fullPage ? "page" : "panel"} aria-label={`Source document ${name}`}>
    <header className="document-viewer-heading">
      {fullPage ? <div className="document-reader-title"><Link href="/" aria-label="Back to workspace" title="Back to workspace"><ArrowLeft size={20} /></Link><h1 title={name}>{name}</h1></div> : <h3>Document preview</h3>}
      <div className="document-viewer-actions">
        {formatted && <div className="document-viewer-tabs" role="group" aria-label="Source view">
          <button type="button" aria-pressed={tab === "document"} onClick={() => setTab("document")}>Document</button>
          <button type="button" aria-pressed={tab === "text"} onClick={() => setTab("text")}>Text</button>
        </div>}
        {!fullPage && <Link className="document-open-reader" href={`/reader?${readerParams.toString()}`} target="_blank" rel="noopener noreferrer" prefetch={false}><ExternalLink size={15} /><span>Open full document</span></Link>}
      </div>
    </header>
    <div className="document-viewer-body">
      {error ? <div className="document-reader-state" role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={retrySource}>Retry source</Button>{selected && <p>{selected.text}</p>}</div>
        : !preview ? <div className="document-reader-state" role="status">Loading document…</div>
        : showPages ? <PdfPages name={name} initialPage={currentPage} kind={extension === "pptx" ? "Slide" : "Page"} onPageChange={setCurrentPage} />
        : <div className="document-text-view">
          {!preview.original_available && <p className="document-source-notice" role="status">The original file is unavailable. Its saved text is shown below.</p>}
          {preview.preview_warning && <p className="document-source-notice" role="status">{preview.preview_warning}</p>}
          {selected && <section className="document-cited-text"><h3>Cited passage</h3><p><mark>{selected.text}</mark></p></section>}
          {preview.full_sections.length > 0 ? preview.full_sections.map((section, index) => <section key={index}><h3>{section.title}</h3><p>{section.text || "No readable text in this section."}</p></section>) : preview.chunks.map(passage => <section key={passage.chunk_id} className={passage.chunk_id === selected?.chunk_id ? "document-cited-text" : undefined}>
            <h3>{passage.timestamp_start != null ? formatTimestamp(passage.timestamp_start) : passage.page_number != null ? `${extension === "pptx" ? "Slide" : "Page"} ${passage.page_number}` : passage.section_path || "Passage"}</h3>
            <p>{passage.text}</p>
          </section>)}
        </div>}
    </div>
  </section>;
}
