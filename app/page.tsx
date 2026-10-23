"use client";

/* eslint-disable @next/next/no-img-element -- The brand mark is a local SVG. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronRight,
  FileStack,
  Menu,
  MessageSquareText,
  RefreshCw,
  Settings2,
  SquarePen,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
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
const navItems = [
  { id: "ask" as const, label: "Conversations", icon: MessageSquareText },
  { id: "library" as const, label: "Library", icon: FileStack },
  { id: "study" as const, label: "Study tools", icon: BookOpen },
];

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="config-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("ask");
  const [visited, setVisited] = useState<View[]>(["ask"]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [newChatRequest, setNewChatRequest] = useState(0);
  const [chatBusy, setChatBusy] = useState(false);
  const [studentLocation, setStudentLocation] = useState("India");
  const [timezone, setTimezone] = useState("");

  const refreshSystem = async () => {
    try {
      const [health, nextStats] = await Promise.all([
        api.health(),
        api.stats(),
      ]);
      setOnline(health.status === "ok");
      setStats(nextStats);
    } catch {
      setOnline(false);
      setStats(null);
    }
  };
  useEffect(() => {
    let active = true;
    void Promise.all([api.health(), api.stats()])
      .then(([health, nextStats]) => {
        if (active) {
          setOnline(health.status === "ok");
          setStats(nextStats);
        }
      })
      .catch(() => {
        if (active) {
          setOnline(false);
          setStats(null);
        }
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const chooseView = (next: View) => {
    setVisited((current) =>
      current.includes(next) ? current : [...current, next],
    );
    setView(next);
    setMobileOpen(false);
  };
  const startConversation = () => {
    chooseView("ask");
    setNewChatRequest((value) => value + 1);
  };
  const openConfig = async () => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try { setStudentLocation(localStorage.getItem("verity-student-location") ?? "India"); }
    catch { /* Location remains optional when storage is unavailable. */ }
    setConfigOpen(true);
    setConfigLoading(true);
    try {
      setConfig(await api.config());
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  };

  const navigation = (
    <div className="sidebar-navigation">
      <button
        type="button"
        className="brand"
        onClick={() => chooseView("ask")}
        aria-label="Verity Study home"
      >
        <img src="/favicon.svg" width="28" height="28" alt="" />
        <span>
          Verity<span className="brand-suffix">Study</span>
        </span>
      </button>
      <Button
        variant="outline"
        className="new-conversation"
        onClick={startConversation}
        disabled={chatBusy}
      >
        <SquarePen /> New conversation
      </Button>
      <nav aria-label="Primary navigation" className="workspace-navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn("nav-item", view === item.id && "selected")}
            onClick={() => chooseView(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {item.id === "library" && stats && (
              <span className="nav-count">{stats.documents}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
  const sidebarFooter = (
    <button
      className="system-status"
      type="button"
      onClick={() => void openConfig()}
      title="Engine status and configuration"
    >
      <span
        className={cn(
          "status-dot",
          online === null ? "connecting" : !online && "offline",
        )}
      />
      <span>
        {online === null
          ? "Connecting"
          : online
            ? "Engine connected"
            : "Engine unavailable"}
      </span>
      <Settings2 size={15} />
    </button>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>
      <header className="mobile-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Open navigation"
          title="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          className="mobile-brand"
          onClick={() => chooseView("ask")}
        >
          <img src="/favicon.svg" alt="" width="23" height="23" />
          Verity Study
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="New conversation"
          title="New conversation"
          onClick={startConversation}
          disabled={chatBusy}
        >
          <SquarePen size={19} />
        </button>
      </header>
      <main id="workspace-main" tabIndex={-1}>
        <div hidden={view !== "ask"}>
          <AskWorkspace
            indexReady={Boolean(stats?.index_ready)}
            sourceCount={stats?.documents ?? 0}
            sidebarHeader={navigation}
            sidebarFooter={sidebarFooter}
            newChatRequest={newChatRequest}
            onBusyChange={setChatBusy}
            onOpenLibrary={() => chooseView("library")}
            onLibraryChanged={() => setRevision((value) => value + 1)}
          />
        </div>
        {visited
          .filter((item) => item !== "ask")
          .map((item) => (
            <div key={item} hidden={view !== item}>
              <div className="secondary-layout">
                <aside className="workspace-sidebar">
                  {navigation}
                  <div className="sidebar-space" />
                  {sidebarFooter}
                </aside>
                <section
                  className="secondary-main"
                  aria-label={item === "library" ? "Library" : "Study tools"}
                >
                  {item === "library" ? (
                    <LibraryWorkspace
                      revision={revision}
                      onLibraryChanged={() => setRevision((value) => value + 1)}
                    />
                  ) : (
                    <StudyWorkspace revision={revision} />
                  )}
                </section>
              </div>
            </div>
          ))}
      </main>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="navigation-sheet"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Verity Study workspace navigation
            </SheetDescription>
          </SheetHeader>
          <button
            type="button"
            className="navigation-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
          {navigation}
          <div className="sidebar-space" />
          {sidebarFooter}
        </SheetContent>
      </Sheet>
      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent className="settings-sheet">
          <SheetHeader>
            <SheetTitle>Study engine</SheetTitle>
            <SheetDescription>
              Connection and model configuration
            </SheetDescription>
          </SheetHeader>
          <div className="settings-body">
            <section className="settings-group">
              <h3>Answer context</h3>
              <ConfigRow label="Timezone" value={timezone || "Detecting"} />
              <label htmlFor="student-location">Country or region</label>
              <input
                id="student-location"
                className="context-location-input"
                value={studentLocation}
                maxLength={200}
                placeholder="For example, India"
                onChange={(event) => setStudentLocation(event.target.value)}
              />
              <p className="state-text">Defaults to India and INR (₹) for examples. Change the region for a different country, or specify it in your question. Your timezone is detected automatically; no precise location is collected.</p>
              <Button variant="outline" onClick={() => {
                try {
                  localStorage.setItem("verity-student-location", studentLocation.trim());
                  toast.success("Answer context saved");
                } catch { toast.error("Could not save location in this browser."); }
              }}>Save answer context</Button>
            </section>
            <section className="settings-group">
              <h3>Connection</h3>
              <ConfigRow
                label="Backend"
                value={
                  online === null ? "Connecting" : online ? "Online" : "Offline"
                }
              />
              <ConfigRow
                label="Knowledge index"
                value={stats?.index_ready ? "Ready" : "Empty"}
              />
              <ConfigRow
                label="Indexed passages"
                value={String(stats?.chunks ?? 0)}
              />
            </section>
            <section className="settings-group">
              <h3>Models</h3>
              {configLoading ? (
                <div
                  className="loading-lines"
                  role="status"
                  aria-label="Loading configuration"
                >
                  <span />
                  <span />
                  <span />
                </div>
              ) : config ? (
                <>
                  <ConfigRow
                    label="Answers"
                    value={config.llm.model || config.llm.provider}
                  />
                  <ConfigRow
                    label="Vision"
                    value={config.vlm.model || config.vlm.provider}
                  />
                  <ConfigRow
                    label="Transcription"
                    value={config.asr.model || config.asr.provider}
                  />
                  <ConfigRow
                    label="Embeddings"
                    value={config.embedding_model}
                  />
                  <ConfigRow label="Reranker" value={config.reranker_model} />
                </>
              ) : (
                <p className="state-text">
                  Unable to load configuration. Check the backend connection and
                  retry.
                </p>
              )}
            </section>
            <Button
              variant="outline"
              onClick={() => {
                void refreshSystem();
                void openConfig();
              }}
            >
              <RefreshCw size={16} /> Refresh status
              <ChevronRight size={14} />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Toaster position="bottom-right" closeButton />
    </div>
  );
}
