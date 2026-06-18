"use client";

import { useEffect, useState } from "react";
import { generateReportPdf, listSpecialists } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FileDown, Stethoscope } from "lucide-react";

export function ReportGenerator() {
  const [specialists, setSpecialists] = useState<string[]>([]);
  const [specialistType, setSpecialistType] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    listSpecialists()
      .then((list) => {
        setSpecialists(list);
        setSpecialistType(list[0] || "");
      })
      .catch(() => {});
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!specialistType || !symptoms.trim() || loading) return;
    setLoading(true);
    setError("");
    setDone(false);
    try {
      const blob = await generateReportPdf({
        specialist_type: specialistType,
        symptoms,
        additional_context: additionalContext,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medrecords-report-${specialistType.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card id="report-generator">
      <CardHeader
        title="Generate consultation report"
        subtitle="A pre-visit PDF summary built from your records"
        icon={<Stethoscope className="h-4 w-4" />}
      />
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Specialist</label>
          <select
            value={specialistType}
            onChange={(e) => setSpecialistType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {specialists.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Symptoms <span className="text-slate-400">(required)</span>
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe what you've been experiencing, since when, severity..."
            rows={3}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Additional context <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Anything else worth mentioning..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {done && !error && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Report downloaded.
          </p>
        )}

        <Button type="submit" disabled={loading || !symptoms.trim()}>
          {loading ? (
            "Generating..."
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Generate PDF report
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}