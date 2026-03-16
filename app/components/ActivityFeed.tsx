"use client";

import { useEffect, useState, useRef, useCallback, type TouchEvent } from "react";
import type { LogEntry } from "@/lib/types";
import { timeAgo } from "@/lib/types";

interface ActivityFeedProps {
  refreshKey: number;
}

const DESTINATION_LINKS: Record<string, { label: string; url: string }> = {
  task: {
    label: "GitHub",
    url: "https://github.com/knectardev/lot/issues",
  },
  lot: {
    label: "GitHub (lot)",
    url: "https://github.com/knectardev/lot/issues",
  },
  feature: {
    label: "GitHub (lot)",
    url: "https://github.com/knectardev/lot/issues",
  },
  lendl: {
    label: "GitHub (lot)",
    url: "https://github.com/knectardev/lot/issues",
  },
  lendle: {
    label: "GitHub (lot)",
    url: "https://github.com/knectardev/lot/issues",
  },
  idea: {
    label: "Google Sheets",
    url: "https://docs.google.com/spreadsheets/d/1OTU37oAUMazJsaHY2DeS3FJ2I6kI88EsJX9fMPDMOaM/edit?gid=1434823540#gid=1434823540",
  },
  tshirt: {
    label: "Google Sheets",
    url: "https://docs.google.com/spreadsheets/d/1OTU37oAUMazJsaHY2DeS3FJ2I6kI88EsJX9fMPDMOaM/edit?gid=1434823540#gid=1434823540",
  },
  emailchris: {
    label: "Email (Chris)",
    url: "mailto:chris.amato@knectar.com",
  },
  emailalana: {
    label: "Email (Alana)",
    url: "mailto:alana.kaczmarek@gmail.com",
  },
};

const GITHUB_TOKENS = ["task", "lot", "feature", "lendl", "lendle"];
const SHEETS_TOKENS = ["idea", "tshirt"];
const EMAIL_TOKENS = ["emailchris", "emailalana"];

type DestinationFilter = "all" | "github" | "sheets" | "email" | "uncategorized";

const DESTINATION_FILTERS: { value: DestinationFilter; label: string }[] = [
  { value: "all", label: "All destinations" },
  { value: "github", label: "GitHub Issues" },
  { value: "sheets", label: "Google Sheets" },
  { value: "email", label: "Email" },
  { value: "uncategorized", label: "Uncategorized" },
];

function tokenMatchesFilter(token: string | null, filter: DestinationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "github") return !!token && GITHUB_TOKENS.includes(token);
  if (filter === "sheets") return !!token && SHEETS_TOKENS.includes(token);
  if (filter === "email") return !!token && EMAIL_TOKENS.includes(token);
  if (filter === "uncategorized") return !token;
  return true;
}

