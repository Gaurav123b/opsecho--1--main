import React from "react";
import { Users, ShieldAlert, Activity, BarChart3, Settings, ShieldCheck, Database, Key } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: "142", icon: Users, color: "text-accent" },
    { label: "Active Incidents", value: "3", icon: Activity, color: "text-state-conflict" },
    { label: "Resolved Today", value: "12", icon: ShieldCheck, color: "text-state-fact" },
    { label: "AI Jobs Processed", value: "1.4k", icon: BarChart3, color: "text-purple-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Control Center</h1>
          <p className="text-text-muted">Global system oversight and user management.</p>
        </div>
        <button className="px-6 py-2.5 bg-bg-surface text-black font-bold rounded-xl hover:bg-bg-surface transition-all text-sm">
          System Maintenance
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bg-surface dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle p-6 rounded-3xl hover:bg-zinc-900/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-bg-surface/5 flex items-center justify-center">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global</span>
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-bg-surface dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-accent" />
            <h3 className="font-bold">Infrastructure Status</h3>
          </div>
          <div className="space-y-4">
            <StatusRow label="Database (PostgreSQL)" status="Operational" />
            <StatusRow label="AI Engine (Gemini)" status="Operational" />
            <StatusRow label="Voice (Agora)" status="Operational" />
            <StatusRow label="Real-time (Socket.io)" status="Operational" />
          </div>
        </section>

        <section className="bg-bg-surface dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold">Recent Audit Logs</h3>
          </div>
          <div className="space-y-4">
            <AuditRow user="System" action="Automated report generated" time="2m ago" />
            <AuditRow user="Admin" action="Updated user role: SRE" time="15m ago" />
            <AuditRow user="System" action="New incident room initialized" time="1h ago" />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-bg-surface/5 rounded-2xl border border-border-subtle">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-state-fact uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}

function AuditRow({ user, action, time }: { user: string, action: string, time: string }) {
  return (
    <div className="flex items-center justify-between text-xs p-2 border-b border-border-subtle last:border-0 pb-4 last:pb-0">
      <div className="space-y-1">
        <p className="font-bold text-zinc-300">{action}</p>
        <p className="text-text-muted text-[10px]">By <span className="text-accent">{user}</span></p>
      </div>
      <span className="text-text-muted text-[10px]">{time}</span>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
