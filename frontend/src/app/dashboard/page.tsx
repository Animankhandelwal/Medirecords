"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearToken,
  getToken,
  getDashboard,
  getLabTrend,
  listDocuments,
  listLabReports,
  listPrescriptions,
  uploadDocument,
  downloadDocument,
  downloadDocumentsZip,
  DashboardStats,
  DocumentDateFilter,
  DocumentRecord,
  LabReport,
  Prescription,
  getMe,
  User,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { LabLevelCard } from "@/components/dashboard/lab-level-card";
import { ReportGenerator } from "@/components/dashboard/report-generator";
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  ActivitySquare,
  AlertTriangle,
  Download,
  FileText,
  FlaskConical,
  Pill,
  UploadCloud,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function latestLabValues(reports: LabReport[]) {
  // Reports arrive ordered newest-first, so the first time a test is seen is its latest reading.
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

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [trends, setTrends] = useState<Record<string, number[]>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedSpecialist, setSuggestedSpecialist] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<DocumentDateFilter>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);

  const refresh = useCallback(async () => {
    const [s, d, l, p] = await Promise.all([
      getDashboard(),
      listDocuments(docFilter),
      listLabReports(),
      listPrescriptions(),
    ]);
    setStats(s);
    setDocuments(d);
    setLabReports(l);
    setPrescriptions(p);
  }, [docFilter]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router]);

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, [refresh]);

  // Poll while any document is still pending/processing.
  useEffect(() => {
    const hasInFlight = documents.some(
      (d) => d.processing_status === "pending" || d.processing_status === "processing"
    );
    if (!hasInFlight) return;
    const interval = setInterval(() => {
      refresh().catch((err) => setError(err.message));
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, refresh]);

  // Fetch historical trend points for each distinct test once lab reports load.
  useEffect(() => {
    const testNames = Array.from(
      new Set(
        labReports.flatMap((r) => r.lab_values.map((v) => v.test_name_normalized || v.test_name))
      )
    );
    if (testNames.length === 0) return;
    Promise.all(
      testNames.map((name) =>
        getLabTrend(name)
          .then((points) => [name, points.filter((p) => p.value != null).map((p) => p.value as number)] as const)
          .catch(() => [name, []] as const)
      )
    ).then((results) => {
      setTrends(Object.fromEntries(results));
    });
  }, [labReports]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await uploadDocument(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  async function handleDownloadOne(doc: DocumentRecord) {
    setError("");
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadZip() {
    setError("");
    setZipDownloading(true);
    try {
      await downloadDocumentsZip(docFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setZipDownloading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ActivitySquare className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-900">MedRecords</span>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-10">
          <div id="overview" className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
              <p className="text-sm text-slate-500">
                {user ? `Welcome back, ${user.full_name.split(" ")[0]}` : "Loading your records..."}
              </p>
            </div>
            <label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload document"}
              </Button>
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {stats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Prescriptions" value={stats.prescription_count} icon={FileText} tone="brand" />
              <StatCard label="Medications" value={stats.medication_count} icon={Pill} tone="green" />
              <StatCard label="Lab reports" value={stats.lab_report_count} icon={FlaskConical} tone="amber" />
              <StatCard label="Abnormal values" value={stats.abnormal_lab_values} icon={AlertTriangle} tone="red" />
            </div>
          )}

          {labReports.length > 0 && (
            <div id="lab-levels">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Detected levels</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {latestLabValues(labReports).map((v) => (
                  <LabLevelCard
                    key={v.id}
                    value={v}
                    trend={trends[v.test_name_normalized || v.test_name]}
                  />
                ))}
              </div>
            </div>
          )}

          <Card id="documents">
            <CardHeader title="Documents" subtitle="Everything you've uploaded" icon={<FileText className="h-4 w-4" />} />

            <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
                <select
                  value={docFilter.year ?? ""}
                  onChange={(e) =>
                    setDocFilter((f) => ({
                      ...f,
                      year: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All years</option>
                  {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
                <select
                  value={docFilter.month ?? ""}
                  onChange={(e) =>
                    setDocFilter((f) => ({
                      ...f,
                      month: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All months</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Day</label>
                <select
                  value={docFilter.day ?? ""}
                  onChange={(e) =>
                    setDocFilter((f) => ({
                      ...f,
                      day: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All days</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {(docFilter.year || docFilter.month || docFilter.day) && (
                <Button variant="secondary" onClick={() => setDocFilter({})}>
                  Clear filter
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={handleDownloadZip}
                disabled={zipDownloading || documents.length === 0}
                className="ml-auto"
              >
                <Download className="h-4 w-4" />
                {zipDownloading ? "Preparing zip..." : "Download all (zip)"}
              </Button>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                text={
                  docFilter.year || docFilter.month || docFilter.day
                    ? "No documents match this date — try a different filter."
                    : "No documents yet — upload your first record above."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 font-medium">File</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Source</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                      <th className="pb-2 font-medium text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">{doc.file_name}</p>
                          {doc.processing_status === "failed" && doc.processing_error && (
                            <p className="mt-0.5 text-xs text-red-600">{doc.processing_error}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{doc.document_type || "unclassified"}</td>
                        <td className="py-3 pr-4 text-slate-500">{doc.hospital_name || "—"}</td>
                        <td className="py-3 pr-4 text-slate-500">
                          {new Date(doc.document_date || doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={doc.processing_status} />
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <button
                            onClick={() => handleDownloadOne(doc)}
                            disabled={!doc.downloadable || downloadingId === doc.id}
                            title={doc.downloadable ? "Download original file" : "Original file not available"}
                            className="text-slate-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card id="prescriptions">
            <CardHeader title="Prescriptions" subtitle="Diagnoses and medications" icon={<Pill className="h-4 w-4" />} />
            {prescriptions.length === 0 ? (
              <EmptyState text="No prescriptions yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-lg border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-900">{rx.diagnosis || "Prescription"}</p>
                    {rx.doctor_name && <p className="text-xs text-slate-500">{rx.doctor_name}</p>}
                    <ul className="mt-3 space-y-1.5">
                      {rx.medications.map((m) => (
                        <li key={m.id} className="flex items-baseline gap-2 text-sm">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                          <span className="text-slate-800">
                            {m.name}{" "}
                            <span className="text-slate-500">
                              {m.dosage} {m.frequency ? `· ${m.frequency}` : ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <ReportGenerator suggestedSpecialist={suggestedSpecialist} />
        </main>
      </div>

      <ChatWidget onSpecialistSuggested={setSuggestedSpecialist} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentRecord["processing_status"] }) {
  const tone = {
    pending: "slate",
    processing: "amber",
    completed: "green",
    failed: "red",
  } as const;
  return <Badge tone={tone[status]}>{status}</Badge>;
}