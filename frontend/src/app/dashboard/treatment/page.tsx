"use client";

import { useEffect, useState } from "react";
import { listPrescriptions, type Prescription } from "@/lib/api";
import { TreatmentTracker } from "@/components/dashboard/treatment-tracker";
import { Activity } from "lucide-react";

export default function TreatmentPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    listPrescriptions().then(setPrescriptions).catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Treatment Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track daily medication doses, monitor adherence, and schedule doctor consultations.
        </p>
      </div>

      {/* Adherence tip */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <Activity className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-brand-900">Stay consistent</p>
          <p className="text-xs text-brand-700">
            Mark your dose as taken or skipped each day. Aim for ≥80% adherence for the best treatment outcomes.
          </p>
        </div>
      </div>

      <TreatmentTracker
        prescriptions={prescriptions.map((rx) => ({
          id: rx.id,
          diagnosis: rx.diagnosis,
          doctor_name: rx.doctor_name,
        }))}
      />
    </main>
  );
}