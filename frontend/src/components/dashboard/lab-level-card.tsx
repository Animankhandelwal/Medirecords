"use client";

import { useState } from "react";
import type { LabValue } from "@/lib/api";
import { explainTerm } from "@/lib/api";
import { getStaticDescription } from "@/lib/lab-descriptions";
import { Sparkline } from "@/components/dashboard/sparkline";
import { Info, X } from "lucide-react";

/** Module-level cache so repeated opens are instant */
const _explanationCache = new Map<string, string>();

export function LabLevelCard({ value, trend }: { value: LabValue; trend?: number[] }) {
  const low = value.reference_range_low;
  const high = value.reference_range_high;
  const v = value.value;

  const hasRange = low != null && high != null && high > low && v != null;
  let percent = 50;
  if (hasRange) {
    const pad = (high - low) * 0.2;
    const min = low - pad;
    const max = high + pad;
    percent = Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  }

  const testKey = value.test_name_normalized || value.test_name;
  const staticDesc = getStaticDescription(testKey);

  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(
    _explanationCache.get(testKey) ?? null
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);

    // Static description available — no API call needed
    if (staticDesc) return;

    // Check cache
    const cached = _explanationCache.get(testKey);
    if (cached) { setExplanation(cached); return; }

    // Fetch from LLM
    setLoading(true);
    setFetchError("");
    try {
      const res = await explainTerm(testKey, "lab_test");
      _explanationCache.set(testKey, res.explanation);
      setExplanation(res.explanation);
    } catch {
      setFetchError("Couldn't load explanation. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`group relative rounded-xl border bg-white p-4 shadow-soft transition-all duration-200 ${
        open
          ? "border-brand-200 shadow-md"
          : "border-slate-200/70 hover:border-brand-100 hover:shadow"
      }`}
    >
      {/* Header row */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium text-slate-700">
          {value.test_name_normalized || value.test_name}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              value.is_abnormal ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
          <button
            onClick={handleToggle}
            title={open ? "Close explanation" : "What does this test mean?"}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              open
                ? "bg-brand-100 text-brand-600"
                : "text-slate-300 hover:bg-brand-50 hover:text-brand-500"
            }`}
          >
            {open ? <X className="h-3 w-3" /> : <Info className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Value */}
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value.value_text ?? value.value}
        <span className="ml-1 text-xs font-normal text-slate-400">{value.unit || ""}</span>
      </p>

      {/* Range bar */}
      {hasRange ? (
        <div className="mt-3">
          <div className="relative h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="absolute inset-y-0 rounded-full bg-emerald-200"
              style={{ left: "20%", right: "20%" }}
            />
            <div
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow ${
                value.is_abnormal ? "bg-red-500" : "bg-emerald-600"
              }`}
              style={{ left: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Range {low}–{high} {value.unit || ""}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">{value.reference_range_text || "No reference range"}</p>
      )}

      {/* Trend sparkline */}
      {trend && trend.length >= 2 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="text-xs text-slate-400">Trend</span>
          <Sparkline values={trend} abnormal={!!value.is_abnormal} />
        </div>
      )}

      {/* ── Explanation panel ─────────────────────────────────────── */}
      {open && (
        <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs leading-relaxed text-slate-700 animate-fade-in">
          {staticDesc ? (
            <>
              <p className="mb-2">{staticDesc.what}</p>
              {(staticDesc.high || staticDesc.low) && (
                <div className="space-y-1 border-t border-brand-100 pt-2">
                  {staticDesc.high && (
                    <p>
                      <span className="font-semibold text-red-600">If high: </span>
                      {staticDesc.high}
                    </p>
                  )}
                  {staticDesc.low && (
                    <p>
                      <span className="font-semibold text-blue-600">If low: </span>
                      {staticDesc.low}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="h-3 w-3 animate-spin rounded-full border border-brand-400 border-t-transparent" />
              Loading explanation…
            </div>
          ) : fetchError ? (
            <p className="text-red-600">{fetchError}</p>
          ) : explanation ? (
            <p>{explanation}</p>
          ) : null}

          <p className="mt-2 text-slate-400 italic">
            Not a substitute for medical advice. Always consult your doctor.
          </p>
        </div>
      )}
    </div>
  );
}