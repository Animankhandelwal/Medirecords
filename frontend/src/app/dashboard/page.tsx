"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDashboard, type DashboardStats } from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  Brain,
  FileDown,
  FileText,
  FlaskConical,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  Send,
  Shield,
  Star,
  TrendingUp,
  UploadCloud,
  Zap,
} from "lucide-react";

// ── Scroll-reveal hook ────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ── Feature data ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: UploadCloud,
    color: "bg-brand-100 text-brand-600",
    title: "Smart Upload",
    desc: "Upload prescriptions, lab reports, and discharge summaries as PDF or photos. Any format, instantly processed.",
    href: "/dashboard/records",
  },
  {
    icon: Brain,
    color: "bg-purple-100 text-purple-600",
    title: "AI Extraction",
    desc: "Google Vision OCR + LLM intelligence automatically reads your documents and structures every data point.",
    href: "/dashboard/records",
  },
  {
    icon: FlaskConical,
    color: "bg-blue-100 text-blue-600",
    title: "Lab Trend Charts",
    desc: "Track how your HbA1c, cholesterol, creatinine, and other values evolve across reports over time.",
    href: "/dashboard/lab-reports",
  },
  {
    icon: Pill,
    color: "bg-emerald-100 text-emerald-600",
    title: "Prescription Vault",
    desc: "Every medication is extracted — name, dosage, frequency, duration — and stored in a searchable vault.",
    href: "/dashboard/prescriptions",
  },
  {
    icon: Activity,
    color: "bg-amber-100 text-amber-600",
    title: "Treatment Tracker",
    desc: "Log daily doses, track adherence percentage, and schedule doctor consultations with reminders.",
    href: "/dashboard/treatment",
  },
  {
    icon: FileDown,
    color: "bg-rose-100 text-rose-600",
    title: "Doctor Reports",
    desc: "Generate beautifully formatted pre-consultation PDFs summarizing your records for any specialist.",
    href: "/dashboard/assistant",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your documents",
    desc: "Drag & drop any medical document — prescriptions, lab reports, discharge summaries — in PDF or image format.",
    color: "from-brand-500 to-brand-700",
  },
  {
    number: "02",
    title: "AI reads and organizes",
    desc: "Our Google Vision + LLM pipeline extracts medications, lab values, diagnoses, and doctor details automatically.",
    color: "from-purple-500 to-purple-700",
  },
  {
    number: "03",
    title: "Track, analyze, share",
    desc: "Monitor trends, log daily doses, schedule appointments, and generate specialist reports — all in one place.",
    color: "from-emerald-500 to-emerald-700",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Software Engineer",
    avatar: "PS",
    rating: 5,
    text: "I used to carry a folder of papers to every doctor visit. Now I just pull up MedRecords on my phone and the doctor has everything — it's a game changer.",
    color: "from-brand-500 to-purple-600",
  },
  {
    name: "Rahul Menon",
    role: "Retired Teacher",
    avatar: "RM",
    rating: 5,
    text: "Managing 7 different medications was a nightmare. The treatment tracker tells me exactly what I've taken and when. My adherence has gone from 60% to 95%.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Dr. Ananya Reddy",
    role: "General Physician",
    avatar: "AR",
    rating: 5,
    text: "I actually recommend this to my patients. When they show up with a MedRecords summary PDF, our consultation is twice as efficient.",
    color: "from-amber-500 to-orange-600",
  },
];

const STATS = [
  { label: "Documents Processed", value: "50,000+", icon: FileText },
  { label: "Extraction Accuracy", value: "98.2%", icon: Zap },
  { label: "Data Encrypted", value: "100%", icon: Lock },
  { label: "Users Trust Us", value: "10,000+", icon: Shield },
];

const QUICK_ACTIONS = [
  { href: "/dashboard/records",       icon: UploadCloud, label: "Upload Record",       color: "bg-brand-600 hover:bg-brand-700" },
  { href: "/dashboard/lab-reports",   icon: FlaskConical,label: "View Lab Trends",    color: "bg-blue-600 hover:bg-blue-700" },
  { href: "/dashboard/prescriptions", icon: Pill,        label: "My Prescriptions",   color: "bg-emerald-600 hover:bg-emerald-700" },
  { href: "/dashboard/treatment",     icon: Activity,    label: "Track Treatment",     color: "bg-amber-500 hover:bg-amber-600" },
  { href: "/dashboard/assistant",     icon: MessageCircle,label: "AI Assistant",      color: "bg-purple-600 hover:bg-purple-700" },
  { href: "/dashboard/assistant",     icon: FileDown,    label: "Generate Report",    color: "bg-rose-600 hover:bg-rose-700" },
];