const STATUS_STYLES: Record<string, string> = {
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  started:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface Capture {
  thingyId: number;
  content: string;
  token: string | null;
  timestamp: string;
  status: "completed" | "failed" | "processing";
  archived: boolean;
}

function deriveCaptures(logs: LogEntry[]): Capture[] {
  const grouped = new Map<number, LogEntry[]>();

  for (const log of logs) {
    if (!log.thingy_id) continue;
    const group = grouped.get(log.thingy_id) ?? [];
    group.push(log);
    grouped.set(log.thingy_id, group);
  }

  const captures: Capture[] = [];

  for (const [thingyId, entries] of grouped) {
    const hasFailed = entries.some((e) => e.status === "failed");
    const routingCompleted = entries.some(
      (e) => e.action.startsWith("[Routing]") && e.status === "completed"
    );

    let status: Capture["status"] = "processing";
    if (hasFailed) status = "failed";
    else if (routingCompleted) status = "completed";

    const earliest = entries.reduce((a, b) =>
      a.timestamp < b.timestamp ? a : b
    );

    captures.push({
      thingyId,
      content: earliest.content ?? "",
      token: earliest.token,
      timestamp: earliest.timestamp,
      status,
      archived: !!earliest.archived,
    });
  }

  captures.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return captures;
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

const STATUS_ICONS: Record<string, string> = {
  completed: "\u2713",
  failed: "\u2717",
  processing: "\u2026",
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" fill="#0F9D58" />
      <path d="M14 2v6h6" fill="#87CEAC" />
      <rect x="8" y="12" width="8" height="1.5" rx=".5" fill="white" />
      <rect x="8" y="15" width="8" height="1.5" rx=".5" fill="white" />
      <rect x="11.5" y="12" width="1" height="4.5" fill="white" opacity=".6" />
    </svg>
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_24dp.png"
      alt="Gmail"
      className={className}
    />
  );
}

function ServiceIcon({ token }: { token: string | null }) {
  if (!token) return null;

  const cls = "h-4 w-4 shrink-0";

  if (["task", "lot", "feature", "lendl", "lendle"].includes(token)) {
    return <GitHubIcon className={cls + " text-gray-700 dark:text-gray-300"} />;
  }
  if (["idea", "tshirt"].includes(token)) {
    return <GoogleSheetsIcon className={cls} />;
  }
  if (["emailchris", "emailalana"].includes(token)) {
    return <GmailIcon className={cls} />;
  }

  return null;
}

function serviceStyle(token: string | null): string {
  if (!token) return "border-gray-200 bg-white dark:border-gray-700 dark:bg-transparent";
  if (["task", "lot", "feature", "lendl", "lendle"].includes(token)) {
    return "border-l-4 border-l-gray-900 border-y border-r border-y-gray-300 border-r-gray-300 bg-gray-100 dark:border-l-gray-300 dark:border-y-gray-600 dark:border-r-gray-600 dark:bg-gray-700/50";
  }
  if (["idea", "tshirt"].includes(token)) {
    return "border-l-4 border-l-green-600 border-y border-r border-y-green-200 border-r-green-200 bg-green-100 dark:border-l-green-400 dark:border-y-green-800 dark:border-r-green-800 dark:bg-green-900/30";
  }
  if (["emailchris", "emailalana"].includes(token)) {
    return "border-l-4 border-l-red-600 border-y border-r border-y-red-200 border-r-red-200 bg-red-100 dark:border-l-red-400 dark:border-y-red-800 dark:border-r-red-800 dark:bg-red-900/30";
  }
  return "border-gray-200 bg-white dark:border-gray-700 dark:bg-transparent";
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

const SWIPE_THRESHOLD = 80;

function ResendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function CaptureRow({ capture, onArchive, onUnarchive, onResend }: { capture: Capture; onArchive: (id: number) => void; onUnarchive: (id: number) => void; onResend: (id: number) => Promise<boolean> }) {
  const dest = capture.token ? DESTINATION_LINKS[capture.token] : null;
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);

  async function handleResendClick() {
    setResendState("sending");
    const ok = await onResend(capture.thingyId);
    setResendState(ok ? "sent" : "failed");
    setTimeout(() => setResendState("idle"), 2500);
  }

  function handleTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setSwiping(true);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!swiping) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        setSwiping(false);
        return;
      }
      locked.current = true;
    }

    if (dx < 0) {
      setOffsetX(Math.max(dx, -150));
    }
  }

  function handleTouchEnd() {
    if (offsetX < -SWIPE_THRESHOLD) {
      setOffsetX(-300);
      setTimeout(() => onArchive(capture.thingyId), 200);
    } else {
      setOffsetX(0);
    }
    setSwiping(false);
  }

  const isArchived = capture.archived;

  return (
    <li className="relative overflow-hidden rounded-lg">
      {!isArchived && (
        <div className="absolute inset-0 z-0 flex items-center justify-end bg-orange-500 px-5">
          <div className="flex items-center gap-1.5 text-white">
            <ArchiveIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">Archive</span>
          </div>
        </div>
      )}

      <div
        className={`relative z-10 flex items-center gap-3 px-4 py-3 ${serviceStyle(capture.token)} ${!isArchived && swiping ? "" : "transition-transform duration-200"} ${isArchived ? "opacity-50" : ""}`}
        style={{ transform: isArchived ? undefined : `translateX(${offsetX}px)` }}
        onTouchStart={isArchived ? undefined : handleTouchStart}
        onTouchMove={isArchived ? undefined : handleTouchMove}
        onTouchEnd={isArchived ? undefined : handleTouchEnd}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            capture.status === "completed"
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : capture.status === "failed"
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
          }`}
        >
          {STATUS_ICONS[capture.status]}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-800 dark:text-gray-200">
            {capture.content || "(empty)"}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{capture.timestamp ? timeAgo(capture.timestamp) : ""}</span>
            {dest && (
              <>
                <span>&rarr;</span>
                <ServiceIcon token={capture.token} />
                <a
                  href={dest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {dest.label}
                </a>
              </>
            )}
            {!dest && capture.token && (
              <span>#{capture.token}</span>
            )}
          </div>
        </div>

        {isArchived ? (
          <button
            type="button"
            onClick={() => onUnarchive(capture.thingyId)}
            aria-label="Unarchive"
            className="shrink-0 cursor-pointer rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 transition-colors hover:bg-blue-200 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-300"
          >
            Archived
          </button>
        ) : (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {capture.token && resendState === "idle" && (
              <button
                type="button"
                onClick={handleResendClick}
                aria-label="Resend to destination"
                title="Resend to destination"
                className="cursor-pointer rounded p-1 text-gray-400 transition-all hover:scale-110 hover:bg-blue-100 hover:text-blue-600 active:scale-95 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              >
                <ResendIcon className="h-4 w-4" />
              </button>
            )}
            {capture.token && resendState === "sending" && (
              <span className="rounded p-1">
                <ResendIcon className="h-4 w-4 animate-spin text-blue-500" />
              </span>
            )}
            {capture.token && resendState === "sent" && (
              <span
                className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400"
              >
                Sent
              </span>
            )}
            {capture.token && resendState === "failed" && (
              <span
                className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
              >
                Failed
              </span>
            )}
            <button
              type="button"
              onClick={() => onArchive(capture.thingyId)}
              aria-label="Archive"
              title="Archive"
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <ArchiveIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function TechnicalLog({ logs }: { logs: LogEntry[] }) {
  return (
    <details className="w-full">
      <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        Technical log ({logs.length} entries)
      </summary>
      <ul className="mt-2 space-y-1">
        {logs.map((log) => (
          <li
            key={log.id}
            className="rounded border border-gray-100 px-3 py-2 text-xs dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-gray-600 dark:text-gray-400">
                {log.action}
              </span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              >
                {log.status}
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-600">
              {log.timestamp ? timeAgo(log.timestamp) : ""}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function ActivityFeed({ refreshKey }: ActivityFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState<DestinationFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const isBackgroundPoll = useRef(false);

  const fetchLogs = useCallback(async (showSkeleton: boolean) => {
    if (showSkeleton) setLoading(true);

    try {
      const url = showArchived ? "/api/logs?includeArchived=true" : "/api/logs";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setArchivedIds(new Set());
      }
    } catch {
      // Silent failure for background polling
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchLogs(true);
    isBackgroundPoll.current = true;
  }, [refreshKey, fetchLogs, showArchived]);

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleArchive = useCallback(async (thingyId: number) => {
    setArchivedIds((prev) => new Set(prev).add(thingyId));

    try {
      await fetch("/api/archive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thingyId, archived: true }),
      });
    } catch {
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(thingyId);
        return next;
      });
    }
  }, []);

  const handleUnarchive = useCallback(async (thingyId: number) => {
    try {
      await fetch("/api/archive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thingyId, archived: false }),
      });
      fetchLogs(false);
    } catch {
      // Silent failure
    }
  }, [fetchLogs]);

  const handleResend = useCallback(async (thingyId: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thingyId }),
      });
      const data = await res.json();
      fetchLogs(false);
      return !!data.success;
    } catch {
      return false;
    }
  }, [fetchLogs]);

  const allCaptures = deriveCaptures(logs).filter((c) => !archivedIds.has(c.thingyId));

  const searchLower = search.toLowerCase().trim();
  const filtered = allCaptures.filter((c) => {
    if (!tokenMatchesFilter(c.token, destFilter)) return false;
    if (searchLower && !c.content.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const isFiltering = search.trim() !== "" || destFilter !== "all";

  if (loading) {
    return (
      <section className="w-full">
        <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
          Activity
        </h2>
        <SkeletonRows />
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
          Activity
        </h2>

        {allCaptures.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search captures..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>
              <select
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value as DestinationFilter)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {DESTINATION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
              />
              Include archived
            </label>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
            {isFiltering
              ? "No captures match your search."
              : "No captures yet. Submit your first thought above."}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((capture) => (
              <CaptureRow key={capture.thingyId} capture={capture} onArchive={handleArchive} onUnarchive={handleUnarchive} onResend={handleResend} />
            ))}
          </ul>
        )}
      </div>

      {logs.length > 0 && <TechnicalLog logs={logs} />}
    </section>
  );
}
