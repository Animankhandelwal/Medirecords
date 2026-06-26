"use client";

import { useEffect, useState } from "react";
import { listLabReports, getLabTrend, type LabReport } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/card";
import { LabLevelCard } from "@/components/dashboard/lab-level-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangle, FlaskConical, TrendingUp } from "lucide-react";

function latestLabValues(reports: LabReport[]) {
  const seen = new Set<string>();
  const latest = [];
  for (const report of reports) {
    for (const value of report.lab_values) {
      const key = value.test_name_normalized || value.test_name;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push(value);
    }
  }
  return latest;
}

export default function LabReportsPage() {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [trends, setTrends] = useState<Record<string, number[]>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listLabReports()
      .then(setLabReports)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const testNames = Array.from(
      new Set(labReports.flatMap((r) => r.lab_values.map((v) => v.test_name_normalized || v.test_name)))
    );
    if (testNames.length === 0) return;
    Promise.all(
      testNames.map((name) =>
        getLabTrend(name)
          .then((pts) => [name, pts.filter((p) => p.value != null).map((p) => p.value as number)] as const)
          .catch(() => [name, []] as const)
      )
    ).then((results) => setTrends(Object.fromEntries(results)));
  }, [labReports]);

  const allValues = latestLabValues(labReports);
  const abnormalCount = allValues.filter((v) => v.is_abnormal).length;
  const normalCount = allValues.filter((v) => !v.is_abnormal).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Lab Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Latest values from all your reports, with historical trends.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Summary stats */}
      {labReports.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total reports" value={labReports.length} icon={FlaskConical} tone="brand" />
          <StatCard label="Tests tracked" value={allValues.length} icon={TrendingUp} tone="green" />
          <StatCard label="Normal values" value={normalCount} icon={FlaskConical} tone="green" />
          <StatCard label="Abnormal values" value={abnormalCount} icon={AlertTriangle} tone="red" />
        </div>
      )}

      {/* Latest values grid */}
      {allValues.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Latest test results</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allValues.map((v) => (
              <LabLevelCard
                key={v.id}
                value={v}
                trend={trends[v.test_name_normalized || v.test_name]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report history */}
      <Card>
        <CardHeader
          title="Report history"
          subtitle={`${labReports.length} report${labReports.length !== 1 ? "s" : ""} on file`}
          icon={<FlaskConical className="h-4 w-4" />}
        />

        {labReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <FlaskConical className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-500">No lab reports yet</p>
            <p className="mt-1 text-xs text-slate-400">Upload a lab report from the Records page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labReports.map((report) => (
              <div key={report.id} className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-soft">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{report.report_type || "Lab Report"}</p>
                    <p className="text-xs text-slate-500">
                      {report.lab_name && `${report.lab_name} · `}
                      {report.report_date
                        ? new Date(report.report_date).toLocaleDateString(undefined, { dateStyle: "medium" })
                        : "Date unknown"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {report.lab_values.length} values
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.lab_values.slice(0, 8).map((v) => (
                    <span
                      key={v.id}
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        v.is_abnormal
                          ? "bg-red-50 text-red-700 font-medium"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {v.test_name_normalized || v.test_name}
                      {v.value != null ? `: ${v.value}${v.unit ? ` ${v.unit}` : ""}` : ""}
                    </span>
                  ))}
                  {report.lab_values.length > 8 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      +{report.lab_values.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}