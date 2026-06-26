"use client";

import { useEffect, useRef, useState } from "react";
import { listPrescriptions, explainTerm, type Prescription } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, HelpCircle, Pill, Stethoscope, X } from "lucide-react";

/** Module-level cache so repeated opens are instant */
const _diagnosisCache = new Map<string, string>();

function DiagnosisExplainer({ diagnosis }: { diagnosis: string }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(
    _diagnosisCache.get(diagnosis) ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);

    if (_diagnosisCache.has(diagnosis)) {
      setExplanation(_diagnosisCache.get(diagnosis)!);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await explainTerm(diagnosis, "diagnosis");
      _diagnosisCache.set(diagnosis, res.explanation);
      setExplanation(res.explanation);
    } catch {
      setError("Couldn't load explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
          open
            ? "bg-brand-100 text-brand-700"
            : "bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
        }`}
      >
        {open ? <X className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
        {open ? "Close" : "What is this?"}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="mt-3 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-purple-50/40 p-4 text-sm leading-relaxed text-slate-700 animate-fade-in"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-brand-400 border-t-transparent" />
              Fetching plain-language explanation…
            </div>
          ) : error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : explanation ? (
            <>
              <p className="font-semibold text-slate-800 mb-2">About: {diagnosis}</p>
              <p>{explanation}</p>
              <p className="mt-3 text-xs text-slate-400 italic">
                This is a general overview. For advice specific to your situation, always consult your doctor.
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MedicationChip({ name, dosage, frequency, isActive }: {
  name: string; dosage: string | null; frequency: string | null; isActive: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 transition ${isActive ? "bg-emerald-50" : "bg-slate-50"}`}>
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
        <Pill className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">
          {[dosage, frequency].filter(Boolean).join(" · ") || "No dosage info"}
        </p>
      </div>
      {!isActive && <Badge tone="slate" className="ml-auto mt-0.5 shrink-0">Inactive</Badge>}
    </div>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listPrescriptions()
      .then(setPrescriptions)
      .catch((e) => setError(e.message));
  }, []);

  const totalMeds = prescriptions.reduce((acc, rx) => acc + rx.medications.length, 0);
  const activeMeds = prescriptions.reduce(
    (acc, rx) => acc + rx.medications.filter((m) => m.is_active).length,
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Prescriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your diagnoses and prescribed medications, extracted from your documents.
          Click <span className="font-medium text-brand-600">"What is this?"</span> on any diagnosis for a plain-language explanation.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Summary bar */}
      {prescriptions.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: "Prescriptions", val: prescriptions.length, icon: FileText, color: "bg-brand-50 text-brand-600" },
            { label: "Total medications", val: totalMeds, icon: Pill, color: "bg-purple-50 text-purple-600" },
            { label: "Active medications", val: activeMeds, icon: Pill, color: "bg-emerald-50 text-emerald-600" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-soft">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-900">{item.val}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription cards */}
      {prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">No prescriptions yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload a prescription from the{" "}
            <a href="/dashboard/records" className="text-brand-600 hover:underline">Records</a>{" "}
            page and AI will extract the medications.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((rx) => (
            <Card key={rx.id} className="flex flex-col">
              {/* Prescription header */}
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <Stethoscope className="h-5 w-5 text-brand-600" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 leading-snug">
                    {rx.diagnosis || "Prescription"}
                  </h3>
                  {rx.doctor_name && (
                    <p className="text-xs text-slate-500">{rx.doctor_name}</p>
                  )}
                  {rx.hospital_name && (
                    <p className="text-xs text-slate-400">{rx.hospital_name}</p>
                  )}
                </div>
              </div>

              {/* Date */}
              {rx.prescription_date && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(rx.prescription_date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
              )}

              {/* Diagnosis explainer */}
              {rx.diagnosis && (
                <div className="mb-4">
                  <DiagnosisExplainer diagnosis={rx.diagnosis} />
                </div>
              )}

              {/* Separator */}
              {rx.medications.length > 0 && (
                <div className="mb-3 border-t border-slate-100" />
              )}

              {/* Medications */}
              {rx.medications.length > 0 ? (
                <div className="flex-1 space-y-2">
                  {rx.medications.map((m) => (
                    <MedicationChip
                      key={m.id}
                      name={m.name}
                      dosage={m.dosage}
                      frequency={m.frequency}
                      isActive={m.is_active}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No medications extracted.</p>
              )}

              {rx.notes && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {rx.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}