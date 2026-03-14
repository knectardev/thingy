"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

function CaptureRow({ capture }: { capture: Capture }) {
  const dest = capture.token ? DESTINATION_LINKS[capture.token] : null;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
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
  const isBackgroundPoll = useRef(false);

  const fetchLogs = useCallback(async (showSkeleton: boolean) => {
    if (showSkeleton) setLoading(true);

    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch {
      // Silent failure for background polling
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(true);
    isBackgroundPoll.current = true;
  }, [refreshKey, fetchLogs]);

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const captures = deriveCaptures(logs);

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

        {captures.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
            No captures yet. Submit your first thought above.
          </p>
        ) : (
          <ul className="space-y-2">
            {captures.map((capture) => (
              <CaptureRow key={capture.thingyId} capture={capture} />
            ))}
          </ul>
        )}
      </div>

      {logs.length > 0 && <TechnicalLog logs={logs} />}
    </section>
  );
}
