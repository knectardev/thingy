"use client";

import { useState } from "react";

const ROUTES = [
  { token: "#task / #lot / #feature", dest: "GitHub Issues" },
  { token: "#lendl task", dest: "GitHub Issues" },
  { token: "#idea / #tshirt", dest: "Google Sheets" },
  { token: "#email chris", dest: "Gmail (Chris)" },
  { token: "#email alana", dest: "Gmail (Alana)" },
];

interface InfoSidebarProps {
  aboutOpen: boolean;
  onAboutClose: () => void;
}

export default function InfoSidebar({ aboutOpen, onAboutClose }: InfoSidebarProps) {
  return (
    <>
      {/* About modal (all screen sizes) */}
      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 lg:hidden"
          onClick={onAboutClose}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                About
              </h2>
              <button
                onClick={onAboutClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            About
          </h2>
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}

function SidebarContent() {
  return (
    <div className="space-y-5 text-sm text-gray-600 dark:text-gray-300">
      <div>
        <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
          What is Thingy?
        </h3>
        <p className="leading-relaxed">
          A personal capture tool. Type or dictate a thought, tag it with a
          keyword, and it routes automatically to the right place.
        </p>
      </div>

      <div>
        <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
          How it works
        </h3>
        <ol className="list-decimal space-y-1 pl-4 leading-relaxed">
          <li>Type or dictate your thought</li>
          <li>
            Add a <span className="font-mono text-blue-600 dark:text-blue-400">#keyword</span> at
            the end
          </li>
          <li>Hit Submit &mdash; it gets routed and logged</li>
        </ol>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Routing table
        </h3>
        <ul className="space-y-1.5">
          {ROUTES.map((r) => (
            <li key={r.token} className="flex items-start gap-2">
              <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {r.token}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                &rarr; {r.dest}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
          Voice input
        </h3>
        <p className="leading-relaxed">
          Say{" "}
          <span className="font-mono text-blue-600 dark:text-blue-400">
            &ldquo;hashtag&rdquo;
          </span>{" "}
          or{" "}
          <span className="font-mono text-blue-600 dark:text-blue-400">
            &ldquo;keyword&rdquo;
          </span>{" "}
          instead of typing <span className="font-mono">#</span>. Spaces after
          the hash are handled automatically.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          Every capture is logged to a Postgres database. Nothing is lost, even
          without a keyword &mdash; untagged captures are stored as
          uncategorized.
        </p>
      </div>
    </div>
  );
}
