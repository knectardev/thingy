"use client";

import { useState, useRef, useCallback } from "react";

interface CaptureInputProps {
  onCapture?: () => void;
}

export default function CaptureInput({ onCapture }: CaptureInputProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedback = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500);
  }, []);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const clientId = crypto.randomUUID();
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, clientId }),
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

  return (
    <section className="w-full space-y-3">
      <label htmlFor="capture-input" className="sr-only">
        Capture a thought
      </label>
      <textarea
        id="capture-input"
        className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        placeholder="Capture a thought..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitting}
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        className="w-full h-12 rounded-lg bg-blue-600 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>

      <div aria-live="polite" className="min-h-[1.5rem] text-center text-sm">
        {feedback?.type === "success" && (
          <p className="text-green-600 dark:text-green-400">
            {feedback.message}
          </p>
        )}
        {feedback?.type === "error" && (
          <p className="text-red-600 dark:text-red-400">{feedback.message}</p>
        )}
      </div>
    </section>
  );
}
