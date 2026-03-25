"use client";
import { useEffect, useState, useRef } from "react";
import { ServerCard } from "@/components/ServerCard";
import { AddServerModal } from "@/components/AddServerModal";
import { Plus, Terminal, LogOut, LayoutGrid, List as ListIcon } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { UserProfile } from "@/components/UserProfile";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Logo } from "@/components/Logo";

interface Server {
  id: string;
  name: string;
  hostname: string;
  ip: string | null;
  os: string | null;
  lastSeenAt: string;
  latestMetric: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    loadAvg1: number;
    uptimeSeconds: number;
  } | null;
}

export default function Home() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServers((s) => s.filter((x) => x.id !== id));
        toast.success(`Server "${name}" deleted`);
      } else {
        toast.error("Failed to delete server");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/?logout=success");
    router.refresh();
  }

  async function fetchServers() {
    try {
      const res = await fetch("/api/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) return;
    
    // Perform live swap in state
    const newItems = [...servers];
    const draggedItemContent = newItems.splice(dragItem.current, 1)[0];
    newItems.splice(index, 0, draggedItemContent);
    
    dragItem.current = index;
    setDraggingIndex(index);
    setDragOverIndex(index);
    setServers(newItems);
  };

  const handleDragEnd = async () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);

    // Persist final order to DB
    try {
      const res = await fetch("/api/servers/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: servers.map((s, index) => ({ id: s.id, sortOrder: index })),
        }),
      });
      if (res.ok) {
        toast.success("Dashboard order saved");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchServers();
    const id = setInterval(fetchServers, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_view_mode");
    if (saved === "list" || saved === "grid") setViewMode(saved);
  }, []);

  const toggleViewMode = () => {
    const next = viewMode === "grid" ? "list" : "grid";
    setViewMode(next);
    localStorage.setItem("dashboard_view_mode", next);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1">
              <button 
                onClick={() => toggleViewMode()}
                className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => toggleViewMode()}
                className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <ThemeSelector />
            <button
              onClick={() => setModalOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Server
            </button>
            <UserProfile />
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">Your Servers</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Drag the handles to reorder your dashboard. Changes save automatically.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${viewMode === "grid" ? "h-40" : "h-16"} animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-card)]`}
              />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
            <Terminal className="mx-auto h-16 w-16 text-[var(--border)]" />
            <h3 className="mt-4 text-lg font-medium text-[var(--text)]">No servers yet</h3>
            <p className="mt-2 max-w-sm mx-auto text-sm text-[var(--text-muted)]">
              Add a Linux server and install the monitoring agent to see CPU, memory, disk,
              network, and process metrics.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-medium text-[var(--accent-text)] hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-4 w-4" />
              Add Your First Server
            </button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
            {servers.map((server, index) => (
              <div 
                key={server.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${dragOverIndex === index && draggingIndex !== index ? "scale-[1.05] z-10" : ""}`}
              >
                <ServerCard
                  server={server}
                  onDelete={deleting ? undefined : handleDelete}
                  viewMode={viewMode}
                  isDragging={draggingIndex === index}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <AddServerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={fetchServers}
      />
    </div>
  );
}
