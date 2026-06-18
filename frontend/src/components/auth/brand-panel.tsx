import { ActivitySquare } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <ActivitySquare className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold text-slate-900">MedRecords</span>
    </div>
  );
}

export function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.5), transparent 50%), radial-gradient(circle at 80% 70%, rgba(79,70,229,0.4), transparent 50%)",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <ActivitySquare className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-white">MedRecords</span>
        </div>
      </div>
      <div className="relative z-10 max-w-md">
        <p className="text-2xl font-medium leading-snug">
          All your prescriptions, lab reports, and medical history — organized automatically.
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Upload a document and let MedRecords extract the details for you.
        </p>
      </div>
      <div className="relative z-10 text-xs text-slate-500">
        © {new Date().getFullYear()} MedRecords
      </div>
    </div>
  );
}