"use client";
/* eslint-disable @next/next/no-img-element -- Backend renders PDF pages as bounded PNGs. */
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function PdfPages({ name, initialPage, kind = "Page" }: { name: string; initialPage: number; kind?: "Page" | "Slide" }) {
  const [page, setPage] = useState(initialPage);
  const [count, setCount] = useState(0);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(String(initialPage));
  const [zoom, setZoom] = useState(100);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    fetch(`${API_BASE}/documents/${encodeURIComponent(name)}/pages/${page}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const detail = typeof body === "object" && body !== null && "detail" in body ? body.detail : null;
          throw new Error(typeof detail === "string" ? detail : "This document cannot be rendered. Open the extracted text below.");
        }
        const total = Number(response.headers.get("X-Page-Count"));
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setCount(total);
        setImage(objectUrl);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load page.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [name, page]);
  const go = (number: number) => { if (number === page) return; setLoading(true); setError(""); setImage(""); setPage(number); setTarget(String(number)); };
  return <section className="pdf-pages" aria-label={`PDF preview of ${name}`}>
    <div className="pdf-page-controls">
      <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => go(page - 1)}>Previous</Button>
      <form className="reader-page-jump" onSubmit={(event) => { event.preventDefault(); const next = Number(target); if (Number.isInteger(next) && next >= 1 && next <= count) go(next); }}>
        <label>{kind} <input aria-label={`Go to ${kind.toLowerCase()}`} type="number" min={1} max={count || undefined} value={target} onChange={(event) => setTarget(event.target.value)} disabled={loading || count === 0} /></label>
        <span aria-live="polite">{count > 0 ? `of ${count}` : ""}</span>
        <Button variant="outline" size="sm" type="submit" disabled={loading || count === 0}>Go</Button>
      </form>
      <Button variant="outline" size="sm" disabled={loading || count === 0 || page >= count} onClick={() => go(page + 1)}>Next</Button>
    </div>
    <label className="reader-zoom">Zoom <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>{[75, 100, 125, 150, 200].map(value => <option key={value} value={value}>{value}%</option>)}</select></label>
    {loading ? <p role="status">Preparing original {kind.toLowerCase()}… Office documents may take a few moments on first open.</p> : error ? <div role="alert"><p>{error}</p>{page !== 1 && <Button variant="outline" onClick={() => go(1)}>First page</Button>}</div> :
      <div className="pdf-page-image"><img src={image} style={{ width: `${zoom}%`, maxWidth: "none" }} alt={`${name}, ${kind.toLowerCase()} ${page}`} /></div>}
  </section>;
}
