"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  BookOpen,
  FileAudio,
  FileChartColumn,
  FileText,
  ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { DocumentSummary, IngestResponse, KnowledgeBaseStats } from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const ACCEPTED = ".pdf,.docx,.pptx,.html,.htm,.md,.txt,.mp3,.wav,.m4a,.flac,.ogg,.webm,.mp4,.mpga";

function documentIcon(document: DocumentSummary) {
  if (document.audio_chunks) return FileAudio;
  if (document.visual_chunks > document.text_chunks) return ImageIcon;
  if (document.table_chunks > document.text_chunks) return FileChartColumn;
  return FileText;
}

function extension(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

interface LibraryWorkspaceProps {
  revision: number;
  onLibraryChanged: () => void;
}

export function LibraryWorkspace({ revision, onLibraryChanged }: LibraryWorkspaceProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null);
  const [lastUpload, setLastUpload] = useState<IngestResponse | null>(null);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [documentData, statsData] = await Promise.all([api.documents(), api.stats()]);
      setDocuments(documentData);
      setStats(statsData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([api.documents(), api.stats()])
      .then(([documentData, statsData]) => {
        setDocuments(documentData);
        setStats(statsData);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load the library.");
      })
      .finally(() => setLoading(false));
  }, [revision]);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    for (const file of files) {
      setUploading({ name: file.name, progress: 8 });
      const timer = window.setInterval(() => {
        setUploading((current) => current ? { ...current, progress: Math.min(current.progress + Math.random() * 8, 88) } : null);
      }, 650);
      try {
        const response = await api.ingest(file);
        window.clearInterval(timer);
        setUploading({ name: file.name, progress: 100 });
        setLastUpload(response);
        if (response.warnings.length) toast.warning(response.warnings[0]);
        toast.success(`${response.source_file} is ready to search`);
      } catch (error) {
        window.clearInterval(timer);
        toast.error(error instanceof Error ? error.message : `Could not process ${file.name}.`);
      }
    }
    window.setTimeout(() => setUploading(null), 600);
    await load();
    onLibraryChanged();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const remove = async (name: string) => {
    try {
      const response = await api.deleteDocument(name);
      toast.success(`Removed ${response.chunks_removed} indexed chunks`);
      await load();
      onLibraryChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the document.");
    }
  };

  const visibleDocuments = documents.filter((document) => document.source_file.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Knowledge library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Everything you study, in one index.</h1>
        </div>
        <Button onClick={() => inputRef.current?.click()} className="w-fit rounded-xl action-surface px-5">
          <Plus /> Add material
        </Button>
      </div>

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card md:col-span-1">
          <span>Documents</span>
          <strong>{stats?.documents ?? "—"}</strong>
          <BookOpen className="absolute bottom-4 right-4 size-8 text-cyan-light/70" />
        </div>
        <div className="stat-card">
          <span>Searchable chunks</span>
          <strong>{stats?.chunks?.toLocaleString() ?? "—"}</strong>
          <Search className="absolute bottom-4 right-4 size-7 text-ink-faint" />
        </div>
        <div className="stat-card">
          <span>Visual evidence</span>
          <strong>{stats?.by_type?.visual ?? 0}</strong>
          <ImageIcon className="absolute bottom-4 right-4 size-7 text-ink-faint" />
        </div>
        <div className="stat-card">
          <span>Audio segments</span>
          <strong>{stats?.by_type?.audio ?? 0}</strong>
          <AudioLines className="absolute bottom-4 right-4 size-7 text-ink-faint" />
        </div>
      </div>

      <div
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-6 rounded-[24px] border border-dashed p-6 transition sm:p-8",
          dragging ? "border-cyan bg-cyan-soft/60" : "border-slate-300 bg-white",
        )}
      >
        {uploading ? (
          <div className="mx-auto max-w-xl py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-soft text-cyan-deep"><LoaderCircle className="size-5 animate-spin" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-ink">Processing {uploading.name}</p>
                  <span className="font-mono text-xs text-ink-muted">{uploading.progress.toFixed(0)}%</span>
                </div>
                <Progress value={uploading.progress} className="mt-3 h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-cyan" />
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-ink-muted">Extracting structure, figures, tables, and searchable chunks</p>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center py-3 text-center focus-visible:outline-none">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-cyan-soft text-cyan-deep"><UploadCloud className="size-6" /></span>
            <strong className="mt-4 text-base text-ink">Drop course material here</strong>
            <span className="mt-1 text-sm text-ink-muted">PDF, DOCX, PPTX, HTML, or lecture audio · up to 25 MB documents / 100 MB audio</span>
          </button>
        )}
      </div>

      {lastUpload && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <span className="font-semibold">Latest:</span>
          <span>{lastUpload.chunks_added} chunks indexed from {lastUpload.source_file}</span>
          <span className="mx-1 text-emerald-300">/</span>
          <span>{lastUpload.figures_captioned} figures captioned</span>
        </div>
      )}

      <section className="mt-10" aria-labelledby="library-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Indexed sources</p>
            <h2 id="library-heading" className="mt-1 text-xl font-semibold text-ink">Your material</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Find a source"
                className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none transition focus:border-cyan/50 focus:ring-2 focus:ring-cyan/10 sm:w-60"
              />
            </label>
            <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} className="rounded-xl border-line bg-white" aria-label="Refresh library">
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-line bg-white" />)}
          </div>
        ) : visibleDocuments.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleDocuments.map((document) => {
              const Icon = documentIcon(document);
              return (
                <article key={document.source_file} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-cyan/30 hover:shadow-[0_12px_28px_rgba(8,31,43,0.06)]">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-ink" title={document.source_file}>{document.source_file}</h3>
                        <p className="mt-1 text-xs text-ink-muted">
                          {document.pages ? `${document.pages} pages · ` : ""}{document.chunk_count} chunks
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg text-ink-muted" aria-label={`Actions for ${document.source_file}`}><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 /> Remove source</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove this source?</AlertDialogTitle>
                                <AlertDialogDescription>{document.source_file} and its {document.chunk_count} searchable chunks will be removed from the index.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep source</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => void remove(document.source_file)}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="border-line font-mono text-[10px] text-ink-muted">{extension(document.source_file)}</Badge>
                      {document.table_chunks > 0 && <Badge variant="outline" className="border-line text-[10px] text-ink-muted"><Table2 /> {document.table_chunks}</Badge>}
                      {document.visual_chunks > 0 && <Badge variant="outline" className="border-line text-[10px] text-ink-muted"><ImageIcon /> {document.visual_chunks}</Badge>}
                      {document.audio_chunks > 0 && <Badge variant="outline" className="border-line text-[10px] text-ink-muted"><FileAudio /> {document.audio_chunks}</Badge>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-line bg-white px-6 py-14 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted"><BookOpen className="size-6" /></span>
            <h3 className="mt-4 font-semibold text-ink">{filter ? "No matching sources" : "Your library is ready for its first source"}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">{filter ? "Try a different file name." : "Add a textbook, slide deck, set of notes, or lecture recording to start asking grounded questions."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
