"use client";

import { useState } from "react";
import { ReportGenerator } from "@/components/dashboard/report-generator";
import { streamChat, suggestSpecialist, type ChatMessage } from "@/lib/api";
import { Brain, MessageCircle, Send, Stethoscope } from "lucide-react";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can answer questions about your prescriptions, medications, and lab results, or help you note down symptoms to discuss with your doctor. What would you like to know?",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [suggestedSpecialist, setSuggestedSpecialist] = useState<string | null>(null);

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
    const conv = messages.filter((m) => m.content.trim());
    if (conv.length === 0 || suggesting || loading) return;
    setSuggesting(true);
    setError("");
    try {
      const s = await suggestSpecialist(conv);
      const summary = [
        `Recommended specialist: ${s.specialist_type} (${s.urgency})`,
        s.reasoning,
        `What to tell the doctor: ${s.summary_for_doctor}`,
      ].join("\n\n");
      setMessages((prev) => [...prev, { role: "assistant", content: summary }]);
      setSuggestedSpecialist(s.specialist_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a recommendation");
    } finally {
      setSuggesting(false);
    }
  }

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">AI Health Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask about your records, get specialist suggestions, then generate a doctor-ready report.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat panel — 3 cols */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft lg:col-span-3" style={{ minHeight: 560 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Health Assistant</p>
              <p className="text-xs text-slate-400">Powered by your medical records</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                    <Brain className="h-3.5 w-3.5 text-brand-600" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-brand-600 text-white"
                      : "rounded-tl-sm bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.content || (loading && i === messages.length - 1 ? (
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-100" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-200" />
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
          </div>

          {/* Suggest specialist */}
          {hasUserMessage && (
            <div className="border-t border-slate-100 px-4 py-2">
              <button
                onClick={handleSuggest}
                disabled={suggesting || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                {suggesting ? "Analyzing conversation…" : "Suggest a specialist"}
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your medications, lab results, or symptoms…"
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Report generator — 2 cols */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-700">
              After chatting, generate a doctor-ready PDF
            </p>
          </div>
          <ReportGenerator suggestedSpecialist={suggestedSpecialist} />
        </div>
      </div>
    </main>
  );
}