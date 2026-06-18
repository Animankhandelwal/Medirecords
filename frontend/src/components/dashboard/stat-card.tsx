import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "brand" | "red" | "amber" | "green";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}