"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddServerModal({ isOpen, onClose, onAdded }: AddServerModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentKey, setAgentKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleCreate() {
    setLoading(true);
    setAgentKey(null);
    setError(null);
    try {
      const res = await fetch("/api/agent/create-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "New Server" }),
      });
      const data = await res.json();
      if (res.ok && data.agentKey) {
        setAgentKey(data.agentKey);
        onAdded();
      } else {
        setError(data.error || "Failed to create agent key");
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!agentKey) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(agentKey);
      } else {
        // Fallback for insecure contexts (HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = agentKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Linux Server</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!agentKey ? (
          <>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Server name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Web Server"
              className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 font-mono text-sm focus:border-[var(--accent)] focus:outline-none"
            />
            {error && <p className="mb-4 text-xs text-[var(--danger)]">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-text)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? "Creating..." : "Generate Agent Key"}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-[var(--border)] px-4 py-2 hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-[var(--text-muted)]">
              Run this on your Linux server to start monitoring:
            </p>
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-4 font-mono text-xs">
              <div className="text-[var(--text-muted)]"># Install deps & run agent</div>
              <div className="mt-2 text-[var(--text)]">
                pip install -r requirements.txt
              </div>
              <div className="mt-2 text-[var(--text)]">
                export LINUX_MONITOR_AGENT_KEY=&quot;{agentKey}&quot;
              </div>
              <div className="text-[var(--text)]">
                export LINUX_MONITOR_API_URL=&quot;{origin || "https://your-dashboard.com"}&quot;
              </div>
              <div className="mt-2 text-[var(--text)]">python linux_monitor_agent.py</div>
            </div>
            <button
              onClick={copyKey}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 hover:bg-[var(--bg-card-hover)]"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[var(--accent)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy agent key"}
            </button>
            <button
              onClick={() => {
                setAgentKey(null);
                onClose();
              }}
              className="mt-3 w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-text)]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
