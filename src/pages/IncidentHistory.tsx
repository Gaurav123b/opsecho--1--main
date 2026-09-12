import React, { useState, useEffect } from "react";
import { History, Search, Filter, Calendar, ChevronRight, Activity, ShieldAlert } from "lucide-react";
import client from "../api/client";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await client.get("/incidents");
      // For now, filter for resolved/closed if needed, or show all
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Incident Archive</h1>
          <p className="text-text-muted">Review past incidents, timelines, and post-mortem reports.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-text-primary dark:text-text-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl hover:bg-bg-primary dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-text-primary dark:text-text-primary shadow-sm dark:shadow-none">
            <Calendar className="w-4 h-4" />
            All Time
          </button>
        </div>
      </div>

      <div className="bg-bg-surface dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle shadow-sm dark:shadow-none rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-primary dark:bg-bg-surface/[0.02] border-b border-border-subtle dark:border-border-subtle">
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Room</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Incident</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Severity</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Created</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <tr key={i}>
                  <td colSpan={6} className="px-8 py-6 animate-pulse">
                    <div className="h-4 bg-bg-surface dark:bg-bg-surface/5 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : incidents.length > 0 ? (
              incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-bg-primary dark:hover:bg-bg-surface/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-bg-surface dark:bg-bg-surface rounded border border-border-subtle dark:border-border-subtle text-text-muted dark:text-text-muted">
                      {incident.roomCode}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold truncate max-w-[200px]">{incident.title}</p>
                    <p className="text-[10px] text-text-muted mt-1">{incident.service} • {incident.environment}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border",
                      incident.severity === 'SEV-1' ? 'bg-red-50 dark:bg-state-conflict/10 text-red-600 dark:text-state-conflict border-red-200 dark:border-state-conflict/20' :
                      incident.severity === 'SEV-2' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-500/20' :
                      'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20'
                    )}>
                      <ShieldAlert className="w-3 h-3" />
                      {incident.severity}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        incident.status === 'RESOLVED' ? "bg-emerald-500" : "bg-blue-500"
                      )} />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{incident.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-text-muted">{new Date(incident.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      to={`/incident/${incident.id}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-text-muted group-hover:text-text-primary dark:group-hover:text-white transition-colors"
                    >
                      View Report
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <p className="text-text-muted italic">No historical records found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
