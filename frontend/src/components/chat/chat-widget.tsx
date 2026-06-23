"use client";

import { useEffect, useRef, useState } from "react";
import { streamChat, suggestSpecialist, type ChatMessage } from "@/lib/api";
import { MessageCircle, Send, Stethoscope, X } from "lucide-react";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can answer questions about your prescriptions, medications, and lab results, or help you note down symptoms to discuss with your doctor. What would you like to know?",
};

export function ChatWidget({
  onSpecialistSuggested,
}: {
  onSpecialistSuggested?: (specialistType: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      let acc = "";
      await streamChat(nextMessages, (chunk) => {
        acc += chunk;
        setMessages([...nextMessages, { role: "assistant", content: acc }]);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach the assistant");
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggest() {
    const conversation = messages.filter((m) => m.content.trim());
    if (conversation.length === 0 || suggesting || loading) return;
    setSuggesting(true);
    setError("");
    try {
      const suggestion = await suggestSpecialist(conversation);
      const summary = [
        `Recommended specialist: ${suggestion.specialist_type} (${suggestion.urgency})`,
        suggestion.reasoning,
        `What to tell the doctor: ${suggestion.summary_for_doctor}`,
      ].join("\n\n");
      setMessages((prev) => [...prev, { role: "assistant", content: summary }]);
      onSpecialistSuggested?.(suggestion.specialist_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a recommendation");
    } finally {
      setSuggesting(false);
    }
  }

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-700"
        aria-label="Open assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Health assistant</p>
              <p className="text-xs text-slate-400">Based on your records</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-line rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content || (loading && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
          </div>

          {hasUserMessage && (
            <div className="border-t border-slate-100 px-3 py-2">
              <button
                onClick={handleSuggest}
                disabled={suggesting || loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                {suggesting ? "Analyzing conversation..." : "Suggest a specialist"}
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your reports or symptoms..."
              disabled={loading}
              className="flex-1 rounded-full border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}