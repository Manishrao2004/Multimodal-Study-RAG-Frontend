"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SourceDocument } from "@/components/workbench/source-document";

function ReaderContent() {
  const params = useSearchParams();
  const source = params.get("source") ?? "";
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  if (!source) return <main className="document-reader-page"><div className="document-reader-state"><h1>No document selected</h1><Link href="/">Return to workspace</Link></div></main>;
  return <main className="document-reader-page"><SourceDocument key={`${source}:${page}`} sourceFile={source} initialPage={page} citationId={params.get("citation") ?? undefined} fullPage /></main>;
}

export default function ReaderPage() {
  return <Suspense fallback={<main className="document-reader-page"><p role="status">Loading reader…</p></main>}><ReaderContent /></Suspense>;
}
