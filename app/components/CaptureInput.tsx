"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSupported = useSpeechSupported();

  const clearFeedback = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500);
  }, []);

  useEffect(() => {
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

      <div className="relative">
        <textarea
          id="capture-input"
          className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="Capture a thought..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
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