// ── Sub-components ────────────────────────────────────────────────────────

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function FeatureCard({
  icon: Icon, color, title, desc, href, delay,
}: (typeof FEATURES)[0] & { delay: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        visible ? `animate-fade-in-up ${delay}` : "opacity-0"
      }`}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-slate-500">{desc}</p>
      <Link
        href={href}
        className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
      >
        Go to {title} →
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  useEffect(() => {
    getDashboard().then(setStats).catch(() => {});
  }, []);

  const heroReveal = useReveal();
  const statsReveal = useReveal();
  const stepsReveal = useReveal();
  const testiReveal = useReveal();
  const contactReveal = useReveal();

  function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setContactSent(true);
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  }

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 px-4 py-20">

        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="animate-blob-delay absolute top-20 right-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="animate-blob-delay2 absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
          {/* Spinning ring */}
          <div className="animate-spin-slow absolute right-1/4 top-1/4 h-[600px] w-[600px] rounded-full border border-white/5" />
          <div className="animate-spin-slow absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full border border-white/5" style={{ animationDirection: "reverse", animationDuration: "30s" }} />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left: text */}
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                AI-Powered Health Records
              </div>

              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your Health Records,{" "}
                <span
                  className="gradient-text animate-gradient bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400"
                >
                  Intelligently Organized
                </span>
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-relaxed text-slate-400">
                Upload prescriptions and lab reports once. MedRecords extracts every medication, lab value, and diagnosis — then helps you track treatment, spot trends, and walk into every doctor visit fully prepared.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/records"
                  className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-brand-500/25"
                >
                  <UploadCloud className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  Go to My Records
                </Link>
                <Link
                  href="/dashboard/assistant"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Try AI Assistant
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-slate-600" /> End-to-end encrypted</span>
                <span className="h-3.5 w-px bg-slate-700" />
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-600" /> Private by default</span>
                <span className="h-3.5 w-px bg-slate-700" />
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-slate-600" /> Instant processing</span>
              </div>
            </div>

            {/* Right: floating stat cards */}
            <div ref={heroReveal.ref} className="relative hidden items-center justify-center lg:flex" style={{ minHeight: 420 }}>

              {/* Central glow */}
              <div className="absolute h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />

              {/* Main card */}
              <div className={`glass relative z-10 rounded-2xl p-6 ${heroReveal.visible ? "animate-fade-in-up" : "opacity-0"}`}>
                <div className="mb-3 flex items-center gap-2 text-white/80 text-xs font-medium uppercase tracking-wider">
                  <Activity className="h-3.5 w-3.5" /> Your Health Overview
                </div>
                <div className="grid grid-cols-2 gap-3 text-white">
                  {[
                    { icon: FileText, label: "Prescriptions", val: stats?.prescription_count ?? "—", color: "text-brand-300" },
                    { icon: Pill, label: "Medications", val: stats?.medication_count ?? "—", color: "text-emerald-300" },
                    { icon: FlaskConical, label: "Lab Reports", val: stats?.lab_report_count ?? "—", color: "text-blue-300" },
                    { icon: AlertTriangle, label: "Abnormal", val: stats?.abnormal_lab_values ?? "—", color: "text-amber-300" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/10 p-3">
                      <item.icon className={`h-4 w-4 ${item.color} mb-1`} />
                      <p className="text-2xl font-bold">{item.val}</p>
                      <p className="text-xs text-white/60">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating pill card */}
              <div className={`glass animate-float absolute -top-4 -right-4 z-20 rounded-xl p-3 ${heroReveal.visible ? "animate-fade-in delay-300" : "opacity-0"}`}>
                <div className="flex items-center gap-2 text-white text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/30">
                    <Pill className="h-3.5 w-3.5 text-emerald-300" />
                  </span>
                  <div>
                    <p className="font-medium text-xs">Metformin 500mg</p>
                    <p className="text-white/50 text-xs">Twice daily · Active</p>
                  </div>
                </div>
              </div>

              {/* Floating lab card */}
              <div className={`glass animate-float-delay absolute -bottom-6 -left-4 z-20 rounded-xl p-3 ${heroReveal.visible ? "animate-fade-in delay-500" : "opacity-0"}`}>
                <div className="flex items-center gap-2 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/30">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-300" />
                  </span>
                  <div>
                    <p className="font-medium text-xs text-white">HbA1c 6.8%</p>
                    <p className="text-white/50 text-xs">↓ 0.4% from last report</p>
                  </div>
                </div>
              </div>

              {/* Quick actions floating */}
              <div className={`glass animate-float absolute bottom-8 right-0 z-20 rounded-xl p-3 ${heroReveal.visible ? "animate-fade-in delay-400" : "opacity-0"}`}>
                <p className="mb-2 text-xs font-medium text-white/70">Quick actions</p>
                <div className="flex gap-1.5">
                  {[UploadCloud, FlaskConical, MessageCircle].map((Icon, i) => (
                    <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white/80">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 60" className="w-full text-slate-50" fill="currentColor" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── QUICK ACCESS ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
            Jump straight in
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${action.color}`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-center text-xs font-medium leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">Features</p>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Everything your health needs,{" "}
              <span className="gradient-text bg-gradient-to-r from-brand-600 to-purple-600">in one place</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              From document upload to AI extraction to daily dose tracking — MedRecords handles the full lifecycle of your medical records.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                {...f}
                delay={`delay-${(i % 3) * 100 + 100}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-24" ref={stepsReveal.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">How it works</p>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute top-8 left-1/4 right-1/4 hidden h-px bg-gradient-to-r from-brand-200 via-purple-200 to-emerald-200 md:block" />

            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`text-center ${stepsReveal.visible ? `animate-fade-in-up delay-${i * 200 + 100}` : "opacity-0"}`}
              >
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-xl font-black text-white shadow-lg`}>
                  {step.number}
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-4 py-20" ref={statsReveal.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center ${statsReveal.visible ? `animate-fade-in-up delay-${i * 150 + 100}` : "opacity-0"}`}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20">
                  <stat.icon className="h-6 w-6 text-brand-400" />
                </div>
                <p className="gradient-text mb-1 bg-gradient-to-r from-brand-400 to-purple-400 text-4xl font-black">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-24" ref={testiReveal.ref}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">Reviews</p>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Trusted by patients and doctors
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  testiReveal.visible ? `animate-fade-in-up delay-${i * 200 + 100}` : "opacity-0"
                }`}
              >
                {/* Top accent */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.color}`} />

                <StarRow n={t.rating} />
                <p className="my-4 text-sm leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-24" ref={contactReveal.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="grid lg:grid-cols-2">

              {/* Left: info */}
              <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-10 text-white">
                <h2 className="mb-4 text-3xl font-extrabold">Get in touch</h2>
                <p className="mb-8 text-brand-200">
                  Have questions, feedback, or need support? We&apos;d love to hear from you.
                </p>

                <div className="space-y-5">
                  {[
                    { icon: Mail, label: "Email", value: "support@medrecords.app" },
                    { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                    { icon: MapPin, label: "Location", value: "Bangalore, India" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-brand-300">{item.label}</p>
                        <p className="text-sm text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decorative blobs */}
                <div className="pointer-events-none mt-16 flex gap-4 opacity-20">
                  <div className="h-24 w-24 animate-blob rounded-full bg-white blur-2xl" />
                  <div className="h-16 w-16 animate-blob-delay rounded-full bg-brand-300 blur-xl" />
                </div>
              </div>

              {/* Right: form */}
              <div
                className={`p-10 ${contactReveal.visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}
              >
                {contactSent ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Send className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">Message sent!</h3>
                    <p className="text-slate-500">We&apos;ll get back to you within 24 hours.</p>
                    <button
                      onClick={() => setContactSent(false)}
                      className="mt-6 text-sm font-medium text-brand-600 hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="space-y-5">
                    <h3 className="text-xl font-bold text-slate-900">Send us a message</h3>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Full name</label>
                      <input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Priya Sharma"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Email address</label>
                      <input
                        required
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="priya@example.com"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Message</label>
                      <textarea
                        required
                        rows={4}
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder="Tell us how we can help…"
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg"
                    >
                      <Send className="h-4 w-4" />
                      Send message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 px-4 py-10 text-center text-xs text-slate-500">
        <p className="mb-1 font-semibold text-white">MedRecords</p>
        <p>Your health records, intelligently organized. Private, secure, always yours.</p>
        <p className="mt-4">© {new Date().getFullYear()} MedRecords. All rights reserved.</p>
      </footer>

    </div>
  );
}