"use client";
/* eslint-disable @next/next/no-img-element -- Original document pages are rendered by the backend. */

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Fit = "page" | "width" | "75" | "100" | "125" | "150" | "200";

export function PdfPages({ name, initialPage, kind = "Page", onPageChange }: {
  name: string;
  initialPage: number;
  kind?: "Page" | "Slide";
  onPageChange?: (page: number) => void;
}) {
  const [page, setPage] = useState(initialPage);
  const [target, setTarget] = useState(String(initialPage));
  const [count, setCount] = useState(0);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fit, setFit] = useState<Fit>("page");
  const [retry, setRetry] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    fetch(`${API_BASE}/documents/${encodeURIComponent(name)}/pages/${page}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const detail = body && typeof body === "object" && "detail" in body ? body.detail : null;
          throw new Error(typeof detail === "string" ? detail : "The original document could not be displayed.");
        }
        const total = Number(response.headers.get("X-Page-Count"));
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        if (!blob.type.startsWith("image/")) throw new Error("The server did not return a document page.");
        objectUrl = URL.createObjectURL(blob);
        setCount(Number.isInteger(total) && total > 0 ? total : 0);
        setImage(objectUrl);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load the document.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [name, page, retry]);

  function go(number: number) {
    if (loading || !Number.isInteger(number) || number < 1 || (count > 0 && number > count)) return;
    setTarget(String(number));
    if (number === page) return;
    setLoading(true); setError(""); setImage(""); setPage(number);
    onPageChange?.(number);
    stage.current?.scrollTo(0, 0);
  }
  function reload() {
    setError(""); setLoading(true); setImage(""); setRetry(value => value + 1);
  }

  return <section className="document-pages" aria-label={`Original ${name}`}>
    <div className="document-pages-toolbar">
      <div className="document-pages-navigation">
        <Button variant="ghost" size="icon-sm" disabled={loading || page <= 1} onClick={() => go(page - 1)} aria-label={`Previous ${kind.toLowerCase()}`} title={`Previous ${kind.toLowerCase()}`}><ChevronLeft size={18} /></Button>
        <form className="document-page-jump" onSubmit={event => { event.preventDefault(); go(Number(target)); }}>
          <label>{kind}<input aria-label={`${kind} number`} type="number" min={1} max={count || undefined} value={target} onChange={event => setTarget(event.target.value)} disabled={loading} /></label>
          <span aria-live="polite">/ {count || "—"}</span>
          <Button variant="ghost" size="sm" type="submit" disabled={loading}>Go</Button>
        </form>
        <Button variant="ghost" size="icon-sm" disabled={loading || !count || page >= count} onClick={() => go(page + 1)} aria-label={`Next ${kind.toLowerCase()}`} title={`Next ${kind.toLowerCase()}`}><ChevronRight size={18} /></Button>
      </div>
      <label className="document-fit-control"><span className="sr-only">Document zoom</span><select aria-label="Document zoom" value={fit} onChange={event => { setFit(event.target.value as Fit); stage.current?.scrollTo(0, 0); }}>
        <option value="page">Fit page</option><option value="width">Fit width</option>
        {[75, 100, 125, 150, 200].map(value => <option key={value} value={value}>{value}%</option>)}
      </select></label>
    </div>
    <div ref={stage} className="document-pages-stage" data-fit={fit} tabIndex={0} aria-label="Document page. Use left and right arrow keys to navigate." onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); go(page - 1); }
      if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); if (count) go(page + 1); }
      if (event.key === "Home") { event.preventDefault(); go(1); }
      if (event.key === "End" && count) { event.preventDefault(); go(count); }
    }}>
      {loading ? <div className="document-reader-state" role="status"><RotateCw className="animate-spin" size={22} /><p>Preparing {kind.toLowerCase()} {page}</p><small>The first Office preview may take a moment.</small></div>
        : error ? <div className="document-reader-state" role="alert"><p>{error}</p><small>Your extracted text is available from the Text tab.</small><Button variant="outline" size="sm" onClick={reload}><RotateCw size={14} /> Retry preview</Button>{page !== 1 && <Button variant="ghost" size="sm" onClick={() => go(1)}>Go to first {kind.toLowerCase()}</Button>}</div>
        : <div className="document-page-surface"><img className="document-rendered-page" src={image} alt={`${name}, ${kind.toLowerCase()} ${page}`} style={fit !== "page" && fit !== "width" ? { width: `${Number(fit)}%` } : undefined} onError={() => setError("The page image could not be displayed. Retry the preview.")} /></div>}
    </div>
  </section>;
}
