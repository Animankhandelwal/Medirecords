"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MedicationAdherence,
  Consultation,
  TrackingSummary,
  getTrackingSummary,
  logDose,
  listConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";

// ── small helpers ──────────────────────────────────────────────────────────

function AdherenceBar({ pct }: { pct: number | null }) {
  if (pct === null)
    return <span className="text-xs text-slate-400">No data yet</span>;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium text-slate-600">{pct}%</span>
    </div>
  );
}

function consultationStatusTone(
  status: Consultation["status"]
): "green" | "amber" | "red" | "slate" {
  return status === "completed"
    ? "green"
    : status === "cancelled"
    ? "red"
    : "amber";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── sub-components ─────────────────────────────────────────────────────────

function MedicationRow({
  med,
  onTaken,
  onSkipped,
}: {
  med: MedicationAdherence;
  onTaken: (id: number) => void;
  onSkipped: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">{med.medication_name}</span>
            {med.dosage && (
              <span className="text-xs text-slate-500">{med.dosage}</span>
            )}
            {med.logged_today ? (
              <Badge tone="green">Logged today</Badge>
            ) : (
              <Badge tone="amber">Pending today</Badge>
            )}
          </div>
          {med.frequency && (
            <p className="mt-0.5 text-xs text-slate-500">{med.frequency}</p>
          )}
          <div className="mt-2">
            <AdherenceBar pct={med.adherence_pct} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!med.logged_today && (
            <>
              <button
                onClick={() => onTaken(med.medication_id)}
                title="Mark as taken"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onSkipped(med.medication_id)}
                title="Mark as skipped"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-slate-50 pt-3 text-xs text-slate-600">
          {med.duration && (
            <>
              <span className="text-slate-400">Duration</span>
              <span>{med.duration}</span>
            </>
          )}
          <span className="text-slate-400">Taken ({7}d)</span>
          <span>{med.taken_last_n_days} doses</span>
          <span className="text-slate-400">Skipped ({7}d)</span>
          <span>{med.skipped_last_n_days} doses</span>
        </div>
      )}
    </div>
  );
}

interface AddConsultationFormProps {
  prescriptions: { id: number; diagnosis: string | null; doctor_name: string | null }[];
  onSave: (data: Parameters<typeof createConsultation>[0]) => void;
  onCancel: () => void;
}

function AddConsultationForm({ prescriptions, onSave, onCancel }: AddConsultationFormProps) {
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [reason, setReason] = useState("");
  const [prescriptionId, setPrescriptionId] = useState<number | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) return;
    onSave({
      doctor_name: doctorName || undefined,
      specialty: specialty || undefined,
      scheduled_at: new Date(scheduledAt).toISOString(),
      location: location || undefined,
      reason: reason || undefined,
      prescription_id: prescriptionId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-brand-200 bg-brand-50/30 p-4 space-y-3">
      <p className="text-sm font-medium text-slate-800">Schedule consultation</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Doctor name</label>
          <input
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="Dr. Sharma"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Specialty</label>
          <input
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Cardiologist"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Date & time *</label>
          <input
            required
            type="datetime-local"
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Location</label>
          <input
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City Hospital, Room 4"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Reason / symptoms</label>
        <textarea
          rows={2}
          className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Follow-up for hypertension management…"
        />
      </div>

      {prescriptions.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-slate-500">Link to prescription (optional)</label>
          <select
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={prescriptionId ?? ""}
            onChange={(e) =>
              setPrescriptionId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">None</option>
            {prescriptions.map((rx) => (
              <option key={rx.id} value={rx.id}>
                {rx.diagnosis || rx.doctor_name || `Prescription #${rx.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

// ── main component ─────────────────────────────────────────────────────────

interface TreatmentTrackerProps {
  prescriptions: { id: number; diagnosis: string | null; doctor_name: string | null }[];
}

export function TreatmentTracker({ prescriptions }: TreatmentTrackerProps) {
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllConsultations, setShowAllConsultations] = useState(false);
  const [error, setError] = useState("");
  const [loggingId, setLoggingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getTrackingSummary(7), listConsultations()]);
      setSummary(s);
      setAllConsultations(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracking data");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleTaken(medId: number) {
    setLoggingId(medId);
    try {
      await logDose(medId, { skipped: false });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log dose");
    } finally {
      setLoggingId(null);
    }
  }

  async function handleSkipped(medId: number) {
    setLoggingId(medId);
    try {
      await logDose(medId, { skipped: true });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log dose");
    } finally {
      setLoggingId(null);
    }
  }

  async function handleAddConsultation(data: Parameters<typeof createConsultation>[0]) {
    try {
      await createConsultation(data);
      setShowAddForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save consultation");
    }
  }

  async function handleUpdateStatus(id: number, status: string) {
    try {
      await updateConsultation(id, { status });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDeleteConsultation(id: number) {
    try {
      await deleteConsultation(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const activeMeds = summary?.medications ?? [];
  const pendingToday = activeMeds.filter((m) => !m.logged_today).length;
  const displayedConsultations = showAllConsultations
    ? allConsultations
    : allConsultations.filter((c) => c.status === "scheduled").slice(0, 3);

  return (
    <Card id="treatment-tracker">
      <CardHeader
        title="Treatment Tracker"
        subtitle={
          activeMeds.length > 0
            ? `${pendingToday} medication${pendingToday !== 1 ? "s" : ""} pending today`
            : "Track your medication adherence"
        }
        icon={<Activity className="h-4 w-4" />}
      />

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Medications */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Active medications — last 7 days adherence
        </h3>
        {activeMeds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
            No active medications found. Upload a prescription to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {activeMeds.map((med) => (
              <MedicationRow
                key={med.medication_id}
                med={med}
                onTaken={loggingId === null ? handleTaken : () => {}}
                onSkipped={loggingId === null ? handleSkipped : () => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Consultations */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Doctor consultations
          </h3>
          <div className="flex gap-2">
            {allConsultations.length > 3 && (
              <button
                onClick={() => setShowAllConsultations((s) => !s)}
                className="text-xs text-brand-600 hover:underline"
              >
                {showAllConsultations ? "Show upcoming" : `View all (${allConsultations.length})`}
              </button>
            )}
            <button
              onClick={() => setShowAddForm((s) => !s)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-3">
            <AddConsultationForm
              prescriptions={prescriptions}
              onSave={handleAddConsultation}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {displayedConsultations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
            No consultations scheduled. Click "Schedule" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedConsultations.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
              >
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {c.doctor_name || "Doctor visit"}
                    </span>
                    {c.specialty && (
                      <span className="text-xs text-slate-500">{c.specialty}</span>
                    )}
                    <Badge tone={consultationStatusTone(c.status)}>{c.status}</Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(c.scheduled_at)}
                  </p>
                  {c.location && (
                    <p className="text-xs text-slate-500">{c.location}</p>
                  )}
                  {c.reason && (
                    <p className="mt-1 text-xs text-slate-600">{c.reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(c.id, "completed")}
                        title="Mark completed"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(c.id, "cancelled")}
                        title="Cancel appointment"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteConsultation(c.id)}
                    title="Delete"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}