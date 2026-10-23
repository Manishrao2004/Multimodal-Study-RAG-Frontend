"use client";

/* eslint-disable @next/next/no-img-element -- Evidence images are served by the backend. */

import { useId, useState } from "react";
import { FileText } from "lucide-react";
import { API_BASE, formatTimestamp } from "@/lib/api";
import type { EvidenceItem } from "@/lib/rag-types";
import { SourceDocument } from "@/components/workbench/source-document";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function locator(item: EvidenceItem) {
  const { chunk } = item;
  if (chunk.type === "audio" && chunk.timestamp_start != null)
    return `${chunk.source_file} · ${formatTimestamp(chunk.timestamp_start)}`;
  if (chunk.page_number != null)
    return `${chunk.source_file} · page ${chunk.page_number}`;
  return chunk.source_file;
}

export function EvidencePanel({
  items,
  title = "Source evidence",
  compact = false,
  idPrefix = "evidence",
}: {
  items: EvidenceItem[];
  title?: string;
  compact?: boolean;
  idPrefix?: string;
}) {
  const [selected, setSelected] = useState<EvidenceItem | null>(null);
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  if (!items.length) return null;
  const grouped = Array.from(
    items.reduce((groups, item) => {
      groups.set(item.chunk.source_file, [
        ...(groups.get(item.chunk.source_file) ?? []),
        item,
      ]);
      return groups;
    }, new Map<string, EvidenceItem[]>()),
  );

  return (
    <section
      aria-labelledby={headingId}
      className={compact ? "evidence-panel compact" : "evidence-panel"}
    >
      <div className="evidence-heading">
        <h3 id={headingId}>{title}</h3>
        <span>
          {grouped.length} source{grouped.length === 1 ? "" : "s"} ·{" "}
          {items.length} passages
        </span>
      </div>
      {grouped.map(([source, sourceItems]) => {
        const contribution = sourceItems.reduce(
          (total, item) => total + (item.attribution_percent ?? 0),
          0,
        );
        return (
          <div className="evidence-source" key={source}>
            <div className="evidence-source-header">
              <FileText size={15} className="shrink-0" />
              <span title={source}>{source}</span>
              {contribution > 0 && (
                <small>{contribution.toFixed(1)}% contribution</small>
              )}
            </div>
            {sourceItems.map((item) => {
              const index = items.indexOf(item);
              return (
                <button
                  id={`${idPrefix}-${index + 1}`}
                  type="button"
                  key={item.chunk.chunk_id}
                  className="evidence-passage"
                  onClick={() => setSelected(item)}
                  aria-label={`Open passage ${index + 1} from ${source}`}
                >
                  <span>[{index + 1}]</span>
                  <div>
                    <small>{item.chunk.section_path || locator(item)}</small>
                    <p className="line-clamp-3">{item.chunk.text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) { setSelected(null); setExpanded(false); }
        }}
      >
        <SheetContent className={expanded ? "source-viewer-sheet source-viewer-expanded w-screen overflow-y-auto sm:max-w-none" : "source-viewer-sheet w-full overflow-y-auto sm:max-w-4xl"}>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="break-words pr-7">
                  {selected.chunk.section_path || "Evidence detail"}
                </SheetTitle>
                <SheetDescription className="break-words">
                  {locator(selected)}
                </SheetDescription>
              </SheetHeader>
              <div className="evidence-detail">
                <SourceDocument key={selected.chunk.chunk_id} chunk={selected.chunk} expanded={expanded} onExpand={setExpanded} />
                {/* Source images are served by the backend, not build-time assets. */}
                {selected.chunk.image_ref && (
                  <img
                    src={`${API_BASE}/evidence/${encodeURIComponent(selected.chunk.chunk_id)}/image`}
                    alt={`Source figure from ${selected.chunk.source_file}`}
                  />
                )}
                <div className="cited-passage"><h3>Supporting passage</h3><p><mark>{selected.chunk.text}</mark></p></div>
                <div className="evidence-metrics">
                  <div className="metric-tile">
                    <span>Answer contribution</span>
                    <strong>
                      {selected.attribution_percent == null
                        ? "Not recorded"
                        : `${selected.attribution_percent.toFixed(1)}%`}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>Rerank score</span>
                    <strong>{selected.rerank_score.toFixed(3)}</strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
