"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import {
  Check,
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
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  DocumentSummary,
  IngestResponse,
  KnowledgeBaseStats,
} from "@/lib/rag-types";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACCEPTED =
  ".pdf,.docx,.pptx,.html,.htm,.md,.txt,.mp3,.wav,.m4a,.flac,.ogg,.webm,.mp4,.mpga";
function documentIcon(document: DocumentSummary) {
  if (document.audio_chunks) return FileAudio;
  if (document.visual_chunks > document.text_chunks) return ImageIcon;
  if (document.table_chunks > document.text_chunks) return FileChartColumn;
  return FileText;
}
function extension(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

export function LibraryWorkspace({
  revision,
  onLibraryChanged,
}: {
  revision: number;
  onLibraryChanged: () => void;
}) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<IngestResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [removing, setRemoving] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<DocumentSummary | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadBusyRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextDocuments, nextStats] = await Promise.all([
        api.documents(),
        api.stats(),
      ]);
      setDocuments(nextDocuments);
      setStats(nextStats);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load the library. Try refreshing.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    void Promise.all([api.documents(), api.stats()])
      .then(([nextDocuments, nextStats]) => {
        if (active) {
          setDocuments(nextDocuments);
          setStats(nextStats);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the library. Try refreshing.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const uploadFiles = async (files: File[]) => {
    if (!files.length || uploadBusyRef.current) return;
    uploadBusyRef.current = true;
    try {
      for (const file of files) {
        setUploading(file.name);
        try {
          const response = await api.ingest(file);
          setLastUpload(response);
          if (response.warnings.length) toast.warning(response.warnings[0]);
          toast.success(`${response.source_file} is ready`);
        } catch (cause) {
          toast.error(
            cause instanceof Error
              ? cause.message
              : `Could not process ${file.name}.`,
          );
        }
      }
    } finally {
      setUploading(null);
      uploadBusyRef.current = false;
    }
    await load();
    onLibraryChanged();
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };
  const remove = async () => {
    if (!deleteDocument || removing) return;
    setRemoving(true);
    try {
      await api.deleteDocument(deleteDocument.source_file);
      setDeleteDocument(null);
      toast.success("Source removed");
      await load();
      onLibraryChanged();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Could not remove the source. Try again.",
      );
    } finally {
      setRemoving(false);
    }
  };
  const visible = documents.filter((document) =>
    document.source_file.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="workspace-page library-workspace">
      <div className="page-heading">
        <div>
          <h1>Library</h1>
          <p>{stats ? `${stats.documents} sources` : "Your study material"}</p>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(uploading)}
        >
          <Plus size={16} /> Add material
        </Button>
      </div>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <div className="library-summary" aria-label="Library statistics">
        <span>
          <strong>{stats?.chunks?.toLocaleString() ?? "--"}</strong> indexed
          passages
        </span>
        <span>
          <strong>{stats?.by_type?.visual ?? 0}</strong> figures
        </span>
        <span>
          <strong>{stats?.by_type?.table ?? 0}</strong> tables
        </span>
        <span>
          <strong>{stats?.by_type?.audio ?? 0}</strong> audio segments
        </span>
      </div>
      <div
        className={cn("upload-zone", dragging && "dragging")}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <LoaderCircle size={24} className="animate-spin" />
        ) : (
          <Upload size={24} />
        )}
        <div>
          <h2>
            {uploading ? `Processing ${uploading}` : "Add course material"}
          </h2>
          <p>
            {uploading
              ? "Indexing your source"
              : "PDF, documents, slides, notes, or lecture audio"}
          </p>
        </div>
        {!uploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </Button>
        )}
      </div>
      {lastUpload && (
        <p className="upload-status" role="status">
          <Check size={15} className="shrink-0" />
          <span>
            {lastUpload.source_file} · {lastUpload.chunks_added} passages
            indexed
          </span>
        </p>
      )}
      {error && (
        <div className="request-error library-error" role="alert">
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}
      <section aria-labelledby="library-sources">
        <div className="list-toolbar">
          <h2 id="library-sources">Sources</h2>
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Find a source"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Find a source"
            />
          </label>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh library"
            title="Refresh library"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </Button>
        </div>
        {loading ? (
          <div
            className="loading-lines"
            role="status"
            aria-label="Loading sources"
          >
            <span />
            <span />
            <span />
          </div>
        ) : visible.length ? (
          <div className="document-list">
            <div className="document-columns" aria-hidden="true">
              <span>Name</span>
              <span>Format</span>
              <span>Passages</span>
              <span />
            </div>
            {visible.map((document) => {
              const Icon = documentIcon(document);
              return (
                <article className="document-row" key={document.source_file}>
                  <div className="document-name">
                    <Icon size={22} />
                    <div>
                      <h3 title={document.source_file}>
                        {document.source_file}
                      </h3>
                      <p>
                        {document.pages ? (
                          <span>{document.pages} pages</span>
                        ) : null}
                        <span className="document-mobile-count">{document.chunk_count} passages</span>
                        {document.visual_chunks > 0 && (
                          <span className="document-modalities">
                            <ImageIcon size={12} />
                            {document.visual_chunks} figures
                          </span>
                        )}
                        {document.table_chunks > 0 && (
                          <span className="document-modalities">
                            <Table2 size={12} />
                            {document.table_chunks} tables
                          </span>
                        )}
                        {document.audio_chunks > 0 && (
                          <span className="document-modalities">
                            <FileAudio size={12} />
                            {document.audio_chunks} segments
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="document-kind">
                    {extension(document.source_file)}
                  </span>
                  <span className="document-size">{document.chunk_count}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${document.source_file}`}
                        title="Source actions"
                      >
                        <MoreHorizontal size={17} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteDocument(document)}
                      >
                        <Trash2 /> Remove source
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              );
            })}
          </div>
        ) : (
          !error && (
            <div className="list-empty">
              <h3>
                {filter ? "No matching sources" : "Your library is empty"}
              </h3>
              <p>
                {filter
                  ? "Try another file name."
                  : "No course material added yet."}
              </p>
              {!filter && (
                <Button
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                >
                  <Plus /> Add material
                </Button>
              )}
            </div>
          )
        )}
      </section>
      <AlertDialog
        open={Boolean(deleteDocument)}
        onOpenChange={(open) => {
          if (!open && !removing) setDeleteDocument(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this source?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDocument?.source_file} and its{" "}
              {deleteDocument?.chunk_count} indexed passages will be removed.
              Saved conversations will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
            >
              {removing ? "Removing..." : "Remove source"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
