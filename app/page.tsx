"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Database,
  FileStack,
  Menu,
  MessageSquareText,
  RefreshCw,
  ServerCog,
  Sparkles,
  WifiOff,
} from "lucide-react";

import { api, API_BASE } from "@/lib/api";
import type { KnowledgeBaseStats, RuntimeConfig } from "@/lib/rag-types";
import { cn } from "@/lib/utils";
import { AskWorkspace } from "@/components/workbench/ask-workspace";
import { LibraryWorkspace } from "@/components/workbench/library-workspace";
import { StudyWorkspace } from "@/components/workbench/study-workspace";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

type View = "ask" | "library" | "study";

const navItems: { id: View; label: string; icon: typeof MessageSquareText }[] = [
  { id: "ask", label: "Ask", icon: MessageSquareText },
  { id: "library", label: "Library", icon: FileStack },
  { id: "study", label: "Study tools", icon: Sparkles },
];

function ConfigRow({ label, value, active = true }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm font-semibold text-ink">
        <span className={cn("size-2 shrink-0 rounded-full", active ? "bg-emerald-500" : "bg-slate-300")} />
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("ask");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [revision, setRevision] = useState(0);

  const refreshSystem = async () => {
    try {
      const [health, nextStats] = await Promise.all([api.health(), api.stats()]);
      setOnline(health.status === "ok");
      setStats(nextStats);
    } catch {
      setOnline(false);
      setStats(null);
    }
  };

  useEffect(() => {
    void Promise.all([api.health(), api.stats()])
      .then(([health, nextStats]) => {
        setOnline(health.status === "ok");
        setStats(nextStats);
      })
      .catch(() => {
        setOnline(false);
        setStats(null);
      });
  }, [revision]);

  const openConfig = async () => {
    setConfigOpen(true);
    try { setConfig(await api.config()); } catch { setConfig(null); }
  };

  const chooseView = (next: View) => {
    setView(next);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line/90 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => chooseView("ask")} className="group flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/40">
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-[13px] bg-ink text-white shadow-[0_7px_16px_rgba(7,29,40,0.18)]">
              <BrainCircuit className="relative z-10 size-5" />
              <span className="absolute bottom-0 right-0 size-3 bg-cyan" />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-[-0.02em] text-ink">Verity Study</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">Multimodal RAG</span>
            </span>
          </button>

          <nav aria-label="Primary navigation" className="ml-10 hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseView(item.id)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                    view === item.id ? "bg-ink text-white shadow-none" : "bg-white text-ink-muted hover:bg-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-4" /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openConfig}
              className="hidden h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink-muted transition hover:border-cyan/30 hover:text-ink sm:flex"
            >
              <span className={cn("size-2 rounded-full", online === null ? "animate-pulse bg-amber-400" : online ? "bg-emerald-500" : "bg-rose-500")} />
              {online === null ? "Connecting" : online ? "Engine online" : "Engine offline"}
            </button>
            <button
              type="button"
              onClick={() => chooseView("library")}
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink-muted transition hover:bg-white lg:flex"
            >
              <Database className="size-4" />
              <span><strong className="font-mono text-ink">{stats?.documents ?? 0}</strong> sources</span>
            </button>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="rounded-xl md:hidden" aria-label="Open navigation"><Menu /></Button>
          </div>
        </div>
      </header>

      <main>
        {view === "ask" && <AskWorkspace indexReady={Boolean(stats?.index_ready)} />}
        {view === "library" && <LibraryWorkspace revision={revision} onLibraryChanged={() => setRevision((value) => value + 1)} />}
        {view === "study" && <StudyWorkspace revision={revision} />}
      </main>

      <footer className="border-t border-line bg-white/50">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-6 py-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Evidence-first study assistant · local, single-user workspace</span>
          <span className="font-mono">{API_BASE}</span>
        </div>
      </footer>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[88%] border-line bg-white p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-line px-5 py-6 text-left">
            <SheetTitle className="flex items-center gap-3 text-ink"><span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white"><BrainCircuit className="size-5" /></span> Verity Study</SheetTitle>
            <SheetDescription>Navigate your study workspace</SheetDescription>
          </SheetHeader>
          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => chooseView(item.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold", view === item.id ? "bg-cyan-soft text-cyan-deep" : "text-ink-muted hover:bg-canvas")}>
                  <Icon className="size-4" /> {item.label}<ChevronRight className="ml-auto size-4" />
                </button>
              );
            })}
          </nav>
          <div className="mx-4 mt-auto rounded-2xl bg-canvas p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">{online ? <ServerCog className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-rose-600" />}{online ? "Backend connected" : "Backend unavailable"}</div>
            <p className="mt-1 text-xs text-ink-muted">{stats?.documents ?? 0} sources · {stats?.chunks ?? 0} chunks</p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent className="border-line bg-canvas sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-xl text-ink"><ServerCog className="size-5 text-cyan-deep" /> Study engine</SheetTitle>
            <SheetDescription>Live backend and model configuration. API keys are never displayed.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <div className="rounded-2xl border border-line bg-white p-4">
              <ConfigRow label="Connection" value={online ? "Online" : "Offline"} active={Boolean(online)} />
              <ConfigRow label="Knowledge index" value={stats?.index_ready ? "Ready" : "Empty"} active={Boolean(stats?.index_ready)} />
              <ConfigRow label="Indexed content" value={`${stats?.chunks ?? 0} chunks`} active={Boolean(stats?.chunks)} />
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="eyebrow mb-2">Models</p>
              {config ? (
                <>
                  <ConfigRow label="Answer model" value={config.llm.model || config.llm.provider} active={config.llm.provider !== "none"} />
                  <ConfigRow label="Vision model" value={config.vlm.model || config.vlm.provider} active={config.vlm.provider !== "none"} />
                  <ConfigRow label="Transcription" value={config.asr.model || config.asr.provider} active={config.asr.provider !== "none"} />
                  <ConfigRow label="Embeddings" value={config.embedding_model} />
                  <ConfigRow label="Reranker" value={config.reranker_model} />
                </>
              ) : <p className="py-5 text-sm text-ink-muted">Configuration is available when the backend is online.</p>}
            </div>
            <Button variant="outline" className="w-full rounded-xl border-line bg-white" onClick={() => { void refreshSystem(); void openConfig(); }}><RefreshCw /> Refresh status</Button>
            <div className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-white"><BookOpen className="mt-0.5 size-4 shrink-0 text-cyan-light" /><p className="text-xs leading-5 text-white/65">The frontend reads model status from the backend and never exposes secret values.</p></div>
          </div>
        </SheetContent>
      </Sheet>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
