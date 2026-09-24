"use client";

import { useState } from "react";
import {
  Braces,
  Clock3,
  FileText,
  ImageIcon,
  Layers3,
  Table2,
} from "lucide-react";

import { API_BASE, formatTimestamp } from "@/lib/api";
import type { EvidenceItem } from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const typeIcons = {
  text: FileText,
  table: Table2,
  visual: ImageIcon,
  audio: Clock3,
};

function locator(item: EvidenceItem) {
  const { chunk } = item;
  if (chunk.type === "audio" && chunk.timestamp_start != null) {
    return `${chunk.source_file} · ${formatTimestamp(chunk.timestamp_start)}`;
  }
  if (chunk.page_number != null) return `${chunk.source_file} · page ${chunk.page_number}`;
  return chunk.source_file;
}

interface EvidencePanelProps {
  items: EvidenceItem[];
  title?: string;
  compact?: boolean;
}

export function EvidencePanel({ items, title = "Source evidence", compact = false }: EvidencePanelProps) {
  const [selected, setSelected] = useState<EvidenceItem | null>(null);

  if (!items.length) return null;

  const grouped = Array.from(
    items.reduce((groups, item) => {
      const current = groups.get(item.chunk.source_file) ?? [];
      current.push(item);
      groups.set(item.chunk.source_file, current);
      return groups;
    }, new Map<string, EvidenceItem[]>()),
  );

  return (
    <section aria-labelledby="evidence-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Sources</p>
          <h3 id="evidence-heading" className="mt-1 text-base font-semibold text-ink">{title}</h3>
        </div>
        <Badge variant="outline" className="rounded-full border-line bg-card text-ink-muted">
          {grouped.length} source{grouped.length === 1 ? "" : "s"} · {items.length} passages
        </Badge>
      </div>

      <div className={cn("space-y-3", compact && "space-y-2")}>
        {grouped.map(([source, sourceItems]) => {
          const strongest = Math.max(...sourceItems.map((item) => item.attribution_percent ?? 0));
          return (
            <div key={source} className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="flex items-center gap-3 border-b border-line bg-canvas/60 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-soft text-cyan-deep"><FileText className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{source}</p>
                  <p className="text-xs text-ink-muted">{sourceItems.length} cited passage{sourceItems.length === 1 ? "" : "s"}</p>
                </div>
                {strongest > 0 && <Badge variant="outline" className="rounded-full font-mono text-[10px]">top {strongest.toFixed(0)}%</Badge>}
              </div>
              <div className="divide-y divide-line">
                {sourceItems.map((item) => {
                  const index = items.indexOf(item);
                  const Icon = typeIcons[item.chunk.type];
                  const contribution = item.attribution_percent ?? Math.max(0, item.rerank_score * 100);
                  return (
                    <button id={`evidence-${index + 1}`} type="button" key={item.chunk.chunk_id} onClick={() => setSelected(item)} className="group flex w-full min-w-0 items-start gap-3 px-4 py-3 text-left transition hover:bg-cyan-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan/50">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-ink-muted"><Icon className="size-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-deep">[{index + 1}]</span>
                          <span className="truncate text-xs font-medium text-ink-muted">{item.chunk.section_path || locator(item)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-muted">{item.chunk.text}</p>
                      </div>
                      <span className="mt-1 shrink-0 font-mono text-[10px] text-ink-faint">{contribution.toFixed(0)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto border-line bg-canvas p-0 sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b border-line bg-card px-6 py-6 pr-14 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="rounded-full bg-cyan-soft text-cyan-deep hover:bg-cyan-soft">
                    {selected.chunk.type}
                  </Badge>
                  <span className="font-mono text-xs text-ink-faint">{selected.chunk.chunk_id}</span>
                </div>
                <SheetTitle className="text-xl text-ink">{selected.chunk.section_path || "Evidence detail"}</SheetTitle>
                <SheetDescription className="text-ink-muted">{locator(selected)}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-6">
                {selected.chunk.image_ref && (
                  <div className="overflow-hidden rounded-2xl border border-line bg-card p-2">
                    {/* Backend serves only images tied to validated visual chunks. */}
                    {/* Dynamic backend evidence URLs are not build-time image assets. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE}/evidence/${encodeURIComponent(selected.chunk.chunk_id)}/image`}
                      alt={`Source figure from ${selected.chunk.source_file}`}
                      className="max-h-80 w-full rounded-xl object-contain"
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Braces className="size-4 text-cyan-deep" />
                    Retrieved content
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink-muted">{selected.chunk.text}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-tile">
                    <span>Answer contribution</span>
                    <strong>{(selected.attribution_percent ?? 0).toFixed(1)}%</strong>
                  </div>
                  <div className="metric-tile">
                    <span>Rerank score</span>
                    <strong>{selected.rerank_score.toFixed(3)}</strong>
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-xl border-line bg-card" asChild>
                  <a href={`${API_BASE}/evidence/${encodeURIComponent(selected.chunk.chunk_id)}`} target="_blank" rel="noreferrer">
                    <Layers3 /> Open raw evidence
                  </a>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
