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
import { Progress } from "@/components/ui/progress";
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

  return (
    <section aria-labelledby="evidence-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Traceability</p>
          <h3 id="evidence-heading" className="mt-1 text-base font-semibold text-ink">{title}</h3>
        </div>
        <Badge variant="outline" className="rounded-full border-line bg-white text-ink-muted">
          {items.length} chunks
        </Badge>
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3")}>
        {items.map((item, index) => {
          const Icon = typeIcons[item.chunk.type];
          const contribution = item.attribution_percent ?? Math.max(0, item.rerank_score * 100);
          return (
            <button
              id={`evidence-${index + 1}`}
              type="button"
              key={item.chunk.chunk_id}
              onClick={() => setSelected(item)}
              className="group min-w-0 rounded-2xl border border-line bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-[0_14px_30px_rgba(11,31,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-soft text-cyan-deep">
                  <Icon className="size-3.5" />
                </span>
                <span className="truncate">{locator(item)}</span>
                <span className="ml-auto font-mono text-[11px] text-cyan-deep">[{index + 1}]</span>
              </div>
              {item.chunk.section_path && (
                <p className="mt-3 truncate text-sm font-semibold text-ink">{item.chunk.section_path}</p>
              )}
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">{item.chunk.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={Math.min(contribution, 100)} className="h-1.5 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-cyan" />
                <span className="min-w-10 text-right font-mono text-[11px] font-semibold text-ink-muted">
                  {contribution.toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto border-line bg-canvas p-0 sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b border-line bg-white px-6 py-6 pr-14 text-left">
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
                  <div className="overflow-hidden rounded-2xl border border-line bg-white p-2">
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

                <div className="rounded-2xl border border-line bg-white p-5">
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

                <Button variant="outline" className="w-full rounded-xl border-line bg-white" asChild>
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
