"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listDocuments,
  uploadDocument,
  downloadDocument,
  downloadDocumentsZip,
  type DocumentRecord,
  type DocumentDateFilter,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Download, FileText, UploadCloud, Zap } from "lucide-react";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function StatusBadge({ status }: { status: DocumentRecord["processing_status"] }) {
  const tone = { pending:"slate", processing:"amber", completed:"green", failed:"red" } as const;
  return <Badge tone={tone[status]}>{status}</Badge>;
}

export default function RecordsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [docFilter, setDocFilter] = useState<DocumentDateFilter>({});
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const d = await listDocuments(docFilter);
    setDocuments(d);
  }, [docFilter]);

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [refresh]);

  useEffect(() => {
    const hasInFlight = documents.some(
      (d) => d.processing_status === "pending" || d.processing_status === "processing"
    );
    if (!hasInFlight) return;
    const t = setInterval(() => refresh().catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [documents, refresh]);

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

  async function handleDownloadOne(doc: DocumentRecord) {
    setDownloadingId(doc.id);
    try { await downloadDocument(doc); }
    catch (err) { setError(err instanceof Error ? err.message : "Download failed"); }
    finally { setDownloadingId(null); }
  }

  async function handleDownloadZip() {
    setZipDownloading(true);
    try { await downloadDocumentsZip(docFilter); }
    catch (err) { setError(err instanceof Error ? err.message : "Download failed"); }
    finally { setZipDownloading(false); }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Records</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload any medical document — prescription, lab report, discharge summary.
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
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
        </label>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Upload hint */}
      {documents.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-16 text-center transition hover:border-brand-400 hover:bg-brand-50"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
            <UploadCloud className="h-8 w-8 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Drop your first document here</p>
            <p className="text-sm text-slate-500">PDF, JPG, or PNG · Prescriptions, lab reports, discharge summaries</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-600">
            <Zap className="h-3.5 w-3.5" /> AI extracts and organizes everything automatically
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Documents"
          subtitle={`${documents.length} file${documents.length !== 1 ? "s" : ""}`}
          icon={<FileText className="h-4 w-4" />}
          action={
            <Button
              variant="secondary"
              onClick={handleDownloadZip}
              disabled={zipDownloading || documents.length === 0}
            >
              <Download className="h-4 w-4" />
              {zipDownloading ? "Preparing…" : "Download all (zip)"}
            </Button>
          }
        />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4">
          {[
            { label: "Year", key: "year" as const, opts: Array.from({length:8},(_,i)=>new Date().getFullYear()-i).map(y=>({val:y,label:String(y)})) },
            { label: "Month", key: "month" as const, opts: MONTH_NAMES.map((n,i)=>({val:i+1,label:n})) },
            { label: "Day", key: "day" as const, opts: Array.from({length:31},(_,i)=>({val:i+1,label:String(i+1)})) },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
              <select
                value={docFilter[key] ?? ""}
                onChange={(e) => setDocFilter((f) => ({ ...f, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All</option>
                {opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
          ))}
          {(docFilter.year || docFilter.month || docFilter.day) && (
            <Button variant="secondary" onClick={() => setDocFilter({})}>Clear</Button>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No documents match this filter.</p>
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
                  <tr key={doc.id} className="group transition-colors hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{doc.file_name}</p>
                      {doc.processing_status === "failed" && doc.processing_error && (
                        <p className="mt-0.5 text-xs text-red-600">{doc.processing_error}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{doc.document_type || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">{doc.hospital_name || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(doc.document_date || doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right"><StatusBadge status={doc.processing_status} /></td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        onClick={() => handleDownloadOne(doc)}
                        disabled={!doc.downloadable || downloadingId === doc.id}
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
    </main>
  );
}