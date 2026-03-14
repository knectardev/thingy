"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { LogEntry } from "@/lib/types";
import { timeAgo } from "@/lib/types";

interface ActivityFeedProps {
  refreshKey: number;
}

const STATUS_STYLES: Record<string, string> = {
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  started:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

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

  // Initial fetch + re-fetch when refreshKey changes
  useEffect(() => {
    fetchLogs(true);
    isBackgroundPoll.current = true;
  }, [refreshKey, fetchLogs]);

  // Background polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

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
    <section className="w-full">
      <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Activity
      </h2>

      {logs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
          No captures yet. Submit your first thought above.
        </p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {log.action}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
                >
                  {log.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {log.timestamp ? timeAgo(log.timestamp) : ""}
                {log.token && (
                  <span className="ml-2 font-mono text-gray-500 dark:text-gray-400">
                    #{log.token}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
