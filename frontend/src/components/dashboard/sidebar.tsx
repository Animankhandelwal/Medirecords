"use client";

import { ActivitySquare, FileText, FlaskConical, LayoutDashboard, LogOut, Pill, Stethoscope } from "lucide-react";
import type { User } from "@/lib/api";

const NAV_ITEMS = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#documents", label: "Documents", icon: FileText },
  { href: "#lab-levels", label: "Lab levels", icon: FlaskConical },
  { href: "#prescriptions", label: "Prescriptions", icon: Pill },
  { href: "#report-generator", label: "Generate report", icon: Stethoscope },
];

export function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <aside className="hidden w-64 flex-col bg-slate-950 text-slate-300 lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <ActivitySquare className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold text-white">MedRecords</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.full_name || "—"}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}