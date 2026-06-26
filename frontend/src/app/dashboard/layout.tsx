import { Navbar } from "@/components/dashboard/navbar";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">{children}</div>
      <ChatWidget />
    </div>
  );
}