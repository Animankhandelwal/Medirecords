const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore parse error, fall back to statusText
    }
    throw new Error(detail);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function register(data: {
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthResponse> {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<User> {
  return request("/auth/me");
}

export interface DocumentRecord {
  id: number;
  file_name: string;
  file_url: string;
  document_type: string | null;
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_error: string | null;
  doctor_name: string | null;
  hospital_name: string | null;
  document_date: string | null;
  created_at: string;
}

export function uploadDocument(file: File): Promise<{ id: number; status: string; file_name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return request("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export function listDocuments(): Promise<DocumentRecord[]> {
  return request("/documents/");
}

export function getDocument(id: number): Promise<DocumentRecord> {
  return request(`/documents/${id}`);
}

export interface LabValue {
  id: number;
  test_name: string;
  test_name_normalized: string | null;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  reference_range_text: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
  is_abnormal: boolean | null;
  category: string | null;
}

export interface LabReport {
  id: number;
  lab_name: string | null;
  doctor_name: string | null;
  report_date: string | null;
  report_type: string | null;
  notes: string | null;
  lab_values: LabValue[];
}

export function listLabReports(): Promise<LabReport[]> {
  return request("/medical/lab-reports");
}

export interface LabTrendPoint {
  date: string | null;
  value: number | null;
  unit: string | null;
  is_abnormal: boolean | null;
  reference_range_text: string | null;
}

export function getLabTrend(testName: string): Promise<LabTrendPoint[]> {
  return request(`/medical/lab-trends/${encodeURIComponent(testName)}`);
}

export interface Medication {
  id: number;
  name: string;
  generic_name: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  purpose: string | null;
  instructions: string | null;
  is_active: boolean;
}

export interface Prescription {
  id: number;
  doctor_name: string | null;
  hospital_name: string | null;
  diagnosis: string | null;
  prescription_date: string | null;
  notes: string | null;
  medications: Medication[];
}

export function listPrescriptions(): Promise<Prescription[]> {
  return request("/medical/prescriptions");
}

export interface DashboardStats {
  prescription_count: number;
  medication_count: number;
  lab_report_count: number;
  abnormal_lab_values: number;
}

export function getDashboard(): Promise<DashboardStats> {
  return request("/medical/dashboard");
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore parse error, fall back to statusText
    }
    throw new Error(detail);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export function listSpecialists(): Promise<string[]> {
  return request("/report/specialists");
}

export async function generateReportPdf(data: {
  specialist_type: string;
  symptoms: string;
  additional_context?: string;
}): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/report/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore parse error, fall back to statusText
    }
    throw new Error(detail);
  }
  return res.blob();
}