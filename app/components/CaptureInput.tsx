"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GITHUB_BUTTON_REPO_OPTIONS } from "@/lib/github-ui-repos";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type GithubRepoTarget = (typeof GITHUB_BUTTON_REPO_OPTIONS)[number];

interface CaptureInputProps {
  onCapture?: () => void;
}

function useSpeechSupported(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);
  return supported;
}

export default function CaptureInput({ onCapture }: CaptureInputProps) {
  /** Always-on GitHub routing: fuzzy target repo (equivalent to #feature #lot / #thingy). */
  const [repoTarget, setRepoTarget] = useState<GithubRepoTarget>("lot");

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const speechSupported = useSpeechSupported();

  const clearFeedback = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500);
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setText((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return prev + separator + transcript.trim();
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setFeedback({
          type: "error",
          message: `Speech error: ${event.error}`,
        });
        clearFeedback();
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleSubmit() {
    recognitionRef.current?.abort();

    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const clientId = crypto.randomUUID();
      const body = {
        text: trimmed,
        clientId,
        routing: { mode: "github" as const, secondary: repoTarget },
      };

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          message: data.error ?? "Something went wrong.",
        });
        clearFeedback();
        return;
      }

      setText("");
      setFeedback({ type: "success", message: "Captured!" });
      clearFeedback();
      onCapture?.();
    } catch {
      setFeedback({
        type: "error",
        message: "Network error. Please try again.",
      });
      clearFeedback();
    } finally {
      setSubmitting(false);
    }
  }

  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <section className="w-full space-y-3">
      <label htmlFor="capture-input" className="sr-only">
        Capture a thought
      </label>

      <div className="relative">
        <textarea
          ref={textareaRef}
          id="capture-input"
          className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="Capture a thought..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
          autoFocus
        />

        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={submitting}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              listening
                ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
            }`}
          >
            {listening ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 animate-pulse"
              >
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          GitHub repo
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="Target GitHub repository"
        >
          {GITHUB_BUTTON_REPO_OPTIONS.map((name) => (
            <RoutingTag
              key={name}
              label={`#${name}`}
              selected={repoTarget === name}
              onClick={() => setRepoTarget(name as GithubRepoTarget)}
            />
          ))}
        </div>
      </div>

      {listening && (
        <p className="text-center text-sm text-red-500 dark:text-red-400 animate-pulse">
          Listening...
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        className="w-full h-12 rounded-lg bg-blue-600 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>

      <div className="flex items-center justify-between">
        <div aria-live="polite" className="min-h-[1.5rem] text-sm">
          {feedback?.type === "success" && (
            <p className="text-green-600 dark:text-green-400">
              {feedback.message}
            </p>
          )}
          {feedback?.type === "error" && (
            <p className="text-red-600 dark:text-red-400">{feedback.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Show keyword help"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-blue-500 dark:hover:text-blue-400"
        >
          ?
        </button>
      </div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Keywords
              </h3>
              <button
                onClick={() => setHelpOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Every capture is sent to GitHub Issues. Choose <span className="font-mono font-semibold">#lot</span> or{" "}
              <span className="font-mono font-semibold">#thingy</span> under the box (same as{" "}
              <span className="font-mono">#feature #lot</span> / <span className="font-mono">#feature #thingy</span>
              ). Keywords in your text do not change the destination from this screen.
            </p>
            <div className="space-y-4">
              <KeywordGroup
                title="Other routes (API / advanced)"
                keywords={["#task", "#idea", "#email chris"]}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Other tokens still work if you call the ingest API without UI routing.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Floating voice capture button -- bottom-left for right-hand thumb reach */}
      {speechSupported && (
        <button
          type="button"
          onClick={() => {
            textareaRef.current?.focus();
            toggleListening();
          }}
          disabled={submitting}
          aria-label={listening ? "Stop listening" : "Quick voice capture"}
          className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? "bg-red-500 text-white shadow-red-300 dark:shadow-red-900"
              : "bg-red-500/80 text-white shadow-red-200 hover:bg-red-500 dark:shadow-red-900/50"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`h-6 w-6 ${listening ? "animate-pulse" : ""}`}
          >
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </button>
      )}
    </section>
  );
}

function RoutingTag({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200"
          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
      }`}
    >
      {label}
    </button>
  );
}

function KeywordGroup({ title, keywords }: { title: string; keywords: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
