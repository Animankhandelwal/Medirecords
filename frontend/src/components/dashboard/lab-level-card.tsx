import type { LabValue } from "@/lib/api";
import { Sparkline } from "@/components/dashboard/sparkline";

export function LabLevelCard({ value, trend }: { value: LabValue; trend?: number[] }) {
  const low = value.reference_range_low;
  const high = value.reference_range_high;
  const v = value.value;

  const hasRange = low != null && high != null && high > low && v != null;
  // Position the value within [low, high], padded 20% on each side so in-range
  // values don't sit flush against the bar edges.
  let percent = 50;
  if (hasRange) {
    const pad = (high - low) * 0.2;
    const min = low - pad;
    const max = high + pad;
    percent = Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  }

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium text-slate-700">
          {value.test_name_normalized || value.test_name}
        </p>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            value.is_abnormal ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
      </div>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value.value_text ?? value.value}
        <span className="ml-1 text-xs font-normal text-slate-400">{value.unit || ""}</span>
      </p>

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

      {trend && trend.length >= 2 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="text-xs text-slate-400">Trend</span>
          <Sparkline values={trend} abnormal={!!value.is_abnormal} />
        </div>
      )}
    </div>
  );
}